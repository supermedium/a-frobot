const async = require('async');

const config = require('../config');
const utils = require('./utils');

const execCommand = utils.execCommand;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

/**
 * Deploy A-Frame site.
 */
function deployAframeSite (data) {
  return new Promise(resolve => {
    console.log(`Deploying A-Frame site...`);
    doDeployAframeSite(`Deploy A-Frame site (${data.compare}).`,
                       () => { resolve(true); });
  });
}
module.exports.deployAframeSite = deployAframeSite;

/**
 * Reusable function to deploy A-Frame site without any checks.
 */
function doDeployAframeSite (message, cb) {
  async.series([
    execCommand('git reset --hard HEAD', 'aframe-site'),
    execCommand('git reset --hard HEAD', 'aframevr.github.io'),
    execCommand('git pull --rebase origin master', 'aframe-site'),
    execCommand('git pull --rebase origin master', 'aframevr.github.io'),
    execCommand('npm install --only="dev"', 'aframe-site'),
    execCommand('npm install', 'aframe-site'),
    execCommand('npm run bumpdocs', 'aframe-site'),
    execCommand('npm run generate', 'aframe-site',
                process.env.AFROBOT_ENV === 'test' ? 0 : 5000),
    execCommand('rm -rf *', 'aframevr.github.io'),
    execCommand('cp -r public/* ../aframevr.github.io', 'aframe-site'),
    execCommand('git status', 'aframevr.github.io'),
    execCommand('git add -A .', 'aframevr.github.io'),
    execCommand(`git commit -m "${message}"`, 'aframevr.github.io'),
    execCommand(
      `git push https://${GITHUB_TOKEN}@github.com/${config.repoSitePages}.git master`,
      'aframevr.github.io')
  ], function asyncSeriesDone (err) {
    if (err) { return console.error(err); }
    console.log(`A-Frame site successfully deployed!`);
    cb();
  });
}
module.exports.doDeployAframeSite = doDeployAframeSite;
