const express = require('express');
const expbs = require('express-handlebars');
const createError = require('http-errors');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const cookieParser = require('cookie-parser');

app.engine('handlebars', expbs());
app.set('view engine', 'handlebars');

if (app.get('env') === 'development') {
  app.locals.pretty = true;
}
app.set('views', path.join(__dirname, './views'));

const routes = require('./routes');
app.use(express.static('public'));

app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(cookieParser());

app.get('/favicon.ico', (req, res, next) => {
  return res.sendStatus(204);
});

app.use('/', routes());
app.use((req, res, next) => {
  return next(createError(404, 'File not found'));
});

app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500).send('Error: not set up properly')
})

app.listen(3000);

process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err);
});

module.export = app;