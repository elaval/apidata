'use strict';
let _ = require("lodash")

const dimensions = {}

dimensions.dependencia = ['municipal', 'subvencionada', 'privada', 'administracionDelegada'];
dimensions.tipoEducacion = ['parvularia', 'basica', 'basicaAdultos', 'edEspecial', 'mediaHC', 'mediaHCAdultos', 'mediaTP', 'mediaTPAdultos'];
dimensions.genero = ['total', 'hombres', 'mujeres'];

function filterRecord (record, filter) {
  let dependencia = filter.dependencia || null;
  let tipoEducacion = filter.tipoEducacion || null;
  let genero = filter.genero || null;

  if (dependencia) {
    // Set educacion metrics only for the specified dependencis
    dependencia = dependencia.toLowerCase();
    dependencia = dependencia === 'administraciondelegada' ? 'administracionDelegada' : dependencia;
    
    record.metrics.educacion = record.metrics.educacion.dependencia[dependencia];

    record.dependencia = dependencia;
  } else {

    // Remove attributes from specific dimensions.dependencia and only leave the general ones
    record.metrics.educacion = _.omit(record.metrics.educacion, 'dependencia');
  } 

  if (tipoEducacion) {
    record.metrics.educacion.matricula = record.metrics.educacion.matricula[tipoEducacion];

    record.tipoEducacion = tipoEducacion
  } else {

    _.each(record.metrics.educacion.matricula, (value, key) => {
      if (key !== 'total'  && key !== 'hombres' && key !== 'mujeres') {
        record.metrics.educacion.matricula = _.omit(record.metrics.educacion.matricula, key)
      }
    })
  }

  if (genero) {
    record.metrics.educacion.matricula.total = record.metrics.educacion.matricula[genero];

    record.genero = genero
  }
  record.metrics.educacion.matricula = _.omit(record.metrics.educacion.matricula, 'hombres');
  record.metrics.educacion.matricula = _.omit(record.metrics.educacion.matricula, 'mujeres');
  
  return record;
}

function filterAndSplitResult(results, query) {
    const by = query['by']
    let newResults = [];
    
    const filter = _.clone(query);

    _.each(results, (record) => {

        if (by && dimensions[by]) {
            const dimensionValues = dimensions[by];
            _.each(dimensionValues, (d) => {
                // Add current group by value to the filter
                filter[by] = d;
                newResults.push(filterRecord(_.cloneDeep(record), filter))
            })
        
        } else {
            newResults.push(filterRecord(_.cloneDeep(record), filter));
        }

    })

  return newResults;

}



// set up a mongoose model and pass it using module.exports
module.exports = {
    "filterAndSplitResult": filterAndSplitResult,
    "dimensions": dimensions
};