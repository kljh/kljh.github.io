var http = require('http');
var url = require('url');

var peers = {};

http.createServer(function (req, res) {

    res.writeHead(200, { 'Content-Type': 'application/json' });
    var qs = req.headers["x-original-url"];
    var q = url.parse(qs, true).query;
    var id = q.id || q.name || "";
    var c = req.headers["x-forwarded-for"];
    var t = new Date().toISOString();

    peers[id] = { c, t };

    res.end(JSON.stringify(peers));

}).listen(process.env.PORT || 8080);