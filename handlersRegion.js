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

function getOneRegion(req, res) {

  const region = req.params.region;
  const año = req.query.año;

  let sortQuery = {
      'año' : -1
  }

  let matchFields = {
      'cod_region' : +region
  };

  if ( Number.isInteger(+año)) {
      matchFields['año'] = +año;
  }

  let groupQuery = _.clone(groupQueryAddMetrics);
  groupQuery['_id'] = {
      'cod_region': '$cod_region',
      'año': '$año'
  }
  groupQuery['cod_region'] = {$first: '$cod_region'};
  groupQuery['año'] = { '$first': '$año'};


  // DEFINE PROJECT FIELDS
  var projectFields = {};
  projectFields['año'] = 1;
  projectFields['cod_region'] = 1;

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
                res.json(result)
            }
    });
  }
  
}; 


function getAllRegion(req, res) {

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
      'cod_region': '$cod_region',
      'año': '$año'
  }
  groupQuery['cod_region'] = {$first: '$cod_region'};
  groupQuery['año'] = { '$first': '$año'};


  // DEFINE PROJECT FIELDS
  var projectFields = {};
  projectFields['año'] = 1;
  projectFields['cod_region'] = 1;

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
                res.json(result)
            }
    });
  }
  
}; 


function getPais(req, res) {

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
      'año': '$año'
  }
  groupQuery['año'] = { '$first': '$año'};


  // DEFINE PROJECT FIELDS
  var projectFields = {};
  projectFields['año'] = 1;

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
                res.json(result)
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


// set up a mongoose model and pass it using module.exports
module.exports = {
    "getAllRegion": getAllRegion , 
    "getOneRegion": getOneRegion , 
    "getPais": getPais , 
};