var bodyParser = require('body-parser');
var childProcess = require('child_process');
var express = require('express');
var fs = require('fs');

var config = require('./config');

var app = express();

var TOKEN = process.env.GITHUB_TOKEN;
var REPO = config.repo;

// Clone repository.
new Promise((resolve, reject) => {
  if (fs.existsSync('aframe')) { return resolve(); }

  childProcess.spawn('git', ['clone', `https://${TOKEN}@github.com/${REPO}.git`], {
    stdio: 'inherit'
  }).on('close', resolve);
}).then(initApp);

// Git config.
// execSync('git config user.email aframebot@gmail.com');

function initApp () {
  // Set up Express.
  app.set('port', (process.env.PORT || 5000));
  app.use(bodyParser.json());
  app.get('/', function (req, res) {
    res.send('AFRO');
  })

  // Webhook handler.
  app.post('/postreceive', function handler (req, res) {
    var data = req.body;

    console.log(`Received message for ${data.repository.full_name}.`);

    if (data.repository.full_name === REPO) {
      bumpAframeDist(data);
    }

    res.send(data);
  })

  // Express listen.
  app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
  })
}

/**
 * Bump A-Frame master build on every commit.
 */
function bumpAframeDist (data) {
  if (!hasAframeCodeChanges(data)) { return Promise.resolve(false); }

  console.log('Bumping aframevr/aframe dist...');
  return new Promise(resolve => {
    exec([
      'git pull --rebase origin master',
      'npm install',
      'npm run dist',
      'git commit -m "bump dist"',
      `git push https://${TOKEN}@github.com/${REPO}.git master`
    ].join(' && '), {cwd: 'aframe', stdio: 'inherit'}, (err, stdout, stderr) => {
      resolve(true);
    });
  });
}
module.exports.bumpAframeDist = bumpAframeDist;

/**
 * Check if A-Frame commit has actual code changes.
 */
function hasAframeCodeChanges (data) {
  return data.head_commit.modified.filter(function (file) {
    return file.indexOf('src/') === 0 || file.indexOf('vendor/') === 0 ||
           file === 'package.json';
  }).length !== 0;
}
module.exports.hasAframeCodeChanges = hasAframeCodeChanges;
