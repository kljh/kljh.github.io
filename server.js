'use strict';

const http = require('http');
const express = require('express');

const http_port = process.env['PORT'] || 8080;

console.log('HTTP server starting ...');
var app = express();
var server = http.createServer(app);
server.listen(http_port, function () { console.log('HTTP server started on port: %s', http_port); });

app.use('/', express.static(__dirname));

app.get('/fs', foward_to_aws);
app.post('/fs', foward_to_aws);

app.get('/id', foward_to_aws);
app.post('/id', foward_to_aws);

app.get('/upload', foward_to_aws);
app.post('/upload', foward_to_aws);

app.get('/photos', foward_to_aws);
app.post('/photos', foward_to_aws);

app.get('/delta', foward_to_aws);
app.post('/delta', foward_to_aws);

function foward_to_aws(req, res) {
	console.log("\n\n-----\n\n");

	console.log("Request:");
	console.log("req.url", req.url);
	console.log("req.query", req.query);
	delete req.headers.host;
	// console.log("req.headers", req.headers);
	// console.log("req.body", req.body);
	// console.log("\n\n");

	// console.log("Forward:");
	var url = "https://aws.kljh.org"+req.url+"&uid=claude.cochet%40gmail.com&hash=4Gz0JSA0eWi5pSXsE2%2F0eQ";
	// console.log("url", url);
	// console.log("\n\n");

	const got = require('got');
	got(url) //, {}
	.then(response => {
		// console.log("res.headers: \n", response.headers);
		// console.log("res.body: \n", ("" + response.body).substr(0,80)+"...");
		res.set('Content-Type', response.headers['content-type']);
		res.send(response.body);
	})
	.catch(error => {
		console.log(error.response.body);
		res.send('ERROR' + error.response.body);
	});
}

app.get('/upload', function (req, res) { res.sendFile('./misc/aws/upload/index.html', { root: __dirname, }); });
app.get('/photos', function (req, res) { res.sendFile('./misc/aws/photos/index.html', { root: __dirname, }); });
app.get('/photoscan', function (req, res) { res.sendFile('./misc/photoscan/index.html', { root: __dirname, }); });

// require('./misc/quiz/quiz-app.js').register(app);

