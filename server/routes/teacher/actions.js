const express = require('express');
const router = express.Router();
const mongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;
const global = require('../../global');

module.exports = () => {
  router.get('/login', (req, res, next) => {
    return res.render(require.resolve('../../views/teacher/login'));
  });

  router.post('/login', (req, res, next) => {
    const email = req.body.email;
    const secret = req.body.secret;

    mongoClient.connect(global.dbConnection, {useNewUrlParser: true }, function(err, db) {

      if (err) return res.status(200).end('failed');

      const musicDb = db.db("music");
      const query = { email: email, secret: secret };

      musicDb.collection("teachers").find(query).toArray(function(err, result) {

        if (err) return res.redirect('/teacher/login?error=1');

        if (result.length > 0) {
          const encryptedId = global.encrypt(result[0]._id.toString());
          res.cookie('tid', encryptedId);
          db.close();
          return res.redirect('/teacher/myStudents');
        } else {
          res.redirect('/teacher/login?error=1');
        }

      });
    });
  });

  router.get('/addStudent', (req, res, next) => {
    global.checkTeacherSecurity(req, res);

    mongoClient.connect(global.dbConnection, {useNewUrlParser: true }, function(err, db) {
      if (err) return res.status(200).end('failed');

      const musicDb = db.db("music");
      const query = {};

      musicDb.collection("hobbies").find(query).toArray(function(err, result) {
        return res.render(require.resolve('../../views/teacher/addStudent'), {result : result, layout: 'teacherMain'});
      });
    });
  });

  router.post('/addStudent', (req, res, next) => {
    global.checkTeacherSecurity(req, res);
    const tid = global.decrypt(req.cookies['tid'], res);
    const data = req.body.data;

    data.tid = tid;
    
    mongoClient.connect(global.dbConnection, {useNewUrlParser: true }, function(err, db) {
      if (err) return res.status(200).end('failed');

      const musicDb = db.db("music");

      musicDb.collection("students").insertOne(data, function(err, result) {
        if (err) res.status(200).send('failed');
        db.close();
        res.status(200).send('');
      });
    });
  });

  router.get('/myStudents', (req, res, next) => {
    global.checkTeacherSecurity(req, res);
    const tid = global.decrypt(req.cookies['tid'], res);

    mongoClient.connect(global.dbConnection, {useNewUrlParser: true }, function(err, db) {

      if (err) throw err;

      const musicDb = db.db("music");
      var query = { "tid": tid };

      musicDb.collection("students").find(query).toArray(function(err, studentResult) {
        if (err) throw err;
        var students = studentResult;
        var studentIds = new Array();
        for (let i = 0; i < students.length; i++) {
          studentIds.push(students[i]._id.toString());
          students[i].progress = "-"; 
        }
        
        query = { "sid": { $in: studentIds } };

        musicDb.collection("progress").find(query).toArray(function(err, progressResult) {
          if (err) throw err;
          db.close();
          for (let i = 0; i < progressResult.length; i ++) {
            var index = studentIds.indexOf(progressResult[i].sid);
            if (index >= 0) {
              if (progressResult[i].checkedArray !== undefined) {
                var percentage = Math.round(progressResult[i].checkedArray.length * 100 / progressResult[i].numPractices);
                students[index].progress = percentage + "%";
              }
              else {
                students[index].progress = 'N/A';
              }
            }
          }
          
          return res.render(require.resolve('../../views/teacher/myStudents'), {result: students, layout: 'teacherMain'});
        });
      });

    });
  });

  router.get('/studentDetail', (req, res, next) => {
    global.checkTeacherSecurity(req, res);
    mongoClient.connect(global.dbConnection, {useNewUrlParser: true }, function(err, db) {
      if (err) throw err;

      const sid = req.query.sid;
      const musicDb = db.db("music");
      var query;
      try {
        query = { "_id": ObjectId(sid) };
      } catch(e) {
        res.redirect('/error');
      }

      var student;
      var hobbies;

      musicDb.collection("students").find(query).toArray(function(err, result) {
        if (err) throw err;
        student = result[0];
      });

      musicDb.collection("hobbies").find({}).toArray(function(err, result) {
        if (err) throw err;

        hobbies = result;
        for (let i = 0; i < hobbies.length; i ++) {
          hobbies[i].checked = '';
        }
        if (student.hobbies !== null) {
          for (let i = 0; i < hobbies.length; i ++) {
            for (let j = 0; j < student.hobbies.length; j ++) {
              if (result[i].name === student.hobbies[j]) {
                hobbies[i].checked = 'checked';
                break;
              }
            }
          }
        }

        db.close();
        return res.render(require.resolve('../../views/teacher/studentDetail'), {result: student, hobbies: hobbies, layout: 'teacherMain'});
      });
    });
  });

  router.get('/studentLessons', (req, res, next) => {
    global.checkTeacherSecurity(req, res);
    const sid = req.query.sid;

    mongoClient.connect(global.dbConnection, {useNewUrlParser: true }, function(err, db) {

      if (err) throw err;

      const musicDb = db.db("music");
      var activities;
      var progressStartedDates = new Array();

      musicDb.collection("progress").find({ "sid": sid }).toArray(function(err, result) {
        if (err) throw err;
        for (let i = 0; i < result.length; i ++) {
          if (progressStartedDates.indexOf(global.formatDateToString(result[i].dueDate)) === -1) 
            progressStartedDates.push(global.formatDateToString(result[i].dueDate));
        }

        musicDb.collection("activities").find({ "sid": sid }).toArray(function(err, result) {
          if (err) throw err;
          activities = result;
          for (let i = 0; i < activities.length; i ++) {
            activities[i].dueDate = global.formatDateToString(activities[i].dueDate)
            if (progressStartedDates.indexOf(activities[i].dueDate) < 0) {
              activities[i].disabled = "";
            }
            else {
              activities[i].disabled = "disabled";
            }
          }

          musicDb.collection("students").find({ "_id": ObjectId(sid) }).toArray(function(err, result) {
            if (err) throw err;
            db.close();
    
            return res.render(require.resolve('../../views/teacher/studentLessons'), {result: result[0], activities: activities, layout: 'teacherMain'});
          });
        });
      });
    });
  });

  router.put('/updateStudent', (req, res, next) => {
    global.checkTeacherSecurity(req, res);
    const data = req.body.data;
    const sid = req.query.sid;
    
    mongoClient.connect(global.dbConnection, {useNewUrlParser: true }, function(err, db) {
      if (err) return res.status(200).end('failed');

      const query = { "_id": ObjectId(sid) };
      const musicDb = db.db("music");
      const newValues = { $set: data };

      musicDb.collection("students").updateOne(query, newValues, function(err, result) {
        if (err) res.status(200).send('failed');
        db.close();
        res.status(200).send('');
      });
    });
  });

  router.post('/addStudentActivity', (req, res, next) => {
    global.checkTeacherSecurity(req, res);
    const data = req.body.data;
    data.dueDate = new Date(data.dueDate);
    
    mongoClient.connect(global.dbConnection, {useNewUrlParser: true }, function(err, db) {
      if (err) return res.status(200).end('failed');

      const musicDb = db.db("music");

      musicDb.collection("activities").insertOne(data, function(err, result) {
        if (err) res.status(200).send('failed');
        db.close();
        res.status(200).send('');
      });
    });
  });

  router.get('/progressHistory', (req, res, next) => {
    global.checkTeacherSecurity(req, res);
    const data = req.body.data;
    const sid = req.query.sid;
    
    mongoClient.connect(global.dbConnection, {useNewUrlParser: true }, function(err, db) {
      if (err) return res.status(200).end('failed');

      const musicDb = db.db("music");
      const query = { "sid": sid };

      musicDb.collection("progress").find(query).toArray(function(err, result) {
        console.log(result);

        for (let i = 0; i < result.length; i++) {
          result[i].percentComplete = Math.round(result[i].checkedArray.length / result[i].numPractices * 100);
        }

        return res.render(require.resolve('../../views/teacher/progressHistory'), {result : result, layout: 'teacherMain'});
      });
    });
  });

  router.put('/endProgressByID', (req, res, next) => {
    global.checkTeacherSecurity(req, res);
    const tid = global.decrypt(req.cookies['tid'], res);
    const id = req.query.id;
    
    mongoClient.connect(global.dbConnection, {useNewUrlParser: true }, function(err, db) {
      if (err) return res.status(200).end('failed');

      const musicDb = db.db("music");
      const newValues = { $set: {ended: true} };

        musicDb.collection("progress").updateOne({ _id: ObjectId(id) }, newValues, function(err, result) {
          db.close();
          if (err) res.status(200).send('failed');
          res.status(200).send('');
        });
    });
  });

  router.delete('/deleteStudentActivity', (req, res, next) => {
    global.checkTeacherSecurity(req, res);
    const id = req.query.id;
    
    mongoClient.connect(global.dbConnection, {useNewUrlParser: true }, function(err, db) {
      if (err) return res.status(200).end('failed');

      const query = { "_id": ObjectId(id) };
      const musicDb = db.db("music");

      musicDb.collection("activities").deleteOne(query, function(err, result) {
        db.close();
        if (err) { 
          res.status(200).send('failed');
        } else {
          res.status(200).send('');
        }
      });
    });
  });

  router.delete('/deleteStudent', (req, res, next) => {
    global.checkTeacherSecurity(req, res);
    const sid = req.query.sid;
    
    mongoClient.connect(global.dbConnection, {useNewUrlParser: true }, function(err, db) {
      if (err) return res.status(200).end('failed');

      const query = { "_id": ObjectId(sid) };
      const musicDb = db.db("music");

      musicDb.collection("students").deleteOne(query, function(err, result) {
        if (err) res.status(200).send('failed');
        db.close();
        res.status(200).send('');
      });
    });
  });

  router.get('/logout', (req, res, next) => {
    res.clearCookie("tid");
    res.redirect("/");
  });

  return router;
};