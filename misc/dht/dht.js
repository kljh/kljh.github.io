/*

  DHT - Distributed sloppy Hash Table

*/

const dgram = require('dgram');

var magnet_url = "magnet:?xt=urn:btih:9819bef5f82b55a526c659eeaebdff41dcc0557a&dn=Sherlock Gnomes (2018) [BluRay] [720p] [YTS.AM]&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Feddie4.nl%3A6969&tr=udp%3A%2F%2Ftracker.pirateparty.gr%3A6969&tr=udp%3A%2F%2Fopentrackr.org%3A1337&tr=udp%3A%2F%2Ftracker.zer0day.to%3A1337";

function magnet_info(magnet_url) {
	var magnet_kv = magnet_url.substr("magnet:?".length).split("&").map(x => x.split("=")).map(x => [ x[0], decodeURIComponent(x[1]) ]);
	console.log(magnet_kv);

	var magnet_info = {};
	for (var kv of magnet_kv) {
		var k = kv[0];
		var v = kv[1];
		if (!magnet_info[k]) {
			magnet_info[k] = v;
		} else if (!Array.isArray(magnet_info[k])) {
			magnet_info[k] = [ magnet_info[k], v ];
		} else {
			magnet_info[k].push(v);
		}
	}
	console.log(magnet_info);

	magnet_info.trackers = [];
	for (var tracker of magnet_info.tr) {
		var protocol = tracker.split("://").shift();
		var srv = tracker.split("://").pop();
		var host = srv.split(":").shift();
		var port = srv.split(":").pop();
		magnet_info.trackers.push({ protocol, host, port });
	}
	return magnet_info;
}

function bencode(val) {
	function str_bencode(str) {
		// assuming ASCII only
		return str.length+":"+str;
	}
	function num_bencode(num) {
		return "i"+num+"e";
	}
	function dict_bencode(d) {
		var txt = "";
		//for (var k in d)
		var ok = Object.keys(d).sort();
		for (var k of ok)
			txt += bencode(k)+bencode(d[k]);
		return "d"+txt+"e";
	}
	function list_bencode(list) {
		var txt = "";
		for (var x of list)
			txt += bencode(x);
		return "l"+txt+"e";
	}

	var t = typeof val;
	switch (t) {
		case "string": return str_bencode(val);
		case "number": return num_bencode(val);
		case "boolean": return num_bencode(val?1:0);
		case "object":
			if (Array.isArray(val))
				return list_bencode(val);
			else
				return dict_bencode(val);
		default:
			throw new Error("unsupported type "+t);
	}
}

function bdecode(txt) {
	function str_bdecode(txt, pos) {
		var p = txt[pos];
		if ("0123456789".indexOf(p)==-1) throw new Error("string expected to start with number prefix (got "+p+"). "+txt.substr(pos, 15)+"..");
		var e = txt.indexOf(':', pos+1);
		console.log(":", e);
		var n = 1*txt.substring(pos, e);
		console.log("len", n);
		return {
			val: txt.substr(e+1, n),
			end: e+1+n };
	}
	function num_bdecode(txt, pos) {
		if (txt[pos]!='i') throw new Error("number expected to start with 'i' prefix. "+txt.substr(pos, 15)+"..");
		var e = txt.indexOf('e', pos+1);
		return {
			val: 1*txt.substring(pos+1, e),
			end: e+1 };
	}
	function dict_bdecode(txt, pos) {
		if (txt[pos]!='d') throw new Error("dict expected to start with 'd' prefix. "+txt.substr(pos, 15)+"..");
		pos++;
		var d = {};
		while (txt[pos]!='e') {
			// read key and value
			var k = val_bdecode(txt, pos);
			var v = val_bdecode(txt, k.end);
			d[k.val] = v.val;
			pos = v.end;
		}
		return { val: d, end: pos+1 };
	}
	function list_bdecode(txt, pos) {
		if (txt[pos]!='l') throw new Error("list expected to start with 'l' prefix. "+txt.substr(pos, 15)+"..");
		pos++;
		var lst = [];
		while (txt[pos]!='e') {
			var v = val_bdecode(txt, pos);
			lst.push(v.val);
			pos = v.end;
		}
		return { val: lst, end: pos+1 };
	}
	function val_bdecode(txt, pos) {
		console.log("bdecode: "+txt.substr(pos, 15))
		var p = txt[pos];
		switch (p) {
			case "i" : return num_bdecode(txt, pos);
			case "d" : return dict_bdecode(txt, pos);
			case "l" : return list_bdecode(txt, pos);
			default :
				if ("0123456789".indexOf(p)!=-1)
					return str_bdecode(txt, pos);
				else
					throw new Error("unsupported '"+p+"' prefix. "+txt.substr(pos, 15)+"..");
		}
	}
	console.log(txt)
	var tmp = val_bdecode(txt, 0);
	if (tmp.end != txt.length) throw new Error("encoded text only partially consuned (used "+tmp.end+" < len "+txt.length+")");
	return tmp.val;
}

// console.log(bdecode(bencode({t: "abc", i: 123, n: 4.56, ll: ["x", 4], o: { a: 7 }})))

var querying_node_ids = "abcdefghij0123456789";
//querying_node_ids = "mnopqrstuvwxyz123456";

var transaction_count = 0;

function send_ping(node) {
	var client = dgram.createSocket('udp4');

	transaction_count++;

	var t = transaction_count.toString(32); // a transaction id to correlate requests and replies. two chars should be enough.
	var y = "q"; // "q"  for query, "r" for response, or "e" for error
	var v = "cc00"; // optional client version string

	var q = "ping"; // "ping" or "find_node" or "get_peers" e.g. get_value, "announce_peer" e.g. set_value
	var a = { "id" : querying_node_ids };

	var msg = { t, y, q, a };
	var benc = bencode(msg);
	var buff = new Buffer(benc);
	client.send(buff, 0, buff.length, node.port, node.host, function(err, bytes) {
		if (err) throw err;
		console.log('client sent UDP message to ' + node.host +':'+ node.port, bytes, buff.length, msg, benc, buff);
		client.close();
	});
}

const dht_udp_port = 6969;
const dht_udp_server = dgram.createSocket('udp4');

dht_udp_server.on('error', (err) => {
  console.log(`server error UDP:\n${err.stack}`);
  server.close();
});

dht_udp_server.on('message', (msg, rinfo) => {
  console.log(`server received UDP msg: ${msg} from ${rinfo.address}:${rinfo.port}`);
});

dht_udp_server.on('listening', () => {
  const address = dht_udp_server.address();
  console.log(`server listening UDP ${address.address}:${address.port}`);
});

dht_udp_server.bind(dht_udp_port);

send_ping({ host: "localhost", port: dht_udp_port});