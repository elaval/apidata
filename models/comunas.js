// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('comunabyyears', new Schema({ 
    año: Number, 
    comuna: String,
    cod_comuna: Number,
    cod_region: String,
}));