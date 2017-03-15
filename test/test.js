"use strict";

/* globals describe, it */

const chai = require('chai');
const expect = chai.expect;
const rewire = require('rewire');
chai.use(require('dirty-chai'));

const Errors = rewire('../index.js');

var console_log = [];
var console_error = [];

Errors.__set__('console', {
    log: function(){ 
        console_log = console_log.concat(Array.prototype.slice.call(arguments, 0));
    },
    error: function(){ 
        console_error = console_error.concat(Array.prototype.slice.call(arguments, 0));
    }
});

function consoleReset(){
    console_log = [];
    console_error = [];
}

describe('api-gateway-errors', function(){
    it('should wrap a lambda handler function and pass the callback value back', function(done){
        consoleReset();
        var event = {};
        var context = {};
        var fn = (evnt, contxt, callback) => {
            expect(evnt).to.equal(event);
            expect(contxt).to.equal(context);
            callback(null, 'success!!!');
        };
        var wrapped = Errors(fn);
        
        wrapped(event, context, (err, result) => {
            if(err) throw err;
            expect(wrapped).to.not.equal(fn);
            expect(result).to.equal('success!!!');
            expect(console_log).to.deep.equal([]);
            expect(console_error).to.deep.equal([]);
            done();
        });
    });
    
    it('should convert errors returned by the callback to safe, API Gateway consumable errors', function(done){
        consoleReset();
        var error = new Error('unsafe message!');
        var fn = (evnt, contxt, callback) => callback(error);
        
        Errors(fn)({}, {}, (err, result) => {
            expect(result).to.equal(undefined);
            expect(err).to.be.a('string');
            expect(JSON.parse(err)).to.deep.equal({
                name: 'Error',
                message: 'There was an error.',
                status_code: 500
            });
            expect(console_log).to.deep.equal([]);
            expect(console_error).to.deep.equal([error.stack]);
            done();
        });
    });
    
    it('should safely process non-object errors', function(done){
        consoleReset();
        var error = 'unsafe message!';
        var fn = (evnt, contxt, callback) => callback(error);
        
        Errors(fn)({}, {}, (err, result) => {
            expect(result).to.equal(undefined);
            expect(err).to.be.a('string');
            expect(JSON.parse(err)).to.deep.equal({
                name: 'Error',
                message: 'There was an error.',
                status_code: 500
            });
            expect(console_log).to.deep.equal([]);
            expect(console_error).to.deep.equal(["UnknownError: \"unsafe message!\".", "Error must be an object:", "unsafe message!"]);
            done();
        });
    });
    
    it('should safely process a truthy non-error passed as an error', function(done){
        consoleReset();
        var error = true;
        var fn = (evnt, contxt, callback) => callback(error);
        
        Errors(fn)({}, {}, (err, result) => {
            expect(result).to.equal(undefined);
            expect(err).to.be.a('string');
            expect(JSON.parse(err)).to.deep.equal({
                name: 'Error',
                message: 'There was an error.',
                status_code: 500
            });
            expect(console_log).to.deep.equal([]);
            expect(console_error).to.deep.equal(["UnknownError: true.", "Error must be an object:", true]);
            done();
        });
    });
    
    it('should not console.error() if settings.log is false', function(done){
        consoleReset();
        var error = new Error('unsafe message!');
        var fn = (evnt, contxt, callback) => callback(error);
        
        Errors(fn, { log:false })({}, {}, (err, result) => {
            expect(result).to.equal(undefined);
            expect(err).to.be.a('string');
            expect(JSON.parse(err)).to.deep.equal({
                name: 'Error',
                message: 'There was an error.',
                status_code: 500
            });
            expect(console_log).to.deep.equal([]);
            expect(console_error).to.deep.equal([]);
            done();
        });
    });
    
    it('should use the map setting', function(done){
        consoleReset();
        var error = new Error('unsafe message!');
        var fn = (evnt, contxt, callback) => callback(error);
        
        Errors(fn, { map:{
            "message":"message_of_doom",
            "name": "cause_of_doom"
        }})({}, {}, (err, result) => {
            expect(result).to.equal(undefined);
            expect(err).to.be.a('string');
            expect(JSON.parse(err)).to.deep.equal({
                cause_of_doom: 'Error',
                message_of_doom: 'unsafe message!'
            });
            expect(console_log).to.deep.equal([]);
            expect(console_error).to.deep.equal([error.stack]);
            done();
        });
    });
    
    it('should use the exclude setting', function(done){
        consoleReset();
        var error = new Error('unsafe message!');
        var fn = (evnt, contxt, callback) => callback(error);
        
        Errors(fn, { exclude:{ status_code:true }})({}, {}, (err, result) => {
            expect(result).to.equal(undefined);
            expect(err).to.be.a('string');
            expect(JSON.parse(err)).to.deep.equal({
                name: 'Error',
                message: "There was an error."
            });
            expect(console_log).to.deep.equal([]);
            expect(console_error).to.deep.equal([error.stack]);
            done();
        });
    });
});