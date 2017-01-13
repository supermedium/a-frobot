/* global afterEach, beforeEach, describe, it */
var assert = require('assert');
var childProcess = require('child_process');
var sinon = require('sinon');

var CherryPickDocCommit = require('../lib/cherryPickDocCommit');

var FIXTURE_AFRAME_COMMIT_COMMENT = require('./fixtures/aframeCommitComment');
var FIXTURE_AFRAME_COMMIT_DOCS_BRANCH = require('./fixtures/aframeCommitDocsBranch');

describe('cherryPickDocCommit', () => {
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

  it('runs', done => {
    CherryPickDocCommit.cherryPickDocCommit(FIXTURE_AFRAME_COMMIT_COMMENT).then(result => {
      assert.ok(result);
      assert.ok(execSpy.getCalls().length > 1);
      done();
    });
  });
});

describe('getBranchesFromMsg', () => {
  it('grabs single branch name from commit message', () => {
    const brs = CherryPickDocCommit.getBranchesFromMsg('@a-frobot docs-v0.4.0');
    assert.equal(brs.length, 1);
    assert.equal(brs[0], 'docs-v0.4.0');
  });

  it('grabs multiple branch names from commit message', () => {
    const brs = CherryPickDocCommit.getBranchesFromMsg('@a-frobot docs-v0.3.0 docs-v0.4.0');
    assert.equal(brs.length, 2);
    assert.equal(brs[0], 'docs-v0.3.0');
    assert.equal(brs[1], 'docs-v0.4.0');
  });
});

describe('shouldCherryPickDocCommit', () => {
  it('returns true if all conditions satisified for commit comment', () => {
    assert.ok(CherryPickDocCommit.shouldCherryPickDocCommit(FIXTURE_AFRAME_COMMIT_COMMENT));
  });

  it('returns false if not from contributor', () => {
    const data = Object.assign({}, FIXTURE_AFRAME_COMMIT_COMMENT);
    data.comment.user.login = 'somelady123';
    assert.ok(!CherryPickDocCommit.shouldCherryPickDocCommit(data));
  });

  it('returns false if comment does not contain branch name', () => {
    const data = Object.assign({}, FIXTURE_AFRAME_COMMIT_COMMENT);
    data.comment.body = '@a-frobot hey';
    assert.ok(!CherryPickDocCommit.shouldCherryPickDocCommit(data));
  });

  it('returns false if comment does not talk to the bot', () => {
    const data = Object.assign({}, FIXTURE_AFRAME_COMMIT_COMMENT);
    data.comment.body = 'docs-v0.3.0 docs-v0.4.0';
    assert.ok(!CherryPickDocCommit.shouldCherryPickDocCommit(data));
  });

  it('returns false if not comment', () => {
    assert.ok(!CherryPickDocCommit.shouldCherryPickDocCommit(
      FIXTURE_AFRAME_COMMIT_DOCS_BRANCH));
  });
});
