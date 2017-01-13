/* global afterEach, beforeEach, describe, it */
var assert = require('assert');
var childProcess = require('child_process');
var sinon = require('sinon');

var BumpAframeRegistry = require('../lib/bumpAframeRegistry');

var FIXTURE_REGISTRY_COMMIT = require('./fixtures/registryCommit');
var FIXTURE_REGISTRY_COMMIT_README = require('./fixtures/registryCommitReadme');

describe('bumpAframeRegistry', () => {
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
    BumpAframeRegistry.bumpAframeRegistry(FIXTURE_REGISTRY_COMMIT).then(result => {
      assert.ok(result);
      assert.ok(execSpy.getCalls().length > 1);
      done();
    });
  });

  it('calls git push', (done) => {
    BumpAframeRegistry.bumpAframeRegistry(FIXTURE_REGISTRY_COMMIT).then(result => {
      const calls = execSpy.getCalls();
      const lastCall = calls[calls.length - 1];
      assert.equal(lastCall.args[0],
                   'git push https://abc@github.com/ngokevin/aframe-registry.git master');
      done();
    });
  });
});

describe('shouldBumpAframeRegistry', () => {
  it('should bump when commit has registry changes', () => {
    assert.ok(BumpAframeRegistry.shouldBumpAframeRegistry(FIXTURE_REGISTRY_COMMIT));
  });

  it('should not bump when commit does not have registry changes', () => {
    assert.ok(!BumpAframeRegistry.shouldBumpAframeRegistry(FIXTURE_REGISTRY_COMMIT_README));
  });
});
