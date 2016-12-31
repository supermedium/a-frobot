const async = require('async');
const childProcess = require('child_process');
const fs = require('fs');

const config = require('../config');
const utils = require('./utils');

const execCommand = utils.execCommand;

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

/**
 * Bump A-Frame master build on every commit.
 */
function bumpAframeDist (data) {
  if (!shouldBumpAframeDist(data)) { return Promise.resolve(false); }

  return new Promise(resolve => {
    console.log(`Bumping ${config.repo} dist...`);
    async.series([
      execCommand('git reset --hard HEAD', 'aframe'),
      execCommand('git pull --rebase origin master', 'aframe'),
      execCommand(
        'node --max-old-space-size=200 /app/.heroku/node/bin/npm install --only="dev"',
        'aframe'),
      execCommand('node --max-old-space-size=200 /app/.heroku/node/bin/npm install',
                  'aframe'),
      execCommand('npm run dist', 'aframe'),
      execCommand('git status', 'aframe'),
      execCommand('git add dist', 'aframe'),
      execCommand('git commit -m "Bump aframe-master dist/ builds."', 'aframe'),
      execCommand(
        `git push https://${GITHUB_TOKEN}@github.com/${config.repo}.git master`, 'aframe')
    ], function asyncSeriesDone (err) {
      if (err) { return console.error(err); }
      console.log(`${config.repo} dist successfully bumped!`);
      resolve(true);
    });
  });
}
module.exports.bumpAframeDist = bumpAframeDist;

/**
 * Check if A-Frame commit has actual code changes.
 */
function shouldBumpAframeDist (data) {
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
