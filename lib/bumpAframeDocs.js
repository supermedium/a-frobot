const async = require('async');

const config = require('../config');
const utils = require('./utils');

const execCommand = utils.execCommand;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

/**
 * Run `bumpdocs` on the aframe-site repository and deploy.
 */
function bumpAframeDocs (data) {
  if (!shouldBumpDocs(data)) { return Promise.resolve(false); }

  return new Promise(resolve => {
    console.log(`Bumping A-Frame docs...`);
    doBumpAframeDocs(data.compare, () => { resolve(true); });
  });
}
module.exports.bumpAframeDocs = bumpAframeDocs;

/**
 * Reusable function to deploy new A-Frame documentation without any checks.
 */
function doBumpAframeDocs (message, cb) {
  async.series([
    execCommand('git reset --hard HEAD', 'aframe-site'),
    execCommand('git reset --hard HEAD', 'aframevr.github.io'),
    execCommand('git pull --rebase origin master', 'aframe-site'),
    execCommand('git pull --rebase origin master', 'aframevr.github.io'),
    execCommand('npm install --only="dev"', 'aframe-site'),
    execCommand('npm install', 'aframe-site'),
    execCommand('npm run bumpdocs', 'aframe-site'),
    execCommand('npm run generate', 'aframe-site'),
    execCommand('rm -rf *', 'aframevr.github.io'),
    execCommand('cp -r public/* ../aframevr.github.io', 'aframe-site'),
    execCommand('git status', 'aframevr.github.io'),
    execCommand('git add .', 'aframevr.github.io'),
    execCommand(`git commit -m "Bump A-Frame documentation (${message})."`,
                'aframevr.github.io'),
    execCommand(
      `git push https://${GITHUB_TOKEN}@github.com/${config.repoSitePages}.git master`,
      'aframevr.github.io')
  ], function asyncSeriesDone (err) {
    if (err) { return console.error(err); }
    console.log(`A-Frame docs successfully bumped!`);
    cb();
  });
}
module.exports.doBumpAframeDocs = doBumpAframeDocs;

/**
 * Check if A-Frame commit has changes to the documentation.
 */
function shouldBumpDocs (data) {
  // Limit to master branch and documentation branches.
  if (data.ref !== 'refs/heads/master' && !data.ref.startsWith('refs/heads/docs-v')) {
    return false;
  }

  function commitHasDocsChanges (commit) {
    return commit.modified.filter(function (file) {
      return file.startsWith('docs/') && file.endsWith('.md');
    }).length !== 0;
  }

  let hasDocsChanges = false;
  data.commits.forEach(commit => {
    if (commitHasDocsChanges(commit)) {
      hasDocsChanges = true;
    }
  });

  return hasDocsChanges;
}
module.exports.shouldBumpDocs = shouldBumpDocs;
