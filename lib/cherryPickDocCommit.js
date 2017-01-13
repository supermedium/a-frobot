const async = require('async');
const fs = require('fs');

const config = require('../config');
const utils = require('./utils');
const doBumpAframeDocs = require('./bumpAframeDocs').doBumpAframeDocs;

const execCommand = utils.execCommand;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

/**
 * Cherry-pick commit to documentation branch. Then deploy site.
 */
function cherryPickDocCommit (data) {
  if (!shouldCherryPickDocCommit(data)) { return Promise.resolve(false); }

  return new Promise(resolve => {
    const branch = getBranchesFromMsg(data.comment.body)[0];
    console.log(`Cherry-picking doc commit for ${branch}...`);

    async.series([
      execCommand('git reset --hard HEAD', 'aframe'),
      execCommand('git pull --rebase origin master', 'aframe'),
      execCommand(`git fetch origin ${branch}:${branch}`, 'aframe'),
      execCommand(`git checkout ${branch}`, 'aframe'),
      execCommand(`git cherry-pick ${data.comment.commit_id}`, 'aframe'),
      execCommand(
        `git push https://${GITHUB_TOKEN}@github.com/${config.repo}.git ${branch}`,
        'aframe'),
      execCommand(`git cherry-pick --abort`, 'aframe'),
      execCommand(`git checkout master`, 'aframe'),
    ], function asyncSeriesDone (err) {
      if (err) { return console.error(err); }
      console.log(`A-Frame doc commit successfully cherry-picked!`);

      doBumpAframeDocs(`Picked ${data.comment.commit_id} to ${branch}`, () => {
        resolve(true);
      });
    });
  });
}
module.exports.cherryPickDocCommit = cherryPickDocCommit;

/**
 * Check if comment is asking for a cherry-pick.
 */
function shouldCherryPickDocCommit (data) {
  return data.comment &&
         data.comment.body &&
         data.comment.body.startsWith(`@${config.userName}`) &&
         data.comment.body.indexOf('docs-v') !== -1 &&
         config.contributors.indexOf(data.comment.user.login) !== -1;
}
module.exports.shouldCherryPickDocCommit = shouldCherryPickDocCommit;

/**
 * Get which branches to cherry-pick from the message.
 */
function getBranchesFromMsg (message) {
  return message.match(/docs-v\d+\.\d+.\d+/g);
}
module.exports.getBranchesFromMsg = getBranchesFromMsg;
