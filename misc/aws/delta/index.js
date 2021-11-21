// apply diff to text files on s3

const aws = require('aws-sdk');
const s3 = new aws.S3({apiVersion: '2006-03-01'});
const oauth = require('./oauth.min.js');
const diff = require('diff');

exports.handler = async (event) => {
    var qs = event.queryStringParameters || {};
    var prms = JSON.parse(event.body);
    
    if (event.httpMethod == "GET" && Object.keys(qs).length==0) 
        return await get_lambda_static_file('index.html');

    var data, err, statusCode;
    try {
        var user_name = oauth.user_name(event.headers, prms);
        if (!user_name) { statusCode = 400; throw new Error("unregistered user or expired authentication"); }
        
        data = await handle_request(prms, user_name);
    } catch (e) {
        err = "" + ( e.stack || e );
    }
    
    return {
        statusCode: statusCode || ( data ? 200 : 500 ),
        headers: { 
            "Access-Control-Allow-Headers" : "Content-Type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
        },
        body: data ? ( data.substr ? data : JSON.stringify(data) ) : err,
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

async function handle_request(prms, user_name) {
    var bucket = /* prms.bucket || */ process.env["BUCKET"];
    var key = user_name + "/" + prms.path;

    if (prms.action == "new")
        return await write_text_to_s3(bucket, key, prms.text || "\n");
    else if (prms.action == "open")
        return (await read_text_from_s3(bucket, key)) || "\n";  // can't return empty strings ?
    else 
        return apply_delta(bucket, key, prms.patch);
}

async function apply_delta(bucket, key, patch) {

    var base_text = await read_text_from_s3(bucket, key);
    var new_text = await apply_patch(base_text, patch);
    if (typeof new_text != "string") throw new Error("apply_patch returned "+JSON.stringify(new_text));
    var put_response = await write_text_to_s3(bucket, key, new_text);
    var new_hash = "xxxx";
    
    return { bucket, key, base_text, new_text, new_hash, put_response };
}

async function apply_patch(base_text, patch) {
    return new Promise((resolve, reject) => {
        var mutable_text = base_text;
        
        var apply_options = {
        	loadFile: function(index, callback) { 
        		// load the text to transform (for each hunk )
        		// console.log("loadFile", index);
        		callback(null, mutable_text);
        	}, 
        	patched: function(index, content, callback) { 
        		// save the transformed text (for each hunk )
        		// console.log("patched");
        		if (content !== false)
        		    mutable_text = content;
        		callback(null);  
        	}, 
        	complete: function (err) {
        		// console.log("complete", err, mutable_text);
        		if (err)
        		    reject(err);
        		else
        		    resolve(mutable_text);
        	}
        };
        
        diff.applyPatches(patch, apply_options);
    });
}

async function read_text_from_s3(bucket, key) {
    return new Promise((resolve, reject) => {
        var params = {
            Bucket: bucket, 
            Key: key,
            };
        
        s3.getObject(params, function(err, data) {
            if (err) reject(err);
            else resolve(data.Body.toString()); 
        });
    });
}

async function write_text_to_s3(bucket, key, text) {
    return new Promise((resolve, reject) => {
        var ext = key.split(".").pop();
        if (ext=="js") ext = "javascript";
        
        var params = {
            Body: text,
            Bucket: bucket, 
            Key: key,
            ContentType: "text/"+ext, 
            ACL: 'public-read'
            };
        
        s3.putObject(params, function(err, data) {
            if (err) reject(err);
            else     resolve(data);
        });
    });
}
