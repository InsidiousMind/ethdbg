const EventManager = require('../lib/event_manager').EventManager;
const helper = require('./trace/traceHelper');
let SourceMappingDecoder = require('../util/source_map_decoder');
let util = require('../util/util')
// TODO: convert to es6/class
/**
 * Process the source code location for the current executing bytecode
 */
function SourceLocationTracker(_codeManager) {
  this.codeManager = _codeManager
  this.event = new EventManager()
  this.sourceMappingDecoder = new SourceMappingDecoder()
}

/**
 * Return the source location associated with the given @arg index
 *
 * @param {String} address - contract address from which the source location is retrieved
 * @param {Int} index - index in the instruction list from where the source location is retrieved
 * @param {Object} contractDetails - AST of compiled contracts
 * @param {Function} cb - callback function
 */
SourceLocationTracker.prototype.getSourceLocationFromInstructionIndex = function (address, index, contracts, cb) {
  let self = this
  extractSourceMap(this.codeManager, address, contracts, function (error, sourceMap) {
    if (error) {
      cb(error)
    } else {
      cb(null, self.sourceMappingDecoder.atIndex(index, sourceMap))
    }
  })
}

/**
 * Return the source location associated with the given @arg pc
 *
 * @param {String} address - contract address from which the source location is retrieved
 * @param {Int} vmtraceStepIndex - index of the current code in the vmtrace
 * @param {Object} contractDetails - AST of compiled contracts
 * @param {Function} cb - callback function
 */
SourceLocationTracker.prototype.getSourceLocationFromVMTraceIndex = function (address, vmtraceStepIndex, contracts, cb) {
  let self = this
  extractSourceMap(this.codeManager, address, contracts, function (error, sourceMap) { //runtime source map
    if (!error) {
      self.codeManager.getInstructionIndex(address, vmtraceStepIndex, function (error, index) {
        if (error) {
          cb(error)
        } else {
          cb(null, self.sourceMappingDecoder.atIndex(index, sourceMap))
        }
      })
    } else {
      cb(error)
    }
  })
}

/**
 * backwards compatibility - attribute name will certainly be changed
 */
function srcmapRuntime (contract) {
  return contract.srcmapRuntime ? contract.srcmapRuntime : contract['srcmap-runtime']
}

function getSourceMap (address, code, contracts) {
  let isCreation = helper.isContractCreation(address)
  let byteProp = isCreation ? 'bytecode' : 'runtimeBytecode'
  for (let k in contracts) {
    if (util.compareByteCode(code, '0x' + contracts[k][byteProp])) {
      return isCreation ? contracts[k].srcmap : srcmapRuntime(contracts[k])
    }
  }
  return null
}

function extractSourceMap (codeManager, address, contracts, cb) {
  codeManager.getCode(address, function (error, result) {
    if (!error) {
      let sourceMap = getSourceMap(address, result.bytecode, contracts)
      if (sourceMap) {
        cb(null, sourceMap)
      } else {
        cb('no srcmap associated with the code ' + address)
      }
    } else {
      cb(error)
    }
  })
}

module.exports = SourceLocationTracker
