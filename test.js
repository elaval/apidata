var fs = require('fs');
var http = require('http');
var https = require('https');
var privateKey  = fs.readFileSync('/certs/privkey.pem', 'utf8');
var certificate = fs.readFileSync('/certs/cert.pem', 'utf8');

var credentials = {key: privateKey, cert: certificate};
var express = require('express');
var app = express();

app.use('/', function (req, res) {
  res.end('Hello, World!');
});


var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);

httpServer.listen(80);
httpsServer.listen(443);