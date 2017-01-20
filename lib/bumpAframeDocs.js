const async = require('async');

const config = require('../config');
const doDeployAframeSite = require('./deployAframeSite').doDeployAframeSite;
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
    doDeployAframeSite(`Bump A-Frame documentation (${data.compare}).`, () => {
      console.log(`A-Frame docs successfully bumped!`);
      resolve(true);
    });
  });
}
module.exports.bumpAframeDocs = bumpAframeDocs;

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
