var assert = require('assert');
var childProcess = require('child_process');
var sinon = require('sinon');

var AFRO = require('../index');

var FIXTURE_AFRAME_COMMIT_BOT = require('./fixtures/aframeCommitBot');
var FIXTURE_AFRAME_COMMIT_DOCS = require('./fixtures/aframeCommitDocs');
var FIXTURE_AFRAME_COMMIT_MULTI = require('./fixtures/aframeCommitMulti');
var FIXTURE_AFRAME_COMMIT_PACKAGE_JSON = require('./fixtures/aframeCommitPackageJson');

describe('postHandler', () => {
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

describe('shouldBumpAframeDist', () => {
  it('should bump when commit has package.json changes', () => {
    assert.ok(AFRO.shouldBumpAframeDist(FIXTURE_AFRAME_COMMIT_PACKAGE_JSON));
  });

  it('should bump when there are multiple commits and one has code changes', () => {
    assert.ok(AFRO.shouldBumpAframeDist(FIXTURE_AFRAME_COMMIT_MULTI));
  });

  it('should not bump when commit is doc changes', () => {
    assert.ok(!AFRO.shouldBumpAframeDist(FIXTURE_AFRAME_COMMIT_DOCS));
  });

  it('should not bumo when commit is from the bot', () => {
    assert.ok(!AFRO.shouldBumpAframeDist(FIXTURE_AFRAME_COMMIT_BOT));
  });
});
