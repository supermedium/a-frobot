/* global afterEach, beforeEach, describe, it */
var assert = require('assert');
var childProcess = require('child_process');
var sinon = require('sinon');

var AFRO = require('../index');
var BumpAframeDist = require('../lib/bumpAframeDist');

var FIXTURE_AFRAME_COMMIT_BOT = require('./fixtures/aframeCommitBot');
var FIXTURE_AFRAME_COMMIT_DOCS = require('./fixtures/aframeCommitDocs');
var FIXTURE_AFRAME_COMMIT_MULTI = require('./fixtures/aframeCommitMulti');
var FIXTURE_AFRAME_COMMIT_PACKAGE_JSON = require('./fixtures/aframeCommitPackageJson');

describe('bumpAframeDist', () => {
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
    BumpAframeDist.bumpAframeDist(FIXTURE_AFRAME_COMMIT_PACKAGE_JSON).then(result => {
      assert.ok(result);
      assert.ok(execSpy.getCalls().length > 1);
      done();
    });
  });

  it('calls git commit with compare URL', (done) => {
    BumpAframeDist.bumpAframeDist(FIXTURE_AFRAME_COMMIT_PACKAGE_JSON).then(result => {
      const calls = execSpy.getCalls();
      calls.forEach(call  => {
        if (call.args[0].indexOf('git commit') === -1) { return; }
        assert.ok(call.args[0].indexOf(FIXTURE_AFRAME_COMMIT_PACKAGE_JSON.compare) !== -1);
      });
      done();
    });
  });

  it('calls git push', (done) => {
    BumpAframeDist.bumpAframeDist(FIXTURE_AFRAME_COMMIT_PACKAGE_JSON).then(result => {
      const calls = execSpy.getCalls();
      const lastCall = calls[calls.length - 1];
      assert.equal(lastCall.args[0],
                   'git push https://abc@github.com/ngokevin/aframe.git master');
      done();
    });
  });
});

describe('shouldBumpAframeDist', () => {
  it('should bump when commit has package.json changes', () => {
    assert.ok(BumpAframeDist.shouldBumpAframeDist(FIXTURE_AFRAME_COMMIT_PACKAGE_JSON));
  });

  it('should bump when there are multiple commits and one has code changes', () => {
    assert.ok(BumpAframeDist.shouldBumpAframeDist(FIXTURE_AFRAME_COMMIT_MULTI));
  });

  it('should not bump when commit is doc changes', () => {
    assert.ok(!BumpAframeDist.shouldBumpAframeDist(FIXTURE_AFRAME_COMMIT_DOCS));
  });
});
