'use strict';
let _ = require("underscore")
/**
 * Definition of CRUD operations for sketches
 * 
 * We assume that 
 * - the request has already authenticades via a JWT token
 * - req.user.username contains a valid user identification 
 */

var Comuna   = require('./models/comunas'); // get our mongoose model

let numericFields = {
    region:true,
    ruralidad:true,
    enseñanza:true,
    estado:true
}



function getOneComuna(req, res) {

  const comuna = req.params.comuna;
  const año = req.query.año;

  let matchFields = {};
  let groupFields = {};
  let groupQuery = {};
  let projectFields = {};

var replace = "regex";
var re = new RegExp(replace,"g");

matchFields = {'comuna': {$regex: `${comuna}$`, $options: 'i' }}

  if (año && !isNaN(+año)) {
      matchFields['año'] = año;
  }

  const aggregateJSON = [
    { $match: matchFields }
  ];

  console.log(aggregateJSON);

  if (año !== 'all') {
    Comuna.find(matchFields, function(err, schools) {
        res.json(schools);
    })
    .sort({ 'año': -1 })
    .limit(1)

  } else{
    Comuna.find(matchFields, function(err, schools) {
        res.json(schools);
    });  
  }

  
    /*



  Comuna.aggregate(aggregateJSON
    , function(err, result) {
    res.json(result)
  });
  */
  
}; 

function getAllComunas(req, res) {

  let sortQuery = {
      'año' : -1
  }
  
  let matchFields = {
      'comuna' : {$exists :true}
  };
  let groupQuery = {
	'_id' : '$cod_comuna',
	'cod_comuna': { '$first' : '$cod_comuna'},
	'cod_region': { '$first' : '$cod_region'},
	'comuna': { '$first' : '$comuna'},
	'año':{ '$first': '$año'},
	'metrics':{ '$first': '$metrics'}
  }   


  const aggregateJSON = [
    { $sort: sortQuery },
    { $group: groupQuery }
  ];
 
  Comuna.aggregate(aggregateJSON
    , function(err, result) {
    res.json(result)
  });
  
}; 



// set up a mongoose model and pass it using module.exports
module.exports = {
    "getAllComunas": getAllComunas , 
    "getOneComuna": getOneComuna , 
};