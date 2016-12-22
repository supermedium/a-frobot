var bodyParser = require('body-parser');
var express = require('express');

var app = express();

app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.send('AFRO');
})

app.post('/postreceive', function (req, res) {
  res.send(req.body);
})

app.listen(app.get('port'), function () {
  console.log('Node app is running on port', app.get('port'));
})

function bumpAframeDist (data) { }
