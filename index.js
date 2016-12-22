var bodyParser = require('body-parser');
var execSync = require('child_process').execSync;
var fs = require('fs');
var express = require('express');

var app = express();

// Clone repository.
if (!fs.existsSync('aframe')) {
  console.log('Cloning A-Frame repository...');
  execSync('git clone git@github.com:ngokevin/aframe');
}

// Git config.
execSync('git config user.email aframebot@gmail.com');

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
  execSync('git push origin master', {cwd: 'aframe'});  // Commit.
}
