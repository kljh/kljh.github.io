const aws = require('aws-sdk');
const s3 = new aws.S3({apiVersion: '2006-03-01'});

// Support for binary files must be explicitly enabled in API Getway / API Settings / Binary Media Types
// or we can use binary string

exports.handler = async (event) => {
    const oauth = require('./oauth.min.js');

    var qs = event.queryStringParameters || {};
    // console.log("qs = " + JSON.stringify(qs, null, 4));

    if (event.httpMethod == "GET" && Object.keys(qs).length==0)
        return await get_lambda_static_file('index.html');

    var data, err, statusCode;
    try {
        var user_name = oauth.user_name(event.headers, qs);
        if (!user_name) { statusCode = 400; throw new Error("unregistered user or expired authentication"); }

        var bucket = process.env["BUCKET"];

        var key = qs.key;
        if (qs.name || qs.path)
            key = user_name + "/" + ( qs.name || qs.path );
        if (!key) { statusCode = 500; throw new Error("file path/name is required in the query string."); }

        if (qs.multipart) {
            switch (qs.multipart) {
                case "presign_post":
                    data = await aws_presigned_post_url(bucket, key);
                    break;
                case "concatenate_parts":
                    data = await concatenate_multiparts(qs.bucket, qs.key, qs.nb_parts*1);
                    break;
                default:
                    err = `Multipart upload action unknown ${qs.multipart}`;
            }
        } else {
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
        }
    } catch (e) {
        err = "" + e + "\n" + ( e.stack || "" );
    }

    return {
        statusCode: statusCode || ( data ? 200 : 207 ),
        headers: {
            "Access-Control-Allow-Headers" : "Content-Type,Multipart",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
            "Content-Type": data ? "application/json" : "text/plain",
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
                    statusCode: 207,
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


async function aws_presigned_post_url(bucket, key) {
    var pre = new Promise((resolve, reject) => {
        s3.createPresignedPost({
            Bucket: bucket,
            Conditions: [
                [ 'starts-with', '$key', key ]
            ]
        }, function(err, data) {
            if (err) {
                reject(err);
            } else {
                // data.fields.bucket = bucket;
                data.fields.key = key;
                resolve(data);
            }
        });
    });

    return pre;
}

async function concatenate_multiparts(bucket, key, nb_parts) {
    if (nb_parts==1)
        return make_public(bucket, key);

    var mp =  await create_aws_multipart(bucket, key);

    var parts = new Array(nb_parts);
    for (var i=0; i<nb_parts; i++)
        parts[i] = await part_copy_aws_multipart(bucket, key, mp.UploadId, i);

    var res = await complete_aws_multipart(bucket, key, mp.UploadId, parts);

    var cleanup = new Array(nb_parts);
    for (var i=0; i<nb_parts; i++)
        cleanup[i] = delete_from_s3(bucket, `${key}.${i}`);
    await Promise.all(cleanup);

    return { bucket, key, nb_parts, mp, parts, res };
}

async function create_aws_multipart(bucket, key) {
    var mp = await s3.createMultipartUpload({
        Bucket: bucket,
        Key: key,
        ACL: "public-read"
    }).promise();
    return mp;
}

async function part_copy_aws_multipart(bucket, key, uploadId, i) {
    return new Promise((resolve, reject) => {
        s3.uploadPartCopy({
            Bucket: bucket,
            Key: key,
            PartNumber: i+1,  // one based
            CopySource: `/${bucket}/${key}.${i}`,
            UploadId: uploadId
        }, function(err, data) {
            if (err) {
                reject(err, err.stack);
            } else {
                var { ETag, LastModified } = data.CopyPartResult;
                var part = { ETag, PartNumber: i+1 };
                resolve(part);
            }
        });
    });
}

async function complete_aws_multipart(bucket, key, uploadId, parts) {
    var mp = await s3.completeMultipartUpload({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
            Parts: parts
        },
    }).promise();
    return mp;
}

async function abort_aws_multipart(bucket, key, uploadId) {
    var mp = await s3.abortMultipartUpload({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId
    }).promise();

    //await delete_from_s3(bucket, key+".multipart");
    return mp;
}

async function list_aws_multiparts(bucket) {
    var mp = await s3.listMultipartUploads({
        Bucket: bucket,
    }).promise();
    return mp;
}

function cleanup_aws_multiparts(bucket) {
    list_aws_multiparts(bucket)
        .then(x => Promise.all(x.Uploads.map(up => abort_aws_multipart(bucket, up.Key, up.UploadId))))
        .then(console.log)
        .catch(console.error);
}
// cleanup_aws_multiparts("kusers");
