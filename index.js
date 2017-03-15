"use strict";

var Errors = require('super-errors-json')(require('super-errors')());

// create an errors fn
Errors.setFn(lambdaError);

/**
 * Error to return when the error value is not an object
 */
function InvalidErrorValue(err_value){
    this.init(InvalidErrorValue);
    this.additional = { err:err_value }; 
}
Errors.create(InvalidErrorValue, 'Error', 'There was an error.', 500, false);

/**
 * Wrap all API Gateway lambda handlers with this function.
 * @param {Function} fn - AWS lambda handler function to wrap.
 * @param {Object} setting - 
 * @param {boolean} setting.log - Whether or not to log errors to console.
 * @returns {Function}
 */
function lambdaError(fn, settings){
    var log = (settings && settings.log === false ? false : true);
    var map = (settings && settings.map ? settings.map : undefined);
    var exclude = (settings && settings.exclude ? settings.exclude : undefined);
    
    return (event, context, callback) => {
        fn(event, context, (err, result) => {
            if(err){
                if(log){
                    console.error(Errors.stack(err));
                }
                
                if(typeof err !== 'object'){
                    console.error('Error must be an object:', err);
                    err = new InvalidErrorValue(err);
                }
                
                return callback(Errors.json(err, false, map, exclude));
            }
            
            return callback(null, result);
        });
    };
}

// ready to export
module.exports = Errors;