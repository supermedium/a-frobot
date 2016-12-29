var bodyParser = require('body-parser');
var config = require('./config');
var express = require('express');
var fs = require('fs');
var spawn = require('child_process').spawn;

var app = express();

var TOKEN = process.env.GITHUB_TOKEN;
var REPO = config.repo;

// Clone repository.
var repositoryCloned = new Promise((resolve, reject) => {
  if (fs.existsSync('aframe')) { return resolve(); }
  let stream = spawn(`git clone https://${TOKEN}@github.com/${REPO}.git`);
  stream.stdout.on('data', console.log);
  stream.stderr.on('data', console.error);
  stream.on('close', resolve);
});

// Git config.
// execSync('git config user.email aframebot@gmail.com');

stream.then(() => {
  // Set up Express.
  app.set('port', (process.env.PORT || 5000));
  app.use(bodyParser.json());
  app.get('/', function (req, res) {
    res.send('AFRO');
  })

  // Webhook handler.
  app.post('/postreceive', function (req, res) {
    var data = req.body;

    if (data.repository.full_name === 'aframevr/aframe') {
      bumpDist(data);
    }

    res.send(data);
  })

  // Express listen.
  app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
  })

  // Bump A-Frame master build on every commit.
  function bumpDist (data) {
    var hasCodeChanges = data.repository.head_commit.modified.filter(function (file) {
      return file.indexOf('src/' === 0) || file.indexOf('vendor/') === 0 ||
             file === 'package.json';
    }).length;

    if (!hasCodeChanges) { return; }

    execSync('git pull --rebase origin master', {cwd: 'aframe'});  // Rebase.
    execSync('npm install', {cwd: 'aframe'});  // Install.
    execSync('npm run dist', {cwd: 'aframe'});  // Bump.
    execSync('git commit -m "bump dist"', {cwd: 'aframe'});  // Commit.
    execSync(`git push https://${TOKEN}@github.com/${REPO}.git master`,
             {cwd: 'aframe'});  // Push.
  }
});
