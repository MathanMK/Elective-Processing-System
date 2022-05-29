//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
var OutlookStrategy = require('passport-outlook').Strategy;
var AzureAdOAuth2Strategy = require('passport-azure-ad-oauth2').Strategy;
const findOrCreate =  require('mongoose-findorcreate');
var jwt = require('jsonwebtoken');
var token = jwt.sign({ foo: 'bar' }, 'shhhhh');


const app = express();


app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
  secret: "A long sentence.",
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");


const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  googleId: String,
  secret: String
});

var CourseSchema = new mongoose.Schema({
    courseId: { type: String, required: true, index: true },
    courseName: { type: String, required: true },
    semester:{type:Number,required:true},
    elective_id:{type:String,required:true},
    dept_id:{type:String,required:true},
    courseCredit: { type: Number, default: 0, min: 0, max: 12 },

});

const Course = new mongoose.model("Course",CourseSchema);

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username, name: user.name });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/elective",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new AzureAdOAuth2Strategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: 'https://localhost:3000/auth/azureadoauth2/elective'
},
function (accessToken, refresh_token, params, profile, done) {
  var waadProfile = profile || jwt.decode(params.id_token);
  User.findOrCreate({ id: waadProfile.upn }, function (err, user) {
    done(err, user);
  });
}));


app.get("/",function(req,res){
  res.render("home");
});

app.get("/choose",function(req,res){
  res.render("choose");
});

app.get('/auth/google',
  passport.authenticate("google", { scope: ["profile"] }));

app.get('/auth/google/elective',
passport.authenticate('google', { failureRedirect: "/login" }),
function(req, res) {
  // Successful authentication, redirect home.
  res.redirect('/elective');
});

app.get('/auth/azureadoauth2',
  passport.authenticate('azure_ad_oauth2'));

app.get('/auth/azureadoauth2/elective', 
  passport.authenticate('azure_ad_oauth2', { failureRedirect: '/login' }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect('/elective');
  });

app.get("/login",function(req,res){
  res.render("login");
});

app.get("/register",function(req,res){
  res.render("register");
});

app.get("/elective",function(req,res){
  res.render("elective");
});

app.get("/course",function(req,res){
  res.render("course");
});

app.get("/submit",function(req,res){
  if (req.isAuthenticated()){
    res.render("submit");
  }else{
    res.redirect("/login");
  }
})


app.get("/logout", function(req,res){
  req.logout();
  res.redirect("/");
});

app.post("/register",function(req,res){

  User.register({uname: req.body.uname,username: req.body.username}, req.body.password, function(err, user){
    if(err){
      console.log(err);
      res.redirect("/home");
    }else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/elective");
      });
    }
  });

});

app.post("/logout",function(req,res){
  res.redirect("/")
})

app.post("/elective",function(req,res){
  res.redirect("/course")
})

app.post("/course",function(req,res){
  var result = new Course({
    courseId: req.body.c_id,
    courseName: req.body.c_name,
    semester:req.body.sem,
    elective_id:req.body.e_id,
    dept_id:req.body.dept_id,
    courseCredit: req.body.cc,
  });
  result.save(function(err,res){
    if(err){
      console.log(err);
    }
    else{
      console.log("Successful");
    }
  })

});

app.post("/login",function(req,res){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

req.login(user, function(err){
  if(err){
    console.log(err);
  }else{
    passport.authenticate("local")(req,res,function(){
      res.redirect("/elective");
    });
  }
});

});


app.listen(3000,function(){
  console.log("server started in port 3000");
});


