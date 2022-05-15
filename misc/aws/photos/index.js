'use strict';

const aws = require('aws-sdk');
// const s3 = new aws.S3({apiVersion: '2006-03-01'});
const s3 = new aws.S3({ signatureVersion: 'v4', });
const sharp = require('sharp');

const image_extensions = new Set([ "jpeg", "jpg", "png" ]);

async function handler(event) {

	const prms = event.queryStringParameters || {};

	if (event.httpMethod == "GET" && !prms.no_html_get)
        return await get_lambda_static_file('index.html');

	const bucket = prms.bucket || process.env.BUCKET;
	const keyIn = prms.key;
	const keyOut = prms.out || make_output_path(keyIn, prms.subfolder);

	var action = prms.action || "photoscan";
	switch (action) {
		case "photoscan":
			action = photoscan; break;
		case "photomin":
			// either apply metadata rotation with .rotate() or keep metadata with .withMetadata()
			action = img => img.rotate().resize({ width: 300 }); break;
		case "photosize":
			var p = {} ;
			if (!prms.width && !prms.height) p.width= 800;
			if (prms.width) p.width= prms.width*1;
			if (prms.height) p.height= prms.height*1;
			if (prms.fit) p.fit= prms.fit; // outside
			action = img => img.resize(p).withMetadata(); break;
		default:
			action = null;
	}

	var data, err, statusCode;
    try {
		data = await read_and_write_to_s3(bucket, keyIn, keyOut, action);
	} catch (e) {
		err = "Query: " + JSON.stringify(prms, null, 4) + "\n\n" + e + "\n" + ( e.stack || "" );
	}

	// should handle case where data is a Promise
    var body = data ? ( data.substr ? data : JSON.stringify(data, null, 4)) : err;

    return {
        statusCode: statusCode || ( data ? 200 : 207 ),
        headers: {
            "Access-Control-Allow-Headers" : "Content-Type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
        },
        body
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

function make_output_path(input_path, subfolder) {
	if (subfolder) {
		var tmp = input_path.split("/");
		tmp.splice(tmp.length-1, 0, subfolder);
		return tmp.join("/");
	} else {
		var tmp = input_path.split(".");
		tmp.push("alt." + tmp.pop());
		return tmp.join(".");
	}
}

function read_and_write_to_s3(bucket, keyIn, keyOut, action)  {
	const ext      = keyIn.split(".").pop().toLowerCase();
	const format   = ext === "png" ? "png" : "jpeg";

	if (!image_extensions.has(ext))
		return { msg: keyIn + " is not an image" };

	return read_from_s3(bucket, keyIn)
		.then(data => sharp(data))
		.then(action)
		.then(img => img.toBuffer())
		.then(buffer => write_to_s3(bucket, keyOut, buffer, 'image/'+format));
}

async function read_and_write_to_disk(pathIn, pathOut, action) {
	var img = sharp(pathIn);
	img = await action(img);
	img.toFile(pathOut).catch(console.error);
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

async function write_to_s3(bucket, key, buf, content_type) {
    return new Promise((resolve, reject) => {
        var params = {
            Body: buf,
            Bucket: bucket,
            Key: key,
            ContentType: content_type,
            ACL: 'public-read'
            };

        s3.putObject(params, function(err, data) {
            if (err) reject(err);
            else     resolve(data);
        });
    });
}

async function photoscan(img) {
	var info = await img.metadata();
	var { width, height } = info;
	var size = width * height;
	console.log("input image", info);

	var avg = img.clone().blur(50);

	const img_grey = await getGreyscale(img);
	const avg_grey = await getGreyscale(avg);
	console.log("begin loop");
	for (var k=0; k<size; k++)
		img_grey[k] = Math.min(Math.max(128+(img_grey[k]-avg_grey[k])*5, 0), 255)
	console.log("end loop");
	var new_img = await sharp(Uint8Array.from(img_grey), { raw: { width, height, channels: 1 } });

	// var new_img = await img //.composite([{ input: avg, blend: 'difference' }]);
	console.log("new image gemeration");

	var jpg = await new_img
		 .threshold(60)    // keep only dark text
		// .threshold(128)    keep also very light text (see through  paper)
		// .resize(200, 300)
		// .toColourspace('b-w')
		.jpeg();

	return jpg;

}

async function getGreyscale(img) {
	var res = await img
		.raw()
		.toColourspace('b-w')
		.extractChannel(0)
		.toBuffer({ resolveWithObject: true });
	console.log("grey image", res.info);
	return res.data;
}

if (require.main === module) {
	console.log("test");

	var  test = {
		queryStringParameters: {
				"action": "photomin",
				"key": "kljh/photos/misc/AB9AC440-8CA0-411A-B0B5-56A21642097C.jpeg",
				"out": "kljh/photos/misc/.thumbs/AB9AC440-8CA0-411A-B0B5-56A21642097C.jpeg"
			}
		};

	process.env.BUCKET = "kusers";

	handler(test)
	.then(console.log)
	.catch(console.error);


} else {
	exports.handler = handler;
}
