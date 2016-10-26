const Errors = require('super-errors');

// create an errors fn
Errors.setFn(lambdaError);

// lambda error handler
function lambdaError(fn, log){
    return (event, context, callback) => {
        fn(event, context, (err, result) => {
            if(err){
                if(log !== false){
                    console.error(err);
                }
                
                if(typeof err !== 'object'){
                    err = new Errors.DevError('Invalid error value.', { err: err });
                    err.safe_message = 'Invalid error value.';
                }
                
                return callback(JSON.stringify(toSafeErrorObject(err)));
            }
            
            return callback(null, result);
        });
    };
}

function safeMessage(err){
    return err.safe_message || 'There was an error.';
}

function toSafeErrorObject(err, subfields) {
    var e = { 
        message: safeMessage(err), 
        name: err.name || 'Error',
        status_code: (typeof err.status_code === 'number' ? err.status_code : 500)
    };
    
    if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
        e.errors = [];
        err.errors.forEach(function (err) {
            e.errors.push(safeMessage(err));
        });
    }
    if (subfields !== false && err.fields && typeof err.fields === 'object'){
        e.fields = {};
        for(var field in err.fields){
            e.fields[field] = safeMessage(err.fields[field], false);
        }
    }
    return e;
}

// ready to export
module.exports = Errors;