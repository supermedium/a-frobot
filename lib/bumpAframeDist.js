const async = require('async');
const fs = require('fs');
const gitRev = require('git-rev');

const config = require('../config');
const utils = require('./utils');

const execCommand = utils.execCommand;

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const CDN = 'https://rawgit.com/aframevr/aframe/';
const CDN_PATH = 'dist/aframe-master.min.js';

/**
 * Bump A-Frame master build on every commit.
 */
function bumpAframeDist (data) {
  if (!shouldBumpAframeDist(data)) { return Promise.resolve(false); }

  return new Promise(resolve => {
    console.log(`Bumping ${config.repo} dist...`);
    // Bump dist/.
    async.series([
      execCommand('git reset --hard HEAD', 'aframe'),
      execCommand('git pull --rebase origin master', 'aframe'),
      execCommand('npm install --only="dev"', 'aframe'),
      execCommand('npm install', 'aframe'),
      execCommand('npm run dist', 'aframe'),
      execCommand('git status', 'aframe'),
      execCommand('git add .', 'aframe'),
      execCommand(`git commit -m "Bump aframe-master dist/ builds. (${data.compare})"`,
                  'aframe'),
    ], err => {
      // Bump CDN URLs.
      process.chdir('./aframe');
      gitRev.short(hash => {
        process.chdir('../');
        async.series([
          cb => replaceReadmeCdnUrls(hash, cb),
          execCommand('git status', 'aframe'),
          execCommand('git add .', 'aframe'),
          execCommand(`git commit -m "Update master CDN URL. ` +
                      `(${CDN}${hash}/${CDN_PATH})"`, 'aframe'),
          execCommand(
            `git push https://${GITHUB_TOKEN}@github.com/${config.repo}.git master`,
            'aframe'),
          execCommand(
            `git push https://${GITHUB_TOKEN}@github.com/${config.userName}/aframe.git ` +
            `master -f`, 'aframe')
        ], function asyncSeriesDone (err) {
          if (err) { return console.error(err); }
          console.log(`${config.repo} dist successfully bumped!`);
          resolve(true);
        });
      });
    });
  });
}
module.exports.bumpAframeDist = bumpAframeDist;

/**
 * Check if A-Frame commit has actual code changes.
 */
function shouldBumpAframeDist (data) {
  // Limit to master branch.
  if (data.ref !== 'refs/heads/master') { return false; }

  function commitHasCodeChanges (commit) {
    return commit.modified.filter(function (file) {
      return file.indexOf('src/') === 0 || file.indexOf('vendor/') === 0 ||
             file === 'package.json';
    }).length !== 0;
  }

  let hasCodeChanges = false;
  data.commits.forEach(commit => {
    if (commitHasCodeChanges(commit)) {
      hasCodeChanges = true;
    }
  });

  return hasCodeChanges;
}
module.exports.shouldBumpAframeDist = shouldBumpAframeDist;

/**
 * Replace CDN URLs in the dist/ README.
 */
function replaceReadmeCdnUrls (hash, cb) {
  fs.readFile('./aframe/dist/README.md', 'utf-8', (err, data) => {
    if (err) { console.error(err); }
    fs.writeFile('./aframe/dist/README.md', replaceReadmeCdnUrl(data, hash), cb);
  });
}

/**
 * `<script src="https://rawgit.com/aframevr/aframe/abc123/aframe-master.min.js">` to
 * `<script src="https://rawgit.com/aframevr/aframe/def456/aframe-master.min.js>`
 */
function replaceReadmeCdnUrl (data, hash) {
  return data.replace(
    /<script src=".*?\/aframe-master.min.js">/,
    `<script src="${CDN}${hash}/dist/aframe-master.min.js">`
  );
}
module.exports.replaceReadmeCdnUrl = replaceReadmeCdnUrl;
