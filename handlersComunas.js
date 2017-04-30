'use strict';
let _ = require("underscore")
const filterAndSplitResult = require("./handlersUtilities").filterAndSplitResult;
const dimensions =  require("./handlersUtilities").dimensions;

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

const dependencias = ['municipal', 'subvencionada', 'privada', 'administracionDelegada'];
const tipoEducacion = ['parvularia', 'basica', 'basicaAdultos', 'edEspecial', 'mediaHC', 'mediaHCAdultos', 'mediaTP', 'mediaTPAdultos'];
const generos = ['total', 'hombres', 'mujeres'];

// DEFINE group operations on metrics
let groupQueryAddMetrics = {};

// Sumar matriculra por cada dependnecia, tipo de educacion y genero
_.each(dependencias, (dependencia) => {
  _.each(generos, (genero) => {
    groupQueryAddMetrics[`metrics_educacion_dependencia_${dependencia}_matricula_${genero}`] = { $sum: `$metrics.educacion.dependencia.${dependencia}.matricula.${genero}`};
  })

  // para cada tipo de educación
  _.each(tipoEducacion, (tipo) => {
    _.each(generos, (genero) => {
      groupQueryAddMetrics[`metrics_educacion_dependencia_${dependencia}_matricula_${tipo}_${genero}`] = { $sum: `$metrics.educacion.dependencia.${dependencia}.matricula.${tipo}.${genero}`};
    })
  })

})

function getOneComuna(req, res) {

  const comuna = req.params.comuna;
  const año = req.query.año;

  let sortQuery = {
      'año' : -1
  }

  var replace = "regex";
  var re = new RegExp(replace,"g");

  var matchFields = {'comuna': {$regex: `${comuna}$`, $options: 'i' }}

  if ( Number.isInteger(+año)) {
      matchFields['año'] = +año;
  }

  let groupQuery = _.clone(groupQueryAddMetrics);
  groupQuery['_id'] = {
      'año': '$año'
  }
  groupQuery['cod_comuna'] = {$first: '$cod_comuna'};
  groupQuery['comuna'] = {$first: '$comuna'};
  groupQuery['año'] = { '$first': '$año'};


  // DEFINE PROJECT FIELDS
  var projectFields = {};
  projectFields['año'] = 1;
  projectFields['cod_comuna'] = 1;
  projectFields['comuna'] = 1;

  // Matricula para todas las dependnecias
  _.each(generos, (genero) => {
    let attributesToAdd = [];
    _.each(dependencias, (dependencia) => {
      attributesToAdd.push(`$metrics_educacion_dependencia_${dependencia}_matricula_${genero}`)
    })
    projectFields[`metrics.educacion.matricula.${genero}`] = {'$add' : attributesToAdd }
  });

  _.each(tipoEducacion, (tipo) => {
    _.each(generos, (genero) => {
      let attributesToAdd = [];
      _.each(dependencias, (dependencia) => {
        attributesToAdd.push(`$metrics_educacion_dependencia_${dependencia}_matricula_${tipo}_${genero}`)
      })
      projectFields[`metrics.educacion.matricula.${tipo}.${genero}`] = {'$add' : attributesToAdd }
    });
  })

  // Matricula por dependencia
  _.each(dependencias, (dependencia) => {
    _.each(generos, (genero) => {
      projectFields[`metrics.educacion.dependencia.${dependencia}.matricula.${genero}`] = `$metrics_educacion_dependencia_${dependencia}_matricula_${genero}`
    })

    // para cada tipo de educación
    _.each(tipoEducacion, (tipo) => {
      _.each(generos, (genero) => {
        projectFields[`metrics.educacion.dependencia.${dependencia}.matricula.${tipo}.${genero}`] = `$metrics_educacion_dependencia_${dependencia}_matricula_${tipo}_${genero}`
      })
    })

  })

 
  // Year was not specified, get data for latest year
  if (!Number.isInteger(+año) && año !=='all') {
    latestYearPromise()
    .then((latestYear) => {
        matchFields['año'] = latestYear;
        getAggregation()
    })
  } else {
    getAggregation();
  }

  function getAggregation() {
    const aggregateJSON = [
        { $match : matchFields },
        { $sort: sortQuery },
        { $group: groupQuery }, 
        { $project: projectFields },
    ];
    Comuna.aggregate(aggregateJSON
        , function(err, result) {
            if (err) {
                res.send('404', err)
            } else {
                res.json(filterAndSplitResult(result, req.query));
            }
    });
  }
  
}; 

/**
 * Gets the most recent year associated to comunas 
 * 
 * @returns {integer}
 */
function latestYearPromise() {
    return new Promise((resolve,reject) => {
        Comuna.find().sort({'año':-1}).limit(1)
        .then((d) => {
            resolve(+d[0].get('año'));
        })
        .catch((err)=> {
            reject(err);
        })
    })

}

function getOneComuna2(req, res) {

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

  const año = req.query.año;

  let sortQuery = {
      'año' : -1
  }

  let matchFields = { 
    'comuna': { $exists: true } 
  };

  if ( Number.isInteger(+año)) {
      matchFields['año'] = +año;
  }

  let groupQuery = _.clone(groupQueryAddMetrics);
  groupQuery['_id'] = {
      'comuna': '$comuna',
      'año': '$año'
  }
  groupQuery['comuna'] = {$first: '$comuna'};
  groupQuery['año'] = { '$first': '$año'};


  // DEFINE PROJECT FIELDS
  var projectFields = {};
  projectFields['año'] = 1;
  projectFields['comuna'] = 1;

  // Matricula para todas las dependnecias
  _.each(generos, (genero) => {
    let attributesToAdd = [];
    _.each(dependencias, (dependencia) => {
      attributesToAdd.push(`$metrics_educacion_dependencia_${dependencia}_matricula_${genero}`)
    })
    projectFields[`metrics.educacion.matricula.${genero}`] = {'$add' : attributesToAdd }
  });

  _.each(tipoEducacion, (tipo) => {
    _.each(generos, (genero) => {
      let attributesToAdd = [];
      _.each(dependencias, (dependencia) => {
        attributesToAdd.push(`$metrics_educacion_dependencia_${dependencia}_matricula_${tipo}_${genero}`)
      })
      projectFields[`metrics.educacion.matricula.${tipo}.${genero}`] = {'$add' : attributesToAdd }
    });
  })

  // Matricula por dependencia
  _.each(dependencias, (dependencia) => {
    _.each(generos, (genero) => {
      projectFields[`metrics.educacion.dependencia.${dependencia}.matricula.${genero}`] = `$metrics_educacion_dependencia_${dependencia}_matricula_${genero}`
    })

    // para cada tipo de educación
    _.each(tipoEducacion, (tipo) => {
      _.each(generos, (genero) => {
        projectFields[`metrics.educacion.dependencia.${dependencia}.matricula.${tipo}.${genero}`] = `$metrics_educacion_dependencia_${dependencia}_matricula_${tipo}_${genero}`
      })
    })

  })

 
  // Year was not specified, get data for latest year
  if (!Number.isInteger(+año) && año !=='all') {
    latestYearPromise()
    .then((latestYear) => {
        matchFields['año'] = latestYear;
        getAggregation()
    })
  } else {
    getAggregation();
  }

  function getAggregation() {
    const aggregateJSON = [
        { $match : matchFields },
        { $sort: sortQuery },
        { $group: groupQuery }, 
        { $project: projectFields },
    ];
    Comuna.aggregate(aggregateJSON
        , function(err, result) {
            if (err) {
                res.send('404', err)
            } else {
                res.json(filterAndSplitResult(result, req.query));
            }
    });
  }
  
}; 

function getAllComunas2(req, res) {

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