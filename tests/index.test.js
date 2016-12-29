var assert = require('assert');
var sinon = require('sinon');

var AFRO = require('../index');

var FIXTURE_AFRAME_COMMIT_DOCS = require('./fixtures/aframeCommitDocs');
var FIXTURE_AFRAME_COMMIT_PACKAGE_JSON = require('./fixtures/aframeCommitPackageJson');

describe('hasAframeCodeChanges', () => {
  it('detects when commit has code changes', () => {
    assert.ok(AFRO.hasAframeCodeChanges(FIXTURE_AFRAME_COMMIT_PACKAGE_JSON));
  });

  it('detects when commit does not have code changes', () => {
    assert.ok(!AFRO.hasAframeCodeChanges(FIXTURE_AFRAME_COMMIT_DOCS));
  });
});

describe('bumpAframeDist', () => {
  beforeEach(() => {
  });

  afterEach(() => {
  });

  it('detects when commit has code changes', () => {
    assert.ok(AFRO.hasAframeCodeChanges(FIXTURE_AFRAME_COMMIT_PACKAGE_JSON));
  });

  it('detects when commit does not have code changes', () => {
    assert.ok(!AFRO.hasAframeCodeChanges(FIXTURE_AFRAME_COMMIT_DOCS));
  });
});
