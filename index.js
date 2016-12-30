var async = require('async');
var bufferEq = require('buffer-equal-constant-time');
var bodyParser = require('body-parser');
var childProcess = require('child_process');
var crypto = require('crypto');
var express = require('express');
var fs = require('fs');

var config = require('./config');

var app = express();

var GITHUB_TOKEN = process.env.GITHUB_TOKEN;
var REPO = config.repo;
var WEBHOOK_SECRET = process.env.SECRET_TOKEN;

// Git config.
if (process.env.NODE_ENV !== 'test') {
  childProcess.execSync(`git config --global user.email ${config.userEmail}`);
  childProcess.execSync(`git config --global user.name ${config.userName}`);
}

// Clone repository.
new Promise((resolve, reject) => {
  if (fs.existsSync('aframe')) { return resolve(); }

  childProcess.spawn('git', ['clone', `https://${GITHUB_TOKEN}@github.com/${REPO}.git`], {
    stdio: 'inherit'
  }).on('close', resolve);
}).then(initExpressApp);

/**
 * Express app.
 */
function initExpressApp () {
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

  console.log(`Received commit ${data.after} for ${data.repository.full_name}.`);
  if (data.repository.full_name === REPO && data.commits) {
    bumpAframeDist(data);
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
