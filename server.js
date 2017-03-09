'use strict';
var express = require('express');
var app = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');
var fs = require('fs');
var bearerToken = require("express-bearer-token");
var cors = require('cors')
var config = require('./config'); // get our config file

var schoolHandlers = require('./handlers')

var mongoDb = process.env.MONGO_DATABASE || config.database;
console.log(mongoDb)
mongoose.connect(mongoDb); // connect to database

app.use(morgan('dev'));
app.options('*', cors()); // to allow pre-flight cors 


app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.get('/config', function (req, res) {
  res.send(config.database);
});

app.get('/schools', function (req, res) {
  schoolHandlers.schools(req,res);
});

app.get('/test', function (req, res) {
  schoolHandlers.test(req,res);
});



app.listen(8021, function () {
  console.log('Example app listening on port 8021!');
});