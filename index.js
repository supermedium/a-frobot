var bodyParser = require('body-parser');
var express = require('express');

var app = express();

app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.send('AFRO');
})

app.post('/postreceive', function (req, res) {
  var data = req.body;

  if (data.repository.full_name === 'aframevr/aframe') {
    bumpDist(data);
  }

  res.send(data);
})

app.listen(app.get('port'), function () {
  console.log('Node app is running on port', app.get('port'));
})

function bumpDist (data) {
  var hasCodeChanges = data.repository.head_commit.modified.filter(function (file) {
    return file.indexOf('src/' === 0) || file.indexOf('vendor/') === 0 ||
           file === 'package.json';
  }).length;

  if (!hasCodeChanges) { return; }
}
