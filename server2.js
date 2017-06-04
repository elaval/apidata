'use strict';

require('greenlock-express').create({

  server: 'staging'

, email: 'ernesto.laval@gmail.com'

, agreeTos: true

, approveDomains: [ 'data.tideapps.com' ]

, app: require('express')().use('/', function (req, res) {
    res.end('Hello, World!');
  })

}).listen(80, 443);
