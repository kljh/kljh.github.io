const aws = require('aws-sdk');
const s3 = new aws.S3({apiVersion: '2006-03-01'});
const oauth = require('./oauth.min.js');

exports.handler = async (event) => {
    var qs = event.queryStringParameters || {};
    var prms = qs; // JSON.parse(event.body);

    if (event.httpMethod == "GET" && Object.keys(qs).length==0)
        return await get_lambda_static_file('index.html');

    var data, err, statusCode;
    try {
        var user_name = oauth.user_name(event.headers, prms);
        if (!user_name) { statusCode = 400; throw new Error("unregistered user or expired authentication. " + JSON.stringify(prms)); }

        prms.httpMethod = event.httpMethod;
        data = await handle_request(prms, user_name, qs.delimiter);
    } catch (e) {
        err = { error: e.message || (""+e), stack: e.stack  } ;
    }

    return {
        statusCode: statusCode || ( data ? 200 : 207 ),
        headers: {
            "Access-Control-Allow-Headers" : "Content-Type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
        },
        body: data ? ( data.substr ? data : JSON.stringify(data) ) : err ,
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

async function handle_request(prms, user_name, delimiter) {
    var bucket = process.env["BUCKET"];
    var key = user_name + "/" + ( prms.path || "" );
    if (!key.endsWith("/")) key += "/";

    var data = await list_s3(bucket, key, delimiter);
    data.Home = user_name+"/";
    return data;
}

async function list_s3(bucket, key, delimiter, nextToken) {
    return new Promise((resolve, reject) => {
        var params = {
            Bucket: bucket,
            Prefix: key,
            Delimiter: delimiter,
            };

        if (nextToken)
            params.ContinuationToken = nextToken;

        s3.listObjectsV2(params, async function(err, data) {
            if (err) {
                reject(err);
            } else {
                if (data.IsTruncated ) {
                    console.log("list_s3 continues on " + data.NextContinuationToken);
                    var next = await list_s3(bucket, key, delimiter, data.NextContinuationToken);
                    data.Contents = data.Contents.concat(next.Contents);
                }
                resolve(data);
            }
        });
    });
}

async function copy_s3(bucket, key_src, key_dest) {
    var params = {
        Bucket: bucket,
        CopySource: bucket + "/" + key_src,
        Key: key_dest,
        ACL: 'public-read'
        };

    return s3.copyObject(params).promise();
}

async function delete_s3(bucket, key) {
    var params = {
        Bucket: bucket,
        Key: key,
        };

    return s3.deleteObject(params).promise();
}

async function move_s3(bucket, key_src, key_dest) {
    var res1 = await copy_s3(bucket, key_src, key_dest);
    var res2 = await delete_s3(bucket, key_src);
    return res1;
}

exports.list_s3 = list_s3;
exports.copy_s3 = copy_s3;
exports.delete_s3 = delete_s3;
exports.move_s3 = move_s3;
