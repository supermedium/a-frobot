const bufferEq = require('buffer-equal-constant-time');
const bodyParser = require('body-parser');
const childProcess = require('child_process');
const crypto = require('crypto');
const express = require('express');
const fs = require('fs');

const config = require('./config');
const bumpAframeDist = require('./lib/bumpAframeDist').bumpAframeDist;
const bumpAframeRegistry = require('./lib/bumpAframeRegistry').bumpAframeRegistry;

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const WEBHOOK_SECRET = process.env.SECRET_TOKEN;

// Git config.
if (process.env.NODE_ENV !== 'test') {
  childProcess.execSync(`git config --global user.email ${config.userEmail}`);
  childProcess.execSync(`git config --global user.name ${config.userName}`);
}

// Clone repositories.
new Promise((resolve, reject) => {
  let clonedRepositories = [];

  if (process.env.NODE_ENV === 'test') { return resolve(); }

  // A-Frame repository.
  if (!fs.existsSync('aframe')) {
    clonedRepositories.push(new Promise(resolve => {
      childProcess.spawn('git', [
        'clone',
        `https://${GITHUB_TOKEN}@github.com/${config.repo}.git`
      ], {stdio: 'inherit'}).on('close', resolve);
    }));
  }

  // A-Frame Registry repository.
  if (!fs.existsSync('aframe-registry')) {
    clonedRepositories.push(new Promise(resolve => {
      childProcess.spawn('git', [
        'clone',
        `https://${GITHUB_TOKEN}@github.com/${config.repoRegistry}.git`
      ], {stdio: 'inherit'}).on('close', resolve);
    }));
  }

  Promise.all(clonedRepositories).then(resolve);
}).then(initExpressApp);

/**
 * Express app.
 */
function initExpressApp () {
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

  // Check that the commit is not from the bot.
  if (data.head_commit.committer.email === config.userEmail ||
      data.head_commit.committer.username === config.userName) {
    return 204;
  }

  console.log(`Received commit ${data.after} for ${data.repository.full_name}.`);
  if (data.repository.full_name === config.repo && data.commits) {
    bumpAframeDist(data);
  }
  if (data.repository.full_name === config.repoRegistry && data.commits) {
    bumpAframeRegistry(data);
  }
  return 200;
}
module.exports.postHandler = postHandler;

/**
 * Compute signature using secret token for validation.
 */
function computeSignature (data) {
  data = JSON.stringify(data);
  return `sha1=${crypto.createHmac('sha1', WEBHOOK_SECRET).update(data).digest('hex')}`;
}
module.exports.computeSignature = computeSignature;
