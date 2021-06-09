'use strict';

const http = require('http');
const express = require('express');

const http_port = process.env['PORT'] || 8080;

console.log('HTTP server starting ...');
var app = express();
var server = http.createServer(app);
server.listen(http_port, function () { console.log('HTTP server started on port: %s', http_port); });

app.use('/', express.static(__dirname));

// require('./misc/quiz/quiz-app.js').register(app);

