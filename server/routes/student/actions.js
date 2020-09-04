const express = require('express');
const router = express.Router();
const mongoClient = require('mongodb').MongoClient;
const global = require('../../global');
const distribution = require('./distribution');

module.exports = () => {
  router.get('/login', (req, res, next) => {
    return res.render(require.resolve('../../views/student/login'));
  });

  router.post('/login', (req, res, next) => {
    const data = req.body.data;

    mongoClient.connect(global.dbConnection, {useNewUrlParser: true }, function(err, db) {
      const musicDb = db.db("music");
      musicDb.collection("students").find({ email: data.email, secret: data.secret }).toArray(function(err, result) {
        db.close();
        if (err) throw err;
        if (result.length > 0) {
          const encryptedId = global.encrypt(result[0]._id.toString());
          res.cookie('sid', encryptedId);
          return res.status(200).send(result[0]._id);
        } else {
          return res.status(200).end('failed');
        }
      });
    });
  });

  router.get('/activities', (req, res, next) => {
    global.checkStudentSecurity(req, res);
    const sid = global.decrypt(req.cookies['sid'], res);

    mongoClient.connect(global.dbConnection, {useNewUrlParser: true }, function(err, db) {
      if (err) throw err;
      const musicDb = db.db("music");

      musicDb.collection("activities").find({ sid: sid, dueDate: {"$gte": new Date()}}).sort( {days:-1} ).toArray(function(err, result) {
        if (err) throw err;
        var activities = result;

        for (let i = 0; i < activities.length; i ++) {
          activities[i].dueDate = global.formatDateToString(activities[i].dueDate);
        }

        if (result !== null && result.length > 0) {
          var dueDate = activities[0].dueDate;

          const musicDb = db.db("music");
          musicDb.collection("progress").find({ sid: sid, dueDate: {"$lt": new Date()} }).toArray(function(err, result) {

            if (result.length > 0) {
            const newValues = { $set: {ended: true} };
              musicDb.collection("progress").updateOne({ "_id": result[0]._id}, newValues, function(err, result) {
                return res.redirect('/student/activities?sid=' + sid);
              });
            } else {
              musicDb.collection("progress").find( { sid: sid, dueDate: new Date(dueDate), ended: false }).toArray(function(err2, result) {
                db.close();
                if (result !== null) {
                  if (result.length > 0) {
                    res.redirect('/student/progress?sid=' + sid + '&dueDate=' + dueDate);
                  } else {
                    return res.render(require.resolve('../../views/student/activities'), {activities: activities, layout: 'studentMain'});
                  }
                }
                else {
                  return res.render(require.resolve('../../views/student/activities'), {activities: activities, layout: 'studentMain'});
                }
              });
            }
          });
        }
        else {
          db.close();
          return res.render(require.resolve('../../views/student/activities'), {activities: activities, layout: 'studentMain'});
        }
      });

    });
  });

  router.post('/distributeActivities', (req, res, next) => {
    global.checkStudentSecurity(req, res);
    const sid = global.decrypt(req.cookies['sid'], res);
    const dueDate = req.query.dueDate;

    mongoClient.connect(global.dbConnection, {useNewUrlParser: true }, function(err, db) {

      if (err) throw err;

      const musicDb = db.db("music");

      musicDb.collection("activities").find({ sid: sid, dueDate: new Date(dueDate) }).sort( { days: -1 } ).toArray(function(err, result) {
        if (err) res.status(200).send('failed');

        const distributed = distribution.distributeActivities(result);
        distributed.sid = sid;

        musicDb.collection("progress").deleteOne({ "sid": sid, dueDate: new Date(dueDate) });
        musicDb.collection("progress").insertOne(distributed, function(err) {
          db.close();
          if (err) res.status(200).send('failed');
          res.status(200).send(distributed);
        });
      });
    });
  });

  router.get('/progress', (req, res, next) => {
    global.checkStudentSecurity(req, res);
    const sid = global.decrypt(req.cookies['sid'], res);
    const dueDate = req.query.dueDate;

    mongoClient.connect(global.dbConnection, {useNewUrlParser: true }, function(err, db) {

      if (err) throw err;

      const musicDb = db.db("music");

      musicDb.collection("progress").find({ sid: sid, dueDate: new Date(dueDate) }).toArray(function(err, result) {
        db.close();
        result[0].dueDate = global.formatDateToString(result[0].dueDate);
        return res.render(require.resolve('../../views/student/progress'), {progress: result[0], layout: 'studentMain'});
      });
    });
  });

  router.post('/progress/set', (req, res, next) => {
    global.checkStudentSecurity(req, res);
    const data = req.body.data;

    mongoClient.connect(global.dbConnection, {useNewUrlParser: true }, function(err, db) {
      if (err) throw err;

      const musicDb = db.db("music");
      musicDb.collection("progress").find({ sid: data.sid, dueDate: new Date(data.dueDate) }).toArray(function(err, result) {

        var checkedArray = result[0].checkedArray;
        if (data.action === 'add') {
          if (checkedArray === undefined) {
            checkedArray = new Array();
          }

          checkedArray.push(data.index);

        } else {
          checkedArray = result[0].checkedArray.filter(value => value !== data.index);
        }

        const newValues = { $set: {checkedArray: checkedArray} };

        musicDb.collection("progress").updateOne({ "_id": result[0]._id}, newValues, function(err, result) {
          db.close();
          if (err) res.status(200).send('failed');
          res.status(200).send('');
        });
      });
    });
  });

  router.post('/progress/end', (req, res, next) => {
    global.checkStudentSecurity(req, res);
    const sid = global.decrypt(req.cookies['sid'], res);
    const dueDate = req.query.dueDate;

    mongoClient.connect(global.dbConnection, {useNewUrlParser: true }, function(err, db) {
      if (err) throw err;

      const musicDb = db.db("music");
      musicDb.collection("progress").find({ sid: sid, dueDate: new Date(dueDate) }).toArray(function(err, result) {

        const newValues = { $set: {ended: true} };

        musicDb.collection("progress").updateOne({ "_id": result[0]._id}, newValues, function(err, result) {
          db.close();
          if (err) res.status(200).send('failed');
          res.status(200).send('');
        });
      });
    });
  });

  router.get('/logout', (req, res, next) => {
    res.clearCookie("sid");
    res.redirect("/");
  });

  return router;
};