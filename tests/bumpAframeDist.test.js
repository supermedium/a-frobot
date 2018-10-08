/* global afterEach, beforeEach, describe, it */
const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const sinon = require('sinon');

const BumpAframeDist = require('../lib/bumpAframeDist');

const FIXTURE_AFRAME_COMMIT_DOCS = require('./fixtures/aframeCommitDocs');
const FIXTURE_AFRAME_COMMIT_MULTI = require('./fixtures/aframeCommitMulti');
const FIXTURE_AFRAME_COMMIT_PACKAGE_JSON = require('./fixtures/aframeCommitPackageJson');

describe('bumpAframeDist', () => {
  var execSpy;

  beforeEach(() => {
    execSpy = sinon.stub(childProcess, 'exec', function (command, opts, cb) {
      cb();
    });

    sinon.stub(fs, 'readFile', function (arg, opt, cb) { cb(null, ''); });
    sinon.stub(fs, 'writeFile', function (arg, data, cb) { cb(); });
  });

  afterEach(() => {
    childProcess.exec.restore();
    fs.readFile.restore();
    fs.writeFile.restore();
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
      let checked = false;
      calls.forEach(call => {
        if (checked || call.args[0].indexOf('git commit') === -1) { return; }
        assert.ok(call.args[0].indexOf(FIXTURE_AFRAME_COMMIT_PACKAGE_JSON.compare) !== -1);
        checked = true;
      });
      done();
    });
  });

  it('calls git push', (done) => {
    BumpAframeDist.bumpAframeDist(FIXTURE_AFRAME_COMMIT_PACKAGE_JSON).then(result => {
      const calls = execSpy.getCalls();
      const lastCall = calls[calls.length - 2];
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

describe('replaceReadmeCdnUrl', () => {
  it('replaces a URL', () => {
    const newStr = BumpAframeDist.replaceReadmeCdnUrl(
      `\n    <script src="https://cdn.jsdelivr.net/gh/aframevr/aframe@abc123/dist/aframe-master.min.js">\n`,
      'def456'
    );
    assert.equal(newStr,
      `\n    <script src="https://cdn.jsdelivr.net/gh/aframevr/aframe@def456/dist/aframe-master.min.js">\n`
    );
  });
});
