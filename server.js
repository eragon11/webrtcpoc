'use strict';

var express = require('express');

var app = express();
var port = 3000;

// Set public folder as root
app.use(express.static('public'));

// Provide access to node_modules folder
app.use('/scripts', express.static(__dirname + '/node_modules/'));

// Redirect all traffic to index.html
app.use(function (req, res) {
  return res.sendFile(__dirname + '/public/index.html');
});

app.listen(port, function () {
  // eslint-disable-next-line no-console
  console.info('listening on %d', port);
});