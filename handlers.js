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
    enseñanza:true,
    estado:true
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
  let projectFields = {};

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

  projectFields['establecimientosFuncionando'] = {'$cond': [ { $eq: [ "$estado", 1 ] }, 1, 0 ]};
  projectFields['establecimientosEnReceso'] = {'$cond': [ { $eq: [ "$estado", 2 ] }, 1, 0 ]};
  projectFields['establecimientosCerrados'] = {'$cond': [ { $eq: [ "$estado", 3 ] }, 1, 0 ]};
  projectFields['establecimientosAturizadoSinMatricula'] = {'$cond': [ { $eq: [ "$estado", 4 ] }, 1, 0 ]};

  _.each(groupFields, (value,key) => {
    projectFields[key] = 1;
  } )

  for (let i of [2007,2008,2009,2010,2011,2012,2013,2014,2015,2016]) {
    groupQuery['matricula'+i] = { $sum: `$matricula${i}.total`  };
    groupQuery['matricula'+i+'_mediaTPTot'] = { $sum: `$matricula${i}.mediaTPTot`  };
    groupQuery['matricula'+i+'_mediaHCTot'] = { $sum: `$matricula${i}.mediaHCTot`  };
    groupQuery['matricula'+i+'_basicaTot'] = { $sum: `$matricula${i}.basicaTot`  };
    groupQuery['matricula'+i+'_parvulariaTot'] = { $sum: `$matricula${i}.parvulariaTot`  };
    projectFields['matricula'+i] = 1;
  }

  groupQuery['establecimientosFuncionando'] = { $sum: `$establecimientosFuncionando`  };
  groupQuery['establecimientosEnReceso'] = { $sum: `$establecimientosEnReceso`  };
  groupQuery['establecimientosCerrados'] = { $sum: `$establecimientosCerrados`  };
  groupQuery['establecimientosAturizadoSinMatricula'] = { $sum: `$establecimientosAturizadoSinMatricula`  };

  
  /*
  [
  $project : {
    'establecimientosFuncionando': {'$cond': [ { $eq: [ "$_id.estado", 1 ] }, "$count", 0 ]},
    'establecimientosEnReceso': {'$cond': [ { $eq: [ "$_id.estado", 2 ] }, "$count", 0 ]},
    'establecimientosCerrados': {'$cond': [ { $eq: [ "$_id.estado", 3 ] }, "$count", 0 ]},
    'establecimientosAturizadoSinMatricula': {'$cond': [ { $eq: [ "$_id.estado", 4 ] }, "$count", 0 ]},
  },
  {$match: {'comuna':'TEMUCO'}},
  {$group: {
    '_id': {dependencia:'$dependencia'},
    'dependencia': {$first:'$dependencia'},
    'matricula2016': {$sum:'$matricula2016.total'},
    'matricula2015': {$sum:'$matricula2015.total'},
    'establecimientosFuncionando': {$sum:'establecimientosFuncionando'},
    ...
  }}
  ]
*/

  const aggregateJSON = [
    { $match: matchFields },
    { $project : projectFields },
    { $group: groupQuery },
    { $sort: { "comuna": 1, "dependencia":1} }
  ];

  console.log(aggregateJSON);

  School.aggregate(aggregateJSON
    , function(err, result) {
    res.json(result)
  });
  
}; 


// set up a mongoose model and pass it using module.exports
module.exports = {
    "schools": schools, 
    "education": education, 
};