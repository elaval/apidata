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
    ruralidad:true
}

var School   = require('./models/school'); // get our mongoose model

// GET /sketches - Get all sketches
function schools(req, res) {
  
  School.find({}, function(err, schools) {
    res.json(schools);
  });
  
}; 


function test(req, res) {

  console.log(req.query);

  let matchFields = {};
  _.each(req.query, (value,key) => {
      if (key !== "by") {
          matchFields[key] = numericFields[key] ? +value :value;
      }
  })


  console.log(matchFields);

  School.aggregate([
    { $match: matchFields },

    { $group: {
            _id: {comuna:"$comuna", dependencia:"$dependencia"},

            comuna: { $first: "$comuna"  },
            dependencia: { $first: "$dependencia"  },
            matricula2016: { $sum: "$matricula2016.total"  },
            matricula2015: { $sum: "$matricula2015.total"  },
            matricula2014: { $sum: "$matricula2014.total"  },
            matricula2013: { $sum: "$matricula2013.total"  },
            matricula2012: { $sum: "$matricula2012.total"  },
            matricula2011: { $sum: "$matricula2011.total"  },
            matricula2010: { $sum: "$matricula2010.total"  },
            matricula2009: { $sum: "$matricula2009.total"  },
            matricula2008: { $sum: "$matricula2008.total"  },
    }},
    { $sort: { "comuna": 1, "dependencia":1} }
  ], function(err, result) {
    res.json(result);
  });
  
}; 

/*
    AccountModel.aggregate([
        { $match: {
            _id: accountId
        }},
        { $unwind: "$records" },
        { $group: {
            _id: "$_id",
            balance: { $sum: "$records.amount"  }
        }}
    ], function (err, result) {
        if (err) {
            console.log(err);
            return;
        }
        console.log(result);
    });
    */


// set up a mongoose model and pass it using module.exports
module.exports = {
    "schools": schools, 
    "test": test, 
};