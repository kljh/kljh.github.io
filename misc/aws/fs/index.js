const aws = require('aws-sdk');
const s3 = new aws.S3({apiVersion: '2006-03-01'});
const oauth = require('./oauth.min.js');

exports.handler = async (event) => {
    var qs = event.queryStringParameters || {};
    var prms = qs; // JSON.parse(event.body);
    
    if (event.httpMethod == "GET") 
        return await get_lambda_static_file('index.html');

    var data, err, statusCode;
    try {
        var user_name = oauth.user_name(event.headers);
        if (!user_name) { statusCode = 400; throw new Error("unregistered user or expired authentication"); }
        
        prms.httpMethod = event.httpMethod;
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
    var bucket = process.env["BUCKET"];
    var key = user_name + "/" + ( prms.path || "" );

    return await list_s3(bucket, key, user_name);
}

async function list_s3(bucket, key, user_name) {
    return new Promise((resolve, reject) => {
        var params = {
            Bucket: bucket, 
            Prefix: key,
            };
        
        s3.listObjects(params, function(err, data) {
            if (err) reject(err);
            else {
                data.Home = user_name+"/";
                resolve(data); 
            }
        });
    });
}
