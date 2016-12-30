const bufferEq = require('buffer-equal-constant-time');
const bodyParser = require('body-parser');
const childProcess = require('child_process');
const crypto = require('crypto');
const express = require('express');
const fs = require('fs');

const config = require('./config');
const bumpAframeDist = require('./lib/bumpAframeDist').bumpAframeDist;
const bumpAframeDocs = require('./lib/bumpAframeDocs').bumpAframeDocs;
const bumpAframeRegistry = require('./lib/bumpAframeRegistry').bumpAframeRegistry;

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const WEBHOOK_SECRET = process.env.SECRET_TOKEN;

childProcess.execSync('rm -rf aframe-site');

// Git config.
if (process.env.AFROBOT_ENV !== 'test') {
  childProcess.execSync(`git config --global user.email ${config.userEmail}`);
  childProcess.execSync(`git config --global user.name ${config.userName}`);
}

initExpressApp();

/**
 * Express app.
 */
function initExpressApp () {
  console.log('A-frobot config:', JSON.stringify(config));

  const app = express();
  app.set('port', (process.env.PORT || 5000));
  app.use(bodyParser.json());
  app.get('/', function (req, res) {
    res.send('AFRO');
  });

  // Webhook handler.
  app.post('/postreceive', function handler (req, res) {
    res.send(postHandler(req.body, req.headers['x-hub-signature']));
  });

  // Express listen.
  app.listen(app.get('port'), function () {
    cloneRepositories();
    console.log('Node app is running on port', app.get('port'));
  });
}

/**
 * Handle webhook.
 */
function postHandler (data, githubSignature) {
  // Validate payload.
  if (!bufferEq(new Buffer(computeSignature(data)), new Buffer(githubSignature))) {
    console.log('Received invalid GitHub webhook signature. Check SECRET_TOKEN.');
    return 403;
  }

  if (data.commits) {
    console.log(`Received commit ${data.after} for ${data.repository.full_name}.`);

    // Check that the commit is not from the bot.
    if (data.head_commit.committer.email === config.userEmail ||
        data.head_commit.committer.username === config.userName) {
      console.log('Commit is from a-frobot, returning.');
      return 204;
    }

    if (data.repository.full_name === config.repo) {
      bumpAframeDist(data);
      bumpAframeDocs(data);
    }

    if (data.repository.full_name === config.repoRegistry) {
      bumpAframeRegistry(data);
    }
  }

  return 200;
}
module.exports.postHandler = postHandler;

/**
 * Clone repositories.
 */
function cloneRepositories () {
  if (process.env.AFROBOT_ENV === 'test') { return; }

  // A-Frame repository.
  if (!fs.existsSync('aframe')) {
    childProcess.spawn('git', [
      'clone',
      `https://${GITHUB_TOKEN}@github.com/${config.repo}.git`
    ], {stdio: 'inherit'}).on('close', () => {
      console.log('aframe cloned');
    });
  }

  // A-Frame Registry repository.
  if (!fs.existsSync('aframe-registry')) {
    childProcess.spawn('git', [
      'clone',
      `https://${GITHUB_TOKEN}@github.com/${config.repoRegistry}.git`
    ], {stdio: 'inherit'}).on('close', () => {
      console.log('registry cloned');
    });
  }

  // A-Frame Site repository.
  if (!fs.existsSync('aframe-site')) {
    childProcess.spawn('git', [
      'clone',
      `https://${GITHUB_TOKEN}@github.com/${config.repoSite}.git`
    ], {stdio: 'inherit'}).on('close', () => {
      console.log('site cloned');
    });
  }

  // A-Frame Site Github Pages repository.
  if (!fs.existsSync('aframevr.github.io')) {
    childProcess.spawn('git', [
      'clone',
      `https://${GITHUB_TOKEN}@github.com/${config.repoSitePages}.git`
    ], {stdio: 'inherit'}).on('close', () => {
      console.log('site pages cloned');
    });
  }
}

/**
 * Compute signature using secret token for validation.
 */
function computeSignature (data) {
  data = JSON.stringify(data);
  return `sha1=${crypto.createHmac('sha1', WEBHOOK_SECRET).update(data).digest('hex')}`;
}
module.exports.computeSignature = computeSignature;
