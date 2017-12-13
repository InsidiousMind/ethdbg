"use strict";

/**
 * Context object providing access between elements of the debugger to
 * internal program information.
 * @author Sean Batzel
 * @param {string} line - current line of code
 * @param {Object} variables - dictionary of variables currently in scope
 * @param {boolean} exception - are we stopped because of an exception?
 * @param {Array} errInfo - any information that we'd need if an exception did occur
 * @param {Array} stack - current stack trace
 * @public
 */
class Context {
  constructor(line, variables, exception, errInfo, stacktrace) {
    this.line = line;
    this.variables = variables;
    this.exception = exception;
    this.errInfo = errInfo;
    this.stack = stack;
  }
}

module.export = Context;
exports.Context = Context;