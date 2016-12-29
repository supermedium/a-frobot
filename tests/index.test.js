var assert = require('assert');
var childProcess = require('child_process');
var sinon = require('sinon');

var AFRO = require('../index');

var FIXTURE_AFRAME_COMMIT_DOCS = require('./fixtures/aframeCommitDocs');
var FIXTURE_AFRAME_COMMIT_PACKAGE_JSON = require('./fixtures/aframeCommitPackageJson');

describe('postHandler', () => {
  it('runs with valid token', () => {
    let data = Object.assign({}, FIXTURE_AFRAME_COMMIT_PACKAGE_JSON);
    data.repository.full_name = 'foo/bar';
    let res = AFRO.postHandler(data,
                               AFRO.computeSignature(FIXTURE_AFRAME_COMMIT_PACKAGE_JSON));
    assert.ok(res);
  });

  it('does not run with invalid token', () => {
    let res = AFRO.postHandler(FIXTURE_AFRAME_COMMIT_PACKAGE_JSON, 'foo');
    assert.ok(!res);
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

describe('hasAframeCodeChanges', () => {
  it('detects when commit has code changes', () => {
    assert.ok(AFRO.hasAframeCodeChanges(FIXTURE_AFRAME_COMMIT_PACKAGE_JSON));
  });

  it('detects when commit does not have code changes', () => {
    assert.ok(!AFRO.hasAframeCodeChanges(FIXTURE_AFRAME_COMMIT_DOCS));
  });
});

