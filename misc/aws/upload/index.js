const aws = require('aws-sdk');
const s3 = new aws.S3({apiVersion: '2006-03-01'});
const oauth = require('./oauth.min.js');

// Support for binary files must be explicitly enabled in API Getway / API Settings / Binary Media Types
// or we can use binary string 

exports.handler = async (event) => {
    var qs = event.queryStringParameters || {};
    // console.log("qs = " + JSON.stringify(qs, null, 4));
    
    if (event.httpMethod == "GET" && Object.keys(qs).length==0) 
        return await get_lambda_static_file('index.html');
        
    var data, err, statusCode;
    try { 
        var user_name = oauth.user_name(event.headers, qs);
        if (!user_name) { statusCode = 400; throw new Error("unregistered user or expired authentication"); }
        
        var path = qs.name;
        if (!path) { statusCode = 500; throw new Error("file name is required in the query string. upload?name=img.jpg"); }
        
        var bucket = process.env["BUCKET"];
        var key = user_name + "/" + path;
        
        var body_length = event.body.length;
        var body_type = typeof event.body;
        var multipart = (event.headers.multipart || "i/n").split("/");
        
        if (!multipart || multipart.length != 2 || multipart[0] != multipart[1]) {
            console.log("write_to_s3... ");
            var put_response = await write_to_s3(bucket, key, event.body);
        } else {
            console.log("concatenate_parts...");
            var concat_response = await concatenate_parts(bucket, key, multipart[1]);
        }
        
        // console.log("make_public...");
        // var acl_response = await make_public(bucket, key);
        
        var url = `https://${bucket}.s3.eu-west-3.amazonaws.com/${key}`;
        data = { url, bucket, key, body_type, body_length, put_response, /* acl_response, */ concat_response };
    } catch (e) {
        err = "" + e + "\n" + ( e.stack || "" );
    }
    
    return {
        statusCode: statusCode || ( data ? 200 : 207 ),
        headers: { 
            "Access-Control-Allow-Headers" : "Content-Type,Multipart",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
        },
        body: data ? JSON.stringify(data) : err,
    };

};

async function get_lambda_static_file(filename) {
    return new Promise((resolve, reject) => {
        var fs = require('fs');
        fs.readFile(filename, 'utf8' , (err, data) => {
            if (err) 
                reject(err);
            else 
                resolve({
                    statusCode: 200,
                    headers: { "Content-Type": "text/html" },
                    body: data });
        });
    });
}

async function read_from_s3(bucket, key) {
    return new Promise((resolve, reject) => {
        var params = {
            Bucket: bucket, 
            Key: key,
            };
        
        s3.getObject(params, function(err, data) {
            if (err) reject(err);
            else resolve(data.Body); 
        });
    });
}

async function write_to_s3(bucket, key, body) {
    return new Promise((resolve, reject) => {
        var buf = new Buffer.from(body, 'binary'); // from binary string
        
        console.log("write_to_s3 #bytes " + buf.length);
        
        var params = {
            Body: buf,
            Bucket: bucket, 
            Key: key,
            ACL: 'public-read'
            };
        
        s3.putObject(params, function(err, data) {
            if (err) reject(err);
            else     resolve(data);
        });
    });
}

/*
async function make_public(bucket, key) {
    return new Promise((resolve, reject) => {
        var params = {
            Bucket: bucket, 
            Key: key,
            ACL: "public-read",
            };
        
        s3.putObjectAcl(params, function(err, data) {
            if (err) reject(err);
            else     resolve(data);
        });
    });
}
*/

async function delete_from_s3(bucket, key) {
    return new Promise((resolve, reject) => {
        var params = {
            Bucket: bucket, 
            Key: key,
            };
        
        s3.deleteObject(params, function(err, data) {
            if (err) reject(err);
            else resolve(data.Body); 
        });
    });
}

async function concatenate_parts(bucket, key, n) {
    // read parts 
    var parts_promises = [];	
	for (var i=0; i<n; i++) 
		parts_promises.push(read_from_s3(bucket, key+"."+i));
    var parts = await Promise.all(parts_promises);
	
	// concatenate and write
	var buf = Buffer.concat(parts);
	var res = await write_to_s3(bucket, key, buf);
	
	// delete parts
	parts_promises = [];	
	for (var i=0; i<n; i++) 
		parts_promises.push(delete_from_s3(bucket, key+"."+i));
    await Promise.all(parts_promises);
	
	return res;
}
