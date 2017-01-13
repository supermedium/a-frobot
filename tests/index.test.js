/* global describe, it */
var assert = require('assert');
var childProcess = require('child_process');
var sinon = require('sinon');

var AFRO = require('../index');
var config = require('../config');

var FIXTURE_AFRAME_COMMIT_BOT = require('./fixtures/aframeCommitBot');
var FIXTURE_AFRAME_COMMIT_COMMENT = require('./fixtures/aframeCommitComment');
var FIXTURE_AFRAME_COMMIT_PACKAGE_JSON = require('./fixtures/aframeCommitPackageJson');

describe('config', () => {
  it('is a staging config', () => {
    assert.equal(config.repo, 'ngokevin/aframe');
  });
});

describe('postHandler', () => {
  beforeEach(() => {
    sinon.stub(childProcess, 'exec', function (command, opts, cb) { cb(); });
  });

  afterEach(() => {
    childProcess.exec.restore();
  });

  it('adds jobs to queue', () => {
    let data = Object.assign({}, FIXTURE_AFRAME_COMMIT_PACKAGE_JSON);
    AFRO.postHandler(data, AFRO.computeSignature(FIXTURE_AFRAME_COMMIT_PACKAGE_JSON));
    assert.equal(AFRO.QUEUE.getPendingLength(), 1);
    assert.equal(AFRO.QUEUE.getQueueLength(), 1);
  });

  it('handles comment', () => {
    let data = Object.assign({}, FIXTURE_AFRAME_COMMIT_COMMENT);
    AFRO.postHandler(data, AFRO.computeSignature(FIXTURE_AFRAME_COMMIT_COMMENT));
  });

  it('runs with valid token', () => {
    let data = Object.assign({}, FIXTURE_AFRAME_COMMIT_PACKAGE_JSON);
    data.repository.full_name = 'foo/bar';
    let res = AFRO.postHandler(data,
                               AFRO.computeSignature(FIXTURE_AFRAME_COMMIT_PACKAGE_JSON));
    assert.equal(res, 200);
  });

  it('does not run with invalid token', () => {
    let res = AFRO.postHandler(FIXTURE_AFRAME_COMMIT_PACKAGE_JSON, 'foo');
    assert.equal(res, 403);
  });

  it('does not run if commit is from the bot', () => {
    let data = Object.assign({}, FIXTURE_AFRAME_COMMIT_BOT);
    data.repository.full_name = 'foo/bar';
    let res = AFRO.postHandler(data, AFRO.computeSignature(FIXTURE_AFRAME_COMMIT_BOT));
    assert.equal(res, 204);
  });
});
