const async = require('async');

const config = require('../config');
const utils = require('./utils');

const execCommand = utils.execCommand;

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

/**
 * Bump A-Frame Registry on changes to the registry.
 */
function bumpAframeRegistry (data) {
  if (!shouldBumpAframeRegistry(data)) { return Promise.resolve(false); }

  return new Promise(resolve => {
    console.log(`Bumping A-Frame Registry...`);
    async.series([
      execCommand('git reset --hard HEAD', 'aframe-registry'),
      execCommand('git pull --rebase origin master', 'aframe-registry'),
      execCommand('npm install --include=dev', 'aframe-registry'),
      execCommand('rm scripts/config.local.js', 'aframe-registry'),
      execCommand('npm run config', 'aframe-registry'),
      execCommand('npm run build', 'aframe-registry'),
      execCommand('git status', 'aframevr.github.io'),
      execCommand('git add -A .', 'aframe-registry'),
      execCommand(`git commit -m "Bump Registry builds and site (${data.compare})."`,
                  'aframe-registry'),
      execCommand(
        `git push https://${GITHUB_TOKEN}@github.com/${config.repoRegistry}.git master`,
        'aframe-registry')
    ], function asyncSeriesDone (err) {
      if (err) { return console.error(err); }
      console.log(`A-Frame Registry successfully bumped!`);
      resolve(true);
    });
  });
}
module.exports.bumpAframeRegistry = bumpAframeRegistry;

/**
 * Check if A-Frame commit has changes to the Registry.
 */
function shouldBumpAframeRegistry (data) {
  function commitHasRegistryChanges (commit) {
    return commit.modified.filter(function (file) {
      return file === 'registry.yml' || file === 'registry.json';
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
