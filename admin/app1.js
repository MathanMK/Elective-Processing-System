//jshint esversion:6
require('dotenv').config();

const crypto=require ('crypto')
const nodemailer = require('nodemailer');
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate =  require('mongoose-findorcreate');
const { render } = require('express/lib/response');
// const md5 = require("md5");
// const bcrypt = require("bcrypt");
// const saltRound = 10;

const app = express();
const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  // The standard secure default length for RSA keys is 2048 bits
  modulusLength: 2048,
});

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

mongoose.connect("mongodb://localhost:27017/electiveDB");


const userSchema = new mongoose.Schema({
  email: String,
  roll_no:String,
  password: String,
  googleId: String,
  secret: String
});




const Course = require("./models/course");
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User",userSchema);
const Teacher =require("./models/teacher");
const Entry=require("./models/entry");
module.exports={Entry,Teacher,User,Course};
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
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",function(req,res){
  res.render("home");
});

app.get('/auth/google',
  passport.authenticate("google", { scope: ["profile"] }));

app.get('/auth/google/secrets',
passport.authenticate('google', { failureRedirect: "/login" }),
function(req, res) {
  // Successful authentication, redirect home.
  res.redirect('/secrets');
});

app.get("/login",function(req,res){
  res.render("login");
});

app.get("/register",function(req,res){
  res.render("register");
});

app.get("/course",function(req,res){
  res.render("course");
});
app.get("/entry",function(req,res){
  res.render("entryform");
});

app.get('/entries', function(req, res, next) {
  Entry.find({}, function(err, products) {
      res.render('entries', { title: 'Registered List', courses: products });
  });
});

app.post("/entryT",function(req,res){
  Entry.countDocuments({courseId:req.body.course},function(err,count){
    if (err){
      console.log(err);
    }
    else{
      console.log(count)
      if (count<3){
        var en=new Entry({
          courseId:req.body.course,
          roll_no:req.body.rollno
        });
        console.log(en.roll_no);
        en.save(function(err,res){
          if (err){
            console.log(err)
          }
          else{
            console.log("Entry Successful");
          }
        })
      }
      else{
        console.log("cap reached")
      }
      res.redirect("/entry")
    }
  })

});
app.get("/teacher",function(req,res){
  res.render("teacher")
})

app.get("/submit",function(req,res){
  if (req.isAuthenticated()){
    res.render("submit");
  }else{
    res.redirect("/login");
  }
})

app.get("/secrets",function(req,res){
User.find({"secret":{$ne:null}}, function(err, foundUser){
  if(err){
    console.log(err);
  }else{
    if(foundUser){
      res.render("secrets", {userswithSecrets: foundUser});
    }
  }
});
});

app.get('/course_list', function(req, res, next) {
  Course.find({}, function(err, products) {
      res.render('clist', { title: 'Express', courses: products });
  });
});

app.get('/success', function(req, res, next) {

      res.render('success');
  
});

app.get('/elechome', function(req, res, next) {

      res.render('elec_home');
 
});


app.get("/application",function(req,res,next){
  res.render('application');
})


app.get('/teach_list', function(req, res, next) {
  Teacher.find({}, function(err, products) {
      res.render('techlist', { title: 'Express', courses: products });
  });
});

app.get('/preference', function(req, res, next) {
  Entry.aggregate([{$group:{_id:"$courseId",count:{$sum:1}}}], function(err, products) {
   
    res.render('preference', { title: 'Express', courses: products });
})
});

app.get('/caplist', function(req, res, next) {
  Entry.aggregate([{$group:{_id:"$courseId",count:{$sum:1}}}], function(err, products) {
      res.render('caplist', { title: 'Express', courses: products });
  })
});


app.post('/preference',  function(req, res) {
  // for (i=1;i<=req.body['counter'];i++){
  //   var dr=req.body[i.toString()];
  //   let cnt =await Entry.find({"courseId":dr}).count()
  // }
   
 Entry.aggregate([{$group:{_id:"$courseId",count:{$sum:1}}}], function (err,docs) {
    global.doc=docs;
    console.log(global.doc.length)
    var f=0
  console.log(req.body)
    for (i=1;i<=req.body['counter'];i++){
      for (j=0;j<global.doc.length;j++){
        if(global.doc[j]!=undefined && f==0){
          //console.log(global.doc[j]._id+" "+j)
         if (req.body[i.toString()]==docs[j]._id){
           if (global.doc[j].count<4){
             console.log(req.body[i.toString()])
             var en=new Entry({
               courseId:req.body[i.toString()],
               rollno:req.body.rollno
             });
             
             en.save(function(err,res){
               if (err){
                 console.log(err)
               }
               else{
              
       
               
                
                 console.log("Entry Successful");
                
               }
             })
             f=1;
             break;
            }
           else{
             console.log(docs[i]._id+" cap reached")
           }
         }
        }
        
              

        var transport = nodemailer.createTransport({
          host: "smtp.mailtrap.io",
          port: 2525,
          auth: {
            user: "0329c77a66f28f",
            pass: "d4f84b3effa5a4"
          }
        });
        
        var mailOptions = {
          from: "chaitanyavadlamannati@gmail.com",
          to: req.body.mail,
          subject: "Elective registration",
          text: "succesfully registered",
        };
        

         transport.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log(error);
            
          } else {
            //response to the user that mail is successfully sent
            console.log("sent");
          
          }
        });
              
        return res.redirect("/success")
      }
    }
    
  })

 
  //console.log(req.body)
  //console.log(parseInt(req.body["counter"]))
});
app.get("/logout", function(req,res){
  req.logout();
  res.redirect("/");
});

app.post("/register",function(req,res){

  User.register({username: req.body.username}, req.body.password, function(err, user){
    if(err){
      console.log(err);
      res.redirect("/register")
    }else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      });
    }
  });
 
});

 

// Teacher.findOne({'username':"Sikha"},(error,data)=>{
//   if (error){
//     console.log(error);
//   }
//   else{
   
//     console
//     .log(data._id);
//     return data._id;
    
//   }
// })

app.post("/entry",function(req,res){

  var result = new Entry({
    courseId: req.body.course,
  rollno:req.body.rollno
  });
  

  result.save(function(err,res){
    if(err){
      console.log(err);
    }
    else{
   
      console.log("Successful");
    }
  })
})

app.post("/course",function(req,res){

  var result = new Course({
    courseId: req.body.c_id,
    
    courseName: req.body.c_name,
    semester:req.body.sem,
    elective_id:req.body.e_id,
    dept_id:req.body.dept_id,
    courseCredit: req.body.cc,
    assignedTeacher:req.body.fac
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

app.post("/teacher",function(req,res){
  
const encryptedData = crypto.publicEncrypt(
  {
    key: publicKey,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: "sha256",
  },
  // We convert the data string to a buffer using `Buffer.from`
  Buffer.from(req.body.usern)
);

// The encrypted data is in the form of bytes, so we print it in base64 format
// so that it's displayed in a more readable form
console.log("encypted data: ", encryptedData.toString("base64"));
const encryptedD = crypto.publicEncrypt(
  {
    key: publicKey,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: "sha256",
  },
  Buffer.from(req.body.pos)
);
console.log("encypted data: ", encryptedD.toString("base64"));

  var result = new Teacher({
    username: req.body.usern,
    password: req.body.pass,
  
    
    position:req.body.pos,
    dept_id:req.body.dept_id
  });
  result.save(function(err,res){
    if(err){
      console.log(err);
    }
    else{
      console.log("Successful");
    }
  })
  return res.redirect("/teacher");
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
      res.redirect("/secrets");
    });
  }
});

});

app.post("/submit",function(req,res){
  const submittedSecret = req.body.secret;
  User.findById(req.user.id,function(err,foundUser){
    if(err){
      console.log(err);
    }else{
      if(foundUser){
        foundUser.secret = submittedSecret;
        foundUser.save();
        res.redirect("/secrets")
      }
    }
  });
});

app.listen(4000,function(){
  console.log("server started in port 4000");
});



////Uing  bcrypt
// app.post("/register",function(req,res){
//
//  bcrypt.hash( req.body.password, saltRound, function(err,hash){
//    const newUser = new User({
//      email: req.body.username,
//      password: hash
//    });
//
//    newUser.save(function(err){
//      if(err){
//        console.log(err);
//      }else{
//        res.render("secrets");
//      }
//    });
//  });
//
// });


// app.post("/login",function(req,res){
//   const username = req.body.username;
//   const password = req.body.password;
//
// User.findOne({email: username},function(err,foundUser){
//   if(err){
//     console.log(err);
//   }else{
//     if(foundUser){
//       bcrypt.compare(password, foundUser.password, function(err, result){
//         if(result === true){
//           res.render("secrets");
//         }
//       })
//     }
//   }
// });
//
// });

module.exports=app;