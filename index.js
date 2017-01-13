const async = require('async');
const bufferEq = require('buffer-equal-constant-time');
const bodyParser = require('body-parser');
const childProcess = require('child_process');
const crypto = require('crypto');
const express = require('express');
const fs = require('fs');
const PromiseQueue = require('promise-queue');

require('./tokens');
const config = require('./config');
const bumpAframeDist = require('./lib/bumpAframeDist').bumpAframeDist;
const bumpAframeDocs = require('./lib/bumpAframeDocs').bumpAframeDocs;
const bumpAframeRegistry = require('./lib/bumpAframeRegistry').bumpAframeRegistry;
const cherryPickDocCommit = require('./lib/cherryPickDocCommit').cherryPickDocCommit;

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const WEBHOOK_SECRET = process.env.SECRET_TOKEN;

// Only run one Git job at a time.
const QUEUE = new PromiseQueue(1, Infinity);
module.exports.QUEUE = QUEUE;

// Git config.
if (process.env.AFROBOT_ENV !== 'test') {
  childProcess.execSync(`git config --global user.email ${config.userEmail}`);
  childProcess.execSync(`git config --global user.name ${config.userName}`);
}

// Limit memory usage.
childProcess.execSync('npm config set jobs 1');

initExpressApp();

/**
 * Express app.
 */
function initExpressApp () {
  console.log('A-frobot config:', JSON.stringify(config));

  const app = express();
  app.set('port', process.env.PORT || 5000);
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

    // A-Frame repository.
    if (data.repository.full_name === config.repo) {
      QUEUE.add(() => bumpAframeDist(data));
      QUEUE.add(() => bumpAframeDocs(data));

      if (data.action === 'created' && data.comment) {
        QUEUE.add(() => cherryPickDocCommit(data));
      }
    }

    // A-Frame Registry repository.
    if (data.repository.full_name === config.repoRegistry) {
      QUEUE.add(() => bumpAframeRegistry(data));
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

  async.series([
    clone('aframe', config.repo),
    clone('aframe-registry', config.repoRegistry),
    clone('aframe-site', config.repoSite),
    clone('aframevr.github.io', config.repoSitePages)
  ], function () {
    console.log('All repositories cloned.');
  });

  function clone (dir, repo) {
    return cb => {
      if (fs.existsSync(dir)) { return cb(); }
      childProcess.spawn('git', ['clone', `https://${GITHUB_TOKEN}@github.com/${repo}.git`], {
        stdio: 'inherit'
      }).on('close', function () {
        console.log(`${dir} cloned`);
        this.kill('SIGINT')
        cb();
      });
    };
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
