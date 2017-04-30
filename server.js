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

// Use native promises
mongoose.Promise = global.Promise;

var schoolHandlers = require('./handlers')
var comunaHandlers = require('./handlersComunas')
var regionHandlers = require('./handlersRegion')

var mongoDb = process.env.MONGO_DATABASE || config.database;
console.log(mongoDb)
mongoose.connect(mongoDb); // connect to database

let port = 8021;

app.use(morgan('dev'));
app.use(cors());
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

app.get('/education', function (req, res) {
  schoolHandlers.education(req,res);
});

app.get('/comuna', function (req, res) {
  comunaHandlers.getAllComunas(req,res);
});

app.get('/comuna/:comuna', function (req, res) {
  comunaHandlers.getOneComuna(req,res);
});


app.get('/region', function (req, res) {
  regionHandlers.getAllRegion(req,res);
});

app.get('/region/:region', function (req, res) {
  regionHandlers.getOneRegion(req,res);
});

app.get('/pais', function (req, res) {
  regionHandlers.getPais(req,res);
});

app.get('/pais/history', function (req, res) {
  regionHandlers.getPaisHistory(req,res);
});


app.get('/matricula', function (req, res) {  
  regionHandlers.matriculaHandler(req,res);
});

app.listen(port, function () {
  console.log(`Listening on port ${port}!`);
});