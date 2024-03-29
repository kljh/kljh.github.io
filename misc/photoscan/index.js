'use strict';

const AWS = require('aws-sdk');
const sharp = require('sharp');

const S3 = new AWS.S3({
	signatureVersion: 'v4',
});

exports.handler = function(event, context, callback){

	const bucket = event.queryStringParameters.bucket || process.env.BUCKET;
	const keyIn = event.queryStringParameters.key;
	const keyOut = make_output_path(keyIn);

	read_and_write_to_s3(bucket, keyIn, keyOut)
		.then(() => callback(null, {
				statusCode: 200,
				body: 'Done '+keyOut
			}))
		.catch(err => callback(null, {
				statusCode: err.statusCode || 500,
				body: err.message
			}));				
}

function make_output_path(input_path) {
	var tmp = input_path.split("."); 
	tmp.push("alt." + tmp.pop());
	return tmp.join(".");
}

function read_and_write_to_s3(bucket, keyIn, keyOut)  {
	const ext      = keyIn.split(".").pop().toLowerCase();
	const format   = ext === "png" ? "png" : "jpeg";

	return  S3.getObject({Bucket: bucket, Key: keyIn}).promise()
		.then(data => sharp(data.Body))
		.then(photoscan)
		.then(img => img.toBuffer())
		.then(buffer => S3.putObject({
			Body: buffer,
			Bucket: bucket,
			Key: keyOut,
			ContentType: 'image/' + format,
			ACL: 'public-read'
		  }).promise());
}

async function read_and_write_to_disk(pathIn, pathOut) {
	var img = sharp(pathIn);
	img = await photoscan(img);
	img.toFile(pathOut).catch(console.error);
}


async function photoscan(img) {
	var info = await img.metadata();
	var { width, height } = info;
	var size = width * height;
	console.log(info);
  
	var avg = img.clone().blur(50);	
	
	/*
	const img_grey = await getGreyscale(img);
	const avg_grey = await getGreyscale(avg);
	for (var k=0; k<size; k++)
		img_grey[k] = Math.min(Math.max(128+(img_grey[k]-avg_grey[k])*5, 0), 255)
	var new_img = await sharp(Uint8Array.from(img_grey), { raw: { width, height, channels: 1 } });
	*/
	
	var new_img = await img //.composite([{ input: avg, blend: 'difference' }]);
	
	var jpg = await new_img
		// .threshold(60)    keep only dark text 
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
	console.log(res.info);
	return res.data;
}

if (true) {
	//var img_path = "img.jpg";
	//read_and_write_to_disk(img_path, make_output_path(img_path)).catch(console.error);
	
	var bucket = "kusers";
	var keys = ["motia/photos/2021/2021-11-19 17-35-48 IMG-8648.jpg","motia/photos/2021/2021-11-19 17-35-56 IMG-8649.jpg","motia/photos/2021/2021-11-19 17-36-05 IMG-8651.jpg","motia/photos/2021/2021-11-19 17-36-24 IMG-8652.jpg","motia/photos/2021/2021-11-19 17-36-36 IMG-8654.jpg","motia/photos/2021/2021-11-19 17-36-56 IMG-8655.jpg","motia/photos/2021/2021-11-19 17-37-03 IMG-8656.jpg","motia/photos/2021/2021-11-19 17-37-12 IMG-8657.jpg","motia/photos/2021/2021-11-19 17-37-19 IMG-8658.jpg","motia/photos/2021/2021-11-19 17-37-41 IMG-8659.jpg","motia/photos/2021/2021-11-19 17-37-49 IMG-8660.jpg","motia/photos/2021/2021-11-19 17-37-55 IMG-8661.jpg","motia/photos/2021/2021-11-19 17-38-03 IMG-8662.jpg"];
	for (var key of keys)
		read_and_write_to_s3(bucket, key, make_output_path(key)).catch(console.error);
}