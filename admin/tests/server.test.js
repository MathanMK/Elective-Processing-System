const app = require("../app");
const Teacher =require("../models/teacher");
const Course =require("../models/course");
const Entry=require("../models/entry");
const mongoose = require("mongoose");
const supertest = require("supertest");

beforeEach((done) => {
  mongoose.connect("mongodb://localhost:27017/userDB",
    () => done());
});




test("GET /teacher",  () => {
  const en = Teacher.create({username: "prashant",
    password: "prashant",
    
   
    
    position: "proff",
    dept_id:"cse" });

  supertest(app).get("/teacher")
    .expect(200)
    .then((response) => {
      // Check type and length
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toEqual(1);

      // Check data
      expect(response.body[0]._id).toBe(en.id);
      expect(response.body[0].username).toBe(en.username);
      expect(response.body[0].password).toBe(en.password);
      expect(response.body[0].position).toBe(en.position);
      expect(response.body[0].dept_id).toBe(en.dept_id);
    });
});

test("GET /course",  () => {
    const en = Course.create({courseId:"CSE432",
        courseName: "BIOINFORMATICS",
        semester:7,
        elective_id:"elective_1",
        dept_id:"CSE",
        courseCredit: 3,
        assignedTeacher: "prashant"});
  
    supertest(app).get("/course")
      .expect(200)
      .then((response) => {
        // Check type and length
        expect(Array.isArray(response.body)).toBeTruthy();
        expect(response.body.length).toEqual(1);
  
        // Check data
        expect(response.body[0]._id).toBe(en.id);
        expect(response.body[0].courseId).toBe(en.courseid);
        expect(response.body[0].courseName).toBe(en.courseName);
        expect(response.body[0].semester).toBe(en.semester);
        expect(response.body[0].dept_id).toBe(en.dept_id);
        expect(response.body[0].courseCredit).toBe(en.courseCredit);
        expect(response.body[0].assignedTeacher).toBe(en.assignedTeacher);
      });
  });
  
  

test("GET /entry",  () => {
    const en = Entry.create({ courseId:"CSE432",
        rollno:"321"});
  
    supertest(app).get("/entry")
      .expect(200)
      .then((response) => {
        // Check type and length
        expect(Array.isArray(response.body)).toBeTruthy();
        expect(response.body.length).toEqual(1);
  
        // Check data
        expect(response.body[0]._id).toBe(en.id);
        expect(response.body[0].courseId).toBe(en.courseId);
        expect(response.body[0].rollno).toBe(en.rollno);
       
      });
  });
  

  test("POST /entry",  () => {
    const data = { courseId:"CSE432",
    rollno:"321"}
  
     supertest(app).post("/entry")
      .send(data)
      .expect(200)
      .then( (response) => {
        // Check the response
        expect(Array.isArray(response.body)).toBeTruthy();
        expect(response.body.length).toEqual(1);
  
        // Check data
        expect(response.body[0]._id).toBe(en.id);
        expect(response.body[0].courseId).toBe(en.courseId);
        expect(response.body[0].rollno).toBe(en.rollno);
  
        // Check data in the database
        const post = Entry.findOne({ _id: response.body._id });
        expect(post).toBeTruthy();
        expect(post.courseId).toBe(data.courseId);
        expect(post.rollno).toBe(data.rollno);
      });
  });
  