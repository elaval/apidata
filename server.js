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

if (process.env.NO_HTTPS && process.env.NO_HTTPS === 'true') {
  
  app.listen(port, function () {
    console.log(`Listening on port ${port}!`);
  });
  
} else {

  // returns an instance of node-greenlock with additional helper methods 
  var lex = require('greenlock-express').create({
    // set to https://acme-v01.api.letsencrypt.org/directory in production 
    server: 'https://acme-v01.api.letsencrypt.org/directory'
  
  // If you wish to replace the default plugins, you may do so here 
  // 
  , challenges: { 'http-01': require('le-challenge-fs').create({ webrootPath: '/tmp/acme-challenges' }) }
  , store: require('le-store-certbot').create({ webrootPath: '/tmp/acme-challenges' })
  
  // You probably wouldn't need to replace the default sni handler 
  // See https://git.daplie.com/Daplie/le-sni-auto if you think you do 
  //, sni: require('le-sni-auto').create({}) 
  
  , approveDomains: approveDomains
  });

  function approveDomains(opts, certs, cb) {
    // This is where you check your database and associated 
    // email addresses with domains and agreements and such 
  
  
    // The domains being approved for the first time are listed in opts.domains 
    // Certs being renewed are listed in certs.altnames 
    if (certs) {
      opts.domains = certs.altnames;
    }
    else {
      opts.email = 'ernesto.laval@gmail.com';
      opts.agreeTos = true;
    }
  
    // NOTE: you can also change other options such as `challengeType` and `challenge` 
    // opts.challengeType = 'http-01'; 
    // opts.challenge = require('le-challenge-fs').create({}); 
  
    cb(null, { options: opts, certs: certs });
  }

  // handles acme-challenge and redirects to https 
  require('http').createServer(lex.middleware(require('redirect-https')())).listen(80, function () {
    console.log("Listening for ACME http-01 challenges on", this.address());
  });
  
  app.use('/', function (req, res) {
    res.end('Hello, World!');
  });
  
  // handles your app 
  require('https').createServer(lex.httpsOptions, lex.middleware(app)).listen(443, function () {
    console.log("Listening for ACME tls-sni-01 challenges and serve app on", this.address());
  });

}





