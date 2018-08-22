/*
 	Author : Claude Cochet - Aug 2011
	Loads sphere data : scene location, photos, rotation matrices, matched points 
 */


var views = {
	'Yuki' : '../views/20110214%20Yuki/views.js',
	'Victoria' : '../views/20100718%20Kowloon%20Victoria%20harbour/views.js',
	'Mizonokuchi' : '../views/20110213%20Velos%20Mizonokuchi/views.js',
	'Sai Kung Country Park' : '../views/20101031%20Sai%20Kung%20Country%20Park%20-%20Wong%20Shek/views.js',
	'Sai Kung Harbor' : '../views/20101031%20Sai%20Kung%20Harbor%20Mkt/views.js',
	'Resto' : '../views/20101120%20Resto Japon avec Alexis et Takako/views.js',
	'Haneda' : '../views/20110215%20Haneda/views.js',
	'Calib' : '../views/20101102%20Calibration/views.js'
};
var view_name = 'Mizonokuchi';
var view_script_uri = views[view_name];

var fc = 50;
var WorldToDeviceRotMtx = [ [ 1, 0, 0 ], [ 0, 0, 1 ], [ 0, -1, 0 ] ];

// Scene elements 
var drawMesh = true;
var myMesh = [];		// polyedron surface
var myPictures = [];	// pictures
var matched_pts = [];	// matched points

// --------------------------------------------------------------------------------------------------------------------
// --- load / init data code  ---

// init function to be called with event onLoad
function initSphereData() {
	info_msg("loading script file of all views <a href=\"../views/views.js\">'../views/views.js'</a>."); 
	var view_script = document.createElement('script');
	view_script.src = "../views/views.js";
	document.body.appendChild(view_script); 
}
// callback of script above
function setViews(loaded_views) {
	info_msg("views loaded"); 
	views = loaded_views;
	initSphereData2();
}

// init function to be called with event onLoad
function initSphereData2() {
	clear_msg();
	info_msg("initSphereData begins"); 
	initViewSelection();
	
	info_msg("loading mesh"); 
	try {
		myMesh = mesh();
		info_msg("loaded mesh: " + myMesh.vertices.length + " vertices, " +  myMesh.faces.length + " faces"); 
	} catch(e) {
		warn_msg("load mesh error: "+e.message);
	}	
	
	// Mechanism described by http://www.codeproject.com/KB/aspnet/JSONToJSONP.aspx
	// Insert on-demand script (the callback function will be executed as soon as the script file is added)
	// info_msg("loading pictures is done by inserting a script file containing a callback (setViewData).");
	info_msg("loading script file <a href=\""+view_script_uri+"\"> '"+view_script_uri+"' </a>."); 
	// $("#menu").append('<a href="'+view_script_uri.replace(/\.js$/, ".json")+'">scene</a> ');
	var view_script = document.createElement('script');
	view_script.src = view_script_uri;
	document.body.appendChild(view_script); 
	
	// Alternative to: 
	// info_msg("http request to get data"); 	
	// httpRequest can only be done to the domain hosting the page (eg can't be done in a local page)
	//xmlhttp_manual();
	//xmlhttp_jsquery();
	
	var key = "matched_pts"
	/*localstorage
	info_msg("reading matched points from '"+key+"' cookie. "+$.cookie(key)); 
	eval("matched_pts = " +$.cookie(key));
	if (matched_pts!=null)
		info_msg("reading matched points #"+matched_pts.length); 
	else 
	*/	matched_pts = [];
	
	/*
	var matched_pts_uri="https://tky.kljh.org.s3.amazonaws.com/uploads/"+view_name+".js"
	info_msg("loading script file <a href=\""+matched_pts_uri+"\"> '"+matched_pts_uri+"' </a>."); 
 	$("#menu").append('<a href="'+matched_pts_uri+'">matched_pts</a> - ');
	var view_script = document.createElement('script');
	view_script.src = matched_pts_uri;
	document.body.appendChild(view_script); 
	*/
	
	info_msg("initSphereData complete<br/>"); 
}

// init function to be called by JSONP 
function setViewData(json_txt) { 
	//try {
		if (typeof json_txt == "string")
			eval("var view_data = "+json_txt);
		else 
			var view_data = json_txt
		
		var root = view_data.root;
		if (root=="") root = view_script_uri.replace("views.js", "");
		//root = root + "512/"
		
		info_msg("setViewData: loading "+view_data.views.length+" img from "+root); 
		loadPictures(view_data.views, root);
	//} catch(e) {
	//	alert("setViewData error: "+e.message);
	//}	
}

function loadPictures(view_array, img_root) {	
	var n = view_array.length;
	var nbLoaded = 0;
	
	info_msg("loadPictures: setting "+n+" onloaded callbacks. ");
	for (var i=0; i<n; i++) 
	{
		var img_path = img_root+view_array[i].file;
		//info_msg("pictures: "+img_path+" onloaded callback set. ");
		
		var img = new Image();  
		img.onload = (function() { var i2=i; var img_path2 = img_path; return function() {
			info_msg("picture "+i2+": <a href=\""+img_path2+"\">"+view_array[i2].file+"</a> loaded ("+nbLoaded+"/"+n+" complete).");
			//var w = myPictures[i2].width, h = myPictures[i2].height;
			//info_msg("w x h = "+w+" x "+h+" - .");
			
			$("#spinner_left_"+i2).attr("src", "photo.png");
			$("#spinner_right_"+i2).attr("src", "photo.png");
			$("#spinner_"+i2).attr("src", "photo.png");
			//$("#spinner_"+i2).hide("slow");
			
			nbLoaded = nbLoaded + 1;
			myPictures[i2].loaded = true;
			
			if (typeof panes != "undefined") {
				// matchmaker
				if (nbLoaded==1) setView(panes.left, i2);
				if (nbLoaded==2) setView(panes.right, i2);
			} else { 
				// viewer
				if (nbLoaded==1) setViewOnImg(i2);
			}
			if (nbLoaded==n) { 
				info_msg("screenshotPreview begin"); 
				screenshotPreview(); 
				info_msg("screenshotPreview done<br/>"); 
			}
		}})();
		
		$("#notifs_left").append('<a href="#" onclick="setView(panes.left, '+i+');"  class="screenshot" rel="'+img_path+'">'
			+ '<img src="/js/ajax-loader.gif" id="spinner_left_'+i+'" alt="'+img_path+'" /></a> ');
		$("#notifs_right").append('<a href="#" onclick="setView(panes.right, '+i+');"  class="screenshot" rel="'+img_path+'">'
			+ '<img src="/js/ajax-loader.gif" id="spinner_right_'+i+'" alt="'+img_path+'" /></a> ');
			
		//$("#notifs").append('<a href="'+img_path+'"><img src="/js/ajax-loader.gif" id="spinner_'+i+'" alt="'+img_path+'"/></a> ');
		$("#viewmenu").append('<a href="#" onclick="setViewOnImg('+i+');"  class="screenshot" rel="'+img_path+'" >'
			+ '<img src="/js/ajax-loader.gif" id="spinner_'+i+'" alt="'+img_path+'"/></a> &nbsp;');
		
		// extract rotation martix
		if (view_array[i].mtx) {
			var tmp44 = view_array[i].mtx;
			var tmp33 = [ tmp44[0].slice(0,3),  tmp44[1].slice(0,3), tmp44[2].slice(0,3) ]		
			img.mtx = trsp(tmp33);
		} else {
			var raw = view_array[i].orientation_info;
			if (!raw['alpha']) {
                alert('no orientation information (photo taken on a device with no compass or no accelerometer)')
                //throw new Error("no orientation information");
            }
            var alpha = ( raw['alpha'] ? raw['alpha'] : 0.0 ),	// [0, 360)
				beta = ( raw['beta'] ? raw['beta'] : 0.0 ), 	// [-180, 180)
				gamma = ( raw['gamma'] ? raw['gamma'] : 0.0 );	// [-90, 90)
			
            var PiOn180 = Math.PI/180.0;
			var ca = Math.cos(alpha * PiOn180),
				sa = Math.sin(alpha * PiOn180),
				cb = Math.cos(beta * PiOn180),
				sb = Math.sin(beta * PiOn180),
				cc = Math.cos(gamma * PiOn180),
                sc = Math.sin(gamma * PiOn180);
				
			var mtxa = [ [ ca, -sa, 0 ], [ sa, ca, 0 ], [ 0, 0, 1 ] ];
			var mtxb = [ [ 1, 0, 0 ], [ 0, cb, -sb ], [ 0, sb, cb ] ];
			var mtxc = [ [ cc, 0, sc ], [ 0, 1, 0 ], [ -sc, 0, cc ] ];
			var mtxd = [ [ 0, 1, 0 ], [ -1, 0, 0 ], [ 0, 0, 1 ] ];
			//var mtxd = [ [ 1, 0, 0 ], [ 0, 1, 0 ], [ 0, 0, 1 ] ];
			img.mtx = prod(prod(mtxa, mtxb), prod(mtxc, mtxd));
			//img.mtx = trsp(img.mtx);
		}
		info_msg("mtx["+i+"] = "+str(img.mtx));
		
		myPictures.push(img);
		img.src = img_path;
		img.loaded = false;
	}
	info_msg("pictures: "+n+" onloaded callbacks set. ");
}

function setMatchedPts(mp) {
	info_msg("setMatchedPts: loading "+mp+"."); 
	matched_pts = mp;
}

// view selection

function initViewSelection() {
	info_msg("initViewSelection begins"); 
	
	// read params from URL
	info_msg("reading args from URL '" + document.location.search +"'"); 
	var prms = params();
	info_msg("reading args complete. "+obj_txt(prms)); 

	// build the drop down
	var output = [ '<option >Select point of view</option>' ];
	$.each(views, function(k, v) {
		output.push('<option value="'+k+'">'+k+'</option>');
	});
	//$('#viewform').remove();  // remove this item
	//$('#menu').append('<form name="viewform" />');
	//$('#viewform').empty();   // remove this item's children
	//$('#viewform').append('<select id="viewselect" name="viewselect" onChange="onViewSelect(); "/>');
	$('#viewselect').html(output.join(''));

	// use params from URL
	if (prms.view!=undefined) {
		view_name = prms.view;
		if (views[prms.view]!=undefined) {
			view_script_uri = views[view_name];
		} else {
			var msg = "'" + view_name + "' unknown view";
			error_msg(msg); alert(msg); 
		}
	}
	if (prms.viewurl!=undefined) {
		view_script_uri = prms.viewurl+"views.js";
	}
	
	info_msg("initViewSelection ends"); 
}

function onViewSelect() {
	var i = document.viewform.viewselect.selectedIndex;
	var txt = document.viewform.viewselect.options[i].text;
	window.location = window.location.protocol + "//" + window.location.host + window.location.pathname + "?view="+txt;  
}

// --------------------------------------------------------------------------------------------------------------------
// --- react to event code  ---

function setDeviceToWorldRotMtx(m) {
	WorldToDeviceRotMtx = trsp(m); 
	info_msg("DeviceToWorldRotMtx set to : "+str(m)+". ");
	info_msg("WorldToDeviceRotMtx set to : "+str(WorldToDeviceRotMtx)+". ");
}

// setRotatedDeviceToWorldRotMtx
function setViewOnImg(i) {
	var tmp = myPictures[i].mtx;
	info_msg("RotatedDeviceToWorldRotMtx set to : "+str(tmp)+". ");
	
	// landscape mode : the y axis of the device (from its left side to its right side) is along the world z axis (to the sky)
	var bLandscapePhotos = (tmp[0][1] * 0.0 + tmp[1][1] * 0.0 + tmp[2][1] * 1.0) > 0.7;
	//alert("Is landscape photo: " + bLandscapePhotos + "  Ydevice2world = " + [ tmp[0][1] , tmp[1][1] , tmp[2][1]]);
	
	if (bLandscapePhotos) {
		setDeviceToWorldRotMtx(tmp); return;
	}
	
	// RotatedDeviceToWorldRotMtx columns are :
	//  1.    - DeviceToWorldRotMtx[.,2]
	//  2.    + DeviceToWorldRotMtx[.,1]
	//  2.      DeviceToWorldRotMtx[.,3]
	
	// we undo this rotation here
	var tmp2 = [ 
		[ tmp[0][1], -tmp[0][0], tmp[0][2] ],
		[ tmp[1][1], -tmp[1][0], tmp[1][2] ],
		[ tmp[2][1], -tmp[2][0], tmp[2][2] ]
	];
	setDeviceToWorldRotMtx(tmp2);	//tmp or tmp2 depends either the natural orientation of photos is portrait or paysage
}

// -----------------------------------------------------------------------------------------------------