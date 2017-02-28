/* global afterEach, beforeEach, describe, it */
var assert = require('assert');
var childProcess = require('child_process');
var sinon = require('sinon');

var BumpAframeDocs = require('../lib/bumpAframeDocs');

var FIXTURE_AFRAME_COMMIT = require('./fixtures/aframeCommit');
var FIXTURE_AFRAME_COMMIT_DOCS = require('./fixtures/aframeCommitDocs');
var FIXTURE_AFRAME_COMMIT_DOCS_BRANCH = require('./fixtures/aframeCommitDocsBranch');
var FIXTURE_AFRAME_COMMIT_MULTI = require('./fixtures/aframeCommitMulti');

describe('bumpAframeDocs', () => {
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
    BumpAframeDocs.bumpAframeDocs(FIXTURE_AFRAME_COMMIT_DOCS).then(result => {
      assert.ok(result);
      assert.ok(execSpy.getCalls().length > 1);
      done();
    });
  });

  it('calls git push', (done) => {
    BumpAframeDocs.bumpAframeDocs(FIXTURE_AFRAME_COMMIT_DOCS).then(result => {
      const calls = execSpy.getCalls();
      const lastCall = calls[calls.length - 1];
      assert.equal(lastCall.args[0],
                   'git push https://abc@github.com/ngokevin/aframevr.github.io.git master');
      assert.equal(lastCall.args[1].cwd,
                   'aframevr.github.io');
      done();
    });
  });
});

describe('shouldBumpDocs', () => {
  it('should bump when commit has docs changes on master', () => {
    assert.ok(BumpAframeDocs.shouldBumpDocs(FIXTURE_AFRAME_COMMIT_DOCS));
  });

  it('should bump when commit has docs changes on docs branch', () => {
    assert.ok(BumpAframeDocs.shouldBumpDocs(FIXTURE_AFRAME_COMMIT_DOCS_BRANCH));
  });

  it('should bump when hook has multiple commits, one with doc changes', () => {
    assert.ok(BumpAframeDocs.shouldBumpDocs(FIXTURE_AFRAME_COMMIT_MULTI));
  });

  it('should not bump when commit does not have docs changes', () => {
    assert.ok(!BumpAframeDocs.shouldBumpDocs(FIXTURE_AFRAME_COMMIT));
  });
});
