'use strict';
let _ = require("underscore")
/**
 * Definition of CRUD operations for sketches
 * 
 * We assume that 
 * - the request has already authenticades via a JWT token
 * - req.user.username contains a valid user identification 
 */


let numericFields = {
    region:true,
    ruralidad:true,
    enseñanza:true
}

var School   = require('./models/school'); // get our mongoose model

// GET /sketches - Get all sketches
function schools(req, res) {
  
  School.find({}, function(err, schools) {
    res.json(schools);
  });
  
}; 


function education(req, res) {

  console.log(req.query);

  let matchFields = {};
  let groupFields = {};
  let groupQuery = {};

  _.each(req.query, (value,key) => {
      if (key !== "by") {
          matchFields[key] = numericFields[key] ? +value :value;
      } else if (key == "by") {
          let fields = value.split(",")
          _.each(fields, (field) => {
            groupFields[field] = "$"+field;
          })
          
      }
  })

  groupQuery['_id'] = groupFields;
  _.each(groupFields, (value,key) => {
    groupQuery[key] = { $first: value }
  })

  for (let i of [2007,2008,2009,2010,2011,2012,2013,2014,2015,2016]) {
    groupQuery['matricula'+i] = { $sum: `$matricula${i}.total`  };
  }

  groupQuery['count'] = { $sum: 1  }
  
  /*
  [
  {$match: {'comuna':'TEMUCO'}},
  {$group: {
    '_id': {dependencia:'$dependencia'},
    'dependencia': {$first:'$dependencia'},
    'matricula2016': {$sum:'$matricula2016.total'},
    'matricula2015': {$sum:'$matricula2015.total'},
    'count': {$sum:1}
  }}
  ]
*/

  School.aggregate([
    { $match: matchFields },
    { $group: groupQuery },
    { $sort: { "comuna": 1, "dependencia":1} }
  ], function(err, result) {
    res.json(result);
  });
  
}; 


// set up a mongoose model and pass it using module.exports
module.exports = {
    "schools": schools, 
    "education": education, 
};