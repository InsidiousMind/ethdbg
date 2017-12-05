'use strict'
const remixLib = require('remix-lib')
let EventManager = remixLib.EventManager
let helper = remixLib.helpers.trace
let SourceMappingDecoder = remixLib.SourceMappingDecoder
let util = remixLib.util

/**
 * Process the source code location for the current executing bytecode
 */
function SourceLocationTracker (_codeManager) {
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
  var self = this
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
SourceLocationTracker.prototype.getSourceLocationFromVMTraceIndex = function (address, vmtraceStepIndex, sourceMap, cb) {
  var self = this
  self.codeManager.getInstructionIndex(address, vmtraceStepIndex, function (error, index) {
    if (error) {
      cb(error)
    } else {
      cb(null, self.sourceMappingDecoder.atIndex(index, sourceMap))
    }
  })
}

function getSourceMap (address, code, contracts) {
  var isCreation = helper.isContractCreation(address)
  var bytes
  for (var file in contracts) {
    for (var contract in contracts[file]) {
      bytes = isCreation ? contracts[file][contract].evm.bytecode.object : contracts[file][contract].evm.deployedBytecode.object
      if (util.compareByteCode(code, '0x' + bytes)) {
        return isCreation ? contracts[file][contract].evm.bytecode.sourceMap : contracts[file][contract].evm.deployedBytecode.sourceMap
      }
    }
  }
  return null
}

function extractSourceMap (codeManager, address, contracts, cb) {
  codeManager.getCode(address, function (error, result) {
    if (!error) {
      var sourceMap = getSourceMap(address, result.bytecode, contracts)
      if (sourceMap) {
        cb(null, sourceMap)
      } else {
        cb('no sourcemap associated with the code ' + address)
      }
    } else {
      cb(error)
    }
  })
}

module.exports = SourceLocationTracker
