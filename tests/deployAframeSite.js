/* global afterEach, beforeEach, describe, it */
var assert = require('assert');
var childProcess = require('child_process');
var sinon = require('sinon');

var doDeployAframeSite = require('../lib/deployAframeSite').doDeployAframeSite;

describe('doDeployAframeSite', () => {
  var execSpy;

  beforeEach(() => {
    execSpy = sinon.stub(childProcess, 'exec', function (command, opts, cb) {
      cb();
    });
  });

  afterEach(() => {
    childProcess.exec.restore();
    execSpy = undefined;
  });

  it('calls commands', (done) => {
    doDeployAframeSite('message', () => {
      assert.ok(execSpy.getCalls().length > 1);
      done();
    });
  });
});
