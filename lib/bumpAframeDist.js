const async = require('async');
const childProcess = require('child_process');
const fs = require('fs');

const config = require('../config');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = config.REPO;

/**
 * Bump A-Frame master build on every commit.
 */
function bumpAframeDist (data) {
  if (!shouldBumpAframeDist(data)) { return Promise.resolve(false); }

  return new Promise(resolve => {
    console.log(`Bumping ${REPO} dist...`);
    async.series([
      execAframeCommand('git pull --rebase origin master'),
      execAframeCommand('node --max-old-space-size=200 /app/.heroku/node/bin/npm install'),
      execAframeCommand('node --max-old-space-size=200 /app/.heroku/node/bin/npm install --only="dev"'),
      execAframeCommand('npm run dist'),
      execAframeCommand('git add dist'),
      execAframeCommand('git commit -m "Bump aframe-master dist/ builds."'),
      execAframeCommand(`git push https://${GITHUB_TOKEN}@github.com/${REPO}.git master`)
    ], function asyncSeriesDone (err) {
      if (err) { return console.error(err); }
      console.log(`${REPO} dist successfully bumped!`);
      resolve(true);
    });
  });
}
module.exports.bumpAframeDist = bumpAframeDist;

/**
 * Helper for async.js.
 */
function execAframeCommand (command) {
  return callback => {
    console.log(`Running ${command}...`);
    childProcess.exec(command, {cwd: 'aframe', stdio: 'inherit'}, (err, stdout) => {
      if (err) { console.error(err); }
      callback();
    });
  };
}
module.exports.execAframeCommand = execAframeCommand;

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

  let isFromBot = data.head_commit.committer.email === config.userEmail ||
                  data.head_commit.committer.username === config.userName;

  return hasCodeChanges && !isFromBot;
}
module.exports.shouldBumpAframeDist = shouldBumpAframeDist;
