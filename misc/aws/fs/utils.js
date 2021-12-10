'use strict';

const s3 = require('./index.js');
const AWS = require('aws-sdk');
const S3 = new AWS.S3({
	signatureVersion: 'v4',
});


const bucket = "kusers";
for (var user of [ "kljh", "motia", "patou", "narinder", "takako", ]) {
	var root_key = user + "/photos/";
	(user => s3.list_s3(bucket, root_key)
		.then(data => data.Contents.length)
		.then(n => console.log(user, n)))(user);
		
	//iso_rename(bucket, root_key);
	// duplicate_delete(bucket, root_key);
	//create_thumbnails(bucket, root_key);
	//image_compress("C:\\Users\\kljh\\Documents\\Admin\\Passport Claude 14FV06317.png")
}

function iso_rename(bucket, root_key) {
	s3.list_s3(bucket, root_key)
		.then(photos_name_with_iso_date)
		.then(rename_all)
		.then(console.log)
		.catch(console.error);
}

function duplicate_delete(bucket, root_key) {
	s3.list_s3(bucket, root_key)
		.then(duplicate_etags)
		//.then(delete_all)
		.then(console.log)
		.catch(console.error);
	
	delete_all([])
		.then(console.log)
		.catch(console.error);
}

function create_thumbnails(bucket, root_key) {
	var keys = s3.list_s3(bucket, root_key)
		.then(data => data.Contents.map(x => x.Key))
		.then(keys => {
			var photos = keys.filter(key => key.indexOf("/.thumbs/")==-1 && ( key.endsWith(".jpeg") || key.endsWith(".jpg") ));
			var thumbs = keys.filter(key => key.indexOf("/.thumbs/")!=-1);
			console.log("#photos", photos.length);
			console.log("#thumbs", thumbs.length);
			// console.log("photos", photos);
			// console.log("thumbs", thumbs);
	
			return Promise.all(photos.map(key => create_thumbnail(bucket, key, new Set(thumbs))));
		})
		.catch(console.error);
}

function image_compress(path) {
	var tmp = path.split(".");
	tmp[tmp.length-2] += "-min";
	var pathOut = tmp.join(".");
	
	return read_and_write_to_disk(path, pathOut, img =>
		img
			.png({ progressive: true, quality: 80, compressionLevel: 9 }) //, force: false })
			//.jpeg({ progressive: true, quality: 60, force: false })
			.withMetadata()
		)
		.then(console.log)
		.catch(console.error);
}
		
function create_thumbnail(bucket, key, thumbs) {
	const sharp = require('sharp');

	var tmp = key.split('/');
	var file = tmp.pop();
	var keyOut = tmp.join("/") + "/.thumbs/" + file;
	if (thumbs.has(keyOut))
		return;
	
	console.log("create_thumbnail", key);
	return read_and_write_to_s3(bucket, key, keyOut, img =>
		img.resize({ width: 160 }) 
			.withMetadata()
			// .sharpen()
	);
}

function duplicate_etags(data) {
	var keys_per_tag = {};
	for (var x of data.Contents) {
		if (!keys_per_tag[x.ETag])
			keys_per_tag[x.ETag] = [];
		keys_per_tag[x.ETag].push(x.Key);
	}
	keys_per_tag = Object.values(keys_per_tag).filter(keys => keys.length>1);
	
	// sort keys per size 
	keys_per_tag.forEach(keys => keys.sort((a,b) => a.length - b.length));
	// delete all ... 
	// keys_per_tag.forEach(keys => keys.pop())  // but longest key
	keys_per_tag.forEach(keys => keys.shift())  // but shortest key
	
	// return keys_per_tag;
	
	// return list of keys to delete
	return [].concat(...keys_per_tag);
} 

async function photos_name_with_iso_date(data) {
	var existing_files = data.Contents.map(x => x.Key);
	var existing_files_set = new Set(existing_files);
	
	var files_to_rename = existing_files.map(photo_rename_auto).filter(x => x);
	function photo_rename_auto(old_path) {
		var path_split = old_path.split("/");
		
		// properly formatted ISO date
		var old_file = path_split.pop();
		var new_file = old_file.substr(0, 10).replace(/[:.-]/g, "-") + " " + old_file.substr(11, 8).replace(/[:.-]/g, ".") + "." + old_file.split(".").pop();
		
		// check there is a month subfolder
		if (path_split[path_split.length-1]==new_file.substr(0, 4))
			path_split.push(new_file.substr(0, 7));
		
		// attempt to solve collisions
		var new_path = path_split.join("/") + "/" + new_file;
		if (new_path!=old_path) {
			if (existing_files_set.has(new_path)) {
				new_file = old_file.substr(0, 10).replace(/[:.-]/g, "-") + " " + old_file.substr(11, 8).replace(/[:.-]/g, ".") + old_file.substr(19);
				new_path = path_split.join("/") + "/" + new_file;
			}
		}
		
		if (new_path!=old_path) {
			if (existing_files_set.has(new_path)) {
				console.log(`Collision ${old_path} -> ${new_path}`);
			} else {
				existing_files_set.add(new_path);
				return { old_path, new_path};
			}
		}
	}
	return files_to_rename;
}

async function delete_all(files_to_delete) {
	await Promise.all(files_to_delete.map(x => s3.delete_s3(bucket, x)));
	return files_to_delete;
}

async function rename_all(files_to_rename) {
	await Promise.all(files_to_rename.map(rename => s3.move_s3(bucket, rename.old_path, rename.new_path)));
	return files_to_rename;
}


function read_and_write_to_s3(bucket, keyIn, keyOut, fct)  {
	const sharp = require('sharp');
	const ext      = keyIn.split(".").pop().toLowerCase();
	const format   = ext === "png" ? "png" : "jpeg";

	return  S3.getObject({Bucket: bucket, Key: keyIn}).promise()
		.then(data => sharp(data.Body))
		.then(fct)
		.then(img => img.toBuffer())
		.then(buffer => S3.putObject({
			Body: buffer,
			Bucket: bucket,
			Key: keyOut,
			ContentType: 'image/' + format,
			ACL: 'public-read'
		  }).promise());
}

async function read_and_write_to_disk(pathIn, pathOut, fct) {
	const sharp = require('sharp');
	var img = sharp(pathIn);
	img = await fct(img);
	img.toFile(pathOut).catch(console.error);
}
