const async = require('async');
const childProcess = require('child_process');
const fs = require('fs');

const config = require('../config');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

/**
 * Bump A-Frame Registry on changes to the registry.
 */
function bumpAframeRegistry (data) {
  if (!shouldBumpAframeRegistry(data)) { return Promise.resolve(false); }

  return new Promise(resolve => {
    console.log(`Bumping A-Frame Registry...`);
    async.series([
      execRegistryCommand('git pull --rebase origin master'),
      execRegistryCommand('node --max-old-space-size=200 /app/.heroku/node/bin/npm install'),
      execRegistryCommand(
        'node --max-old-space-size=200 /app/.heroku/node/bin/npm install --only="dev"'),
      execRegistryCommand('npm run build'),
      execRegistryCommand('git add .'),
      execRegistryCommand('git commit -m "Bump Registry builds and site."'),
      execRegistryCommand(
        `git push https://${GITHUB_TOKEN}@github.com/${config.repoRegistry}.git master`)
    ], function asyncSeriesDone (err) {
      if (err) { return console.error(err); }
      console.log(`A-Frame Registry successfully bumped!`);
      resolve(true);
    });
  });
}
module.exports.bumpAframeRegistry= bumpAframeRegistry;

/**
 * Helper for async.js.
 */
function execRegistryCommand (command) {
  return callback => {
    console.log(`Running ${command}...`);
    childProcess.exec(command, {cwd: 'aframe-registry', stdio: 'inherit'}, (err, stdout) => {
      if (err) { console.error(err); }
      callback();
    });
  };
}

/**
 * Check if A-Frame commit has changes to the Registry.
 */
function shouldBumpAframeRegistry (data) {
  function commitHasRegistryChanges (commit) {
    return commit.modified.filter(function (file) {
      return file === 'registry.yml' || file === 'registry.json'
    }).length !== 0;
  }

  let hasRegistryChanges = false;
  data.commits.forEach(commit => {
    if (commitHasRegistryChanges(commit)) {
      hasRegistryChanges = true;
    }
  });

  return hasRegistryChanges;
}
module.exports.shouldBumpAframeRegistry = shouldBumpAframeRegistry;
