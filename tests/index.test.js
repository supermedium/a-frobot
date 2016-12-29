var assert = require('assert');
var childProcess = require('child_process');
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
    AFRO.bumpAframeDist(FIXTURE_AFRAME_COMMIT_PACKAGE_JSON).then(result => {
      assert.ok(result);
      assert.ok(execSpy.getCalls().length > 1);
      done();
    });;
  });
});
