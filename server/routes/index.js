const express = require('express');
const router = express.Router();

const studentRoute = require('./student/actions');
const teacherRoute = require('./teacher/actions');
const errorRoute = require('./error/actions');

module.exports = () => {
  router.get('/', (req, res, next) => {
    return res.render('index'); // render the index.handlebars
  });

  router.use('/student', studentRoute());
  router.use('/teacher', teacherRoute());
  router.use('/error', errorRoute());

  return router;
};