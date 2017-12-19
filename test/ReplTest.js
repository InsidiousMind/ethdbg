const Logger = require('./../lib/logger');
const REPL = require('./../lib/repl');
const GanacheWrapper = require('./../lib/ganache_wrapper');
const { expect } = require('chai');


describe('REPL', function () {
    describe('#execute()', function () {
        it('should pass silently', function () {
            let logger = new Logger(5);
            let testRPC = new GanacheWrapper(logger);
            let repl = new REPL();
            repl.execute(testRPC, 'contract x { function g() {} }');
        });
        it('should return a valid response from solidity functions', function() {
            let logger = new Logger(5);
            let testRPC = new GanacheWrapper(logger);
            let repl = new REPL();
            let result = repl.execute(testRPC, "uint x = 1; uint y = 1s; return x+y;");
            expect(result).to.equal(2);
        });
    });
});