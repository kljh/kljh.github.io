/*
 *  Loads sphere data : scene location, photos, rotation matrices, matched points 
 *  Claude Cochet - Oct 2010
 */


// Projection variables (will be set in initSpereMap)
var proj_type = "planisphere"
var fc = 50;
var WorldToDeviceRotMtx = [ [ 1, 0, 0 ], [ 0, 0, 1 ], [ 0, -1, 0 ] ];

// Interaction variables
var theta = 0.005 ;
var interval_ms = 250;
var canvas;
var ctx;

// --------------------------------------------------------------------------------------------------------------------
// --- init html5 code ---

// init function to be called with event onLoad
function initSphereHtml5() {
	info_msg("initSphereHtml5 begins"); 
	
	canvas = document.getElementById('canvas');
	canvas.width = document.body.clientWidth - 20;
	canvas.height = document.body.clientHeight - 20;
	fc = ( canvas.width + canvas.height ) / 5;
	ctx = canvas.getContext('2d');
	
	info_msg("initSphereHtml5 completed, start display loop"); 
	setTimeout(drawSphere, interval_ms); // must be call again for next step
	info_msg("initSphereHtml5 completed<br/>"); 
}



// --------------------------------------------------------------------------------------------------------------------
// ---  code ---

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

// --------------------------------------------------------------------------------------------------------------------
// --- loop code ---

function drawSphere() {
	//try {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = "#FAF7F8";
		ctx.fillStyle = "#000033";
		drawRect(0, 0, canvas.width, canvas.height);
		
		// turn around vertical 
		var WorldAroundVertical = [ [ Math.cos(theta), -Math.sin(theta), 0 ], [ Math.sin(theta), Math.cos(theta), 0 ], [ 0, 0, 1 ] ]
		WorldToDeviceRotMtx = prod(WorldToDeviceRotMtx, WorldAroundVertical)
		
		//var R2 = [ [ 1, 0, 0 ], [ 0, Math.cos(2*theta), -Math.sin(2*theta) ], [ 0, Math.sin(2*theta), Math.cos(2*theta) ] ]
		//R = prod(R, prod(R1, R2));
		
		var R = WorldToDeviceRotMtx 
		if (drawMesh) {
			drawHorizon(R);
			drawPolyedron(R);
		}
		drawPictures(R);
		
		setTimeout(drawSphere, interval_ms); // timer before we run next step
	/*
	} catch(e) {
		error_msg("drawSphere: "+e.message);
		error_msg("display loop terminated.");
	}
	*/
}

// expects WorldToDeviceRotMtx
function drawHorizon(R) {
	ctx.save();

	// Horizon
	var nb = 17;
	var V = [];
	for (var i=0;  i<nb; i++) 
		V[i] = [ Math.cos(2*Math.PI*i/(nb-1)), Math.sin(2*Math.PI*i/(nb-1)), 0 ];
	
	ctx.strokeStyle = "red";
	for (var i=1;  i<nb; i++) {
		var A = proj(rotate(R, V[i-1]));
		var B = proj(rotate(R, V[i]));
		drawLine( A, B );
	}
	
	// Labels / bearings
	var labels = [
		{ txt : "Nord", pt : [ 0, 1, 0 ] },
		{ txt : "NE", pt : [ 1, 1, 0 ] },
		{ txt : "East", pt : [ 1, 0, 0 ] },
		{ txt : "SE", pt : [ 1, -1, 0 ] },
		{ txt : "Sud", pt : [ 0, -1, 0 ] },
		{ txt : "SO", pt : [ -1, -1, 0 ] },
		{ txt : "Ouest", pt : [ -1, 0, 0 ] },
		{ txt : "NO", pt : [ -1, 1, 0 ] },
		{ txt : "Sky", pt : [ 0, 0, 1 ] },
		{ txt : "Ground", pt : [ 0, 0, -1 ] },
		{ txt : "Ground North", pt : [ 0, .2, -1 ] },
		{ txt : "Ground East", pt : [ .2, 0, -1 ] },
		{ txt : "Etoile polaire à Paris", pt : [ 0, 1, 1 ] },
		{ txt : "Soleil de midi à Paris", pt : [ 0, -1, 1 ] },
	];
	
	ctx.font = 'bold 14px';
	ctx.fillStyle = "#BA0000";
	for (var i=0;  i<labels.length; i++) {
		var txt = labels[i].txt;
		var P = proj(rotate(R,labels[i].pt));
		drawText( txt, P );
	}
	
	ctx.restore();
}

function drawPolyedron(R) {
	if (!myMesh) return;

	ctx.save();
	ctx.strokeStyle  = "orange";  

	var nbM = myMesh.vertices.length;
	var nbF = myMesh.faces.length;
	for (var i=0;  i<nbF; i++) {
		var F = myMesh.faces[i];
		var nbE = F.length;
		
		var M = rotate(R, myMesh.vertices[F[nbE-1]])
		var m = proj(M);
		for (var j=0; j<nbE; j++) {
			var N = rotate(R, myMesh.vertices[F[j]])
			var n = proj(N);
			
			drawLine(m, n);
			
			m = n;
		}
	}
	
	ctx.restore();
}



function drawPictures(R) {
	if (myPictures==undefined) {
		warn_msg("drawPictures: myPictures not yet loaded.")
		return;
	}
	
	var n = myPictures.length;
	for (var i=0; i<n; i++) {
		
		var w = myPictures[i].width;
		var h = myPictures[i].height;
		if (!(w>0 && h>0)) { 
			warn_msg("image "+i+" not yet loaded: w x h = "+w+" x "+h+" - .");	return;
		} else {
			//info_msg("image "+k+": w x h = "+w+"  "+h+"     c = "+c);
		}
		
		// points in image coordinates
		var p = [
			[ w/2 , h/2 ],
			[ w , 0 ],
			[ w , h ],
			[ 0 , h ],
			[ 0 , 0 ],
			// extra points in the middle of each border
			[ w , h/2 ],	
			[ w/2 , h ],
			[ h/99 , h/2 ],	// h/99 is to avoid 0
			[ w/2 , h/99 ]
		]
		// points in space coordinates
		var d = 36;						// distance focale (mm, 24x36 equivalent)
		var w = 36/2, h = 24/2;		// width = 36mm,   height < width, function of image shape
		var M = [
			[ 0 , 0 , -d ], 
			[ w , h , -d ],
			[ w , -h , -d ],
			[ -w , -h , -d ],
			[ -w , h ,  -d ],
			// extra points in the middle of each border
			[ w , 0 , -d ],
			[ 0 , -h , -d ],
			[ -w , 0 , -d ],
			[ 0 , h ,  -d ]
		];
		
		// picture triangulation
		var trgl = [
			[ 0, 1, 2 ],
			[ 0, 2, 3 ],
			[ 0, 3, 4 ],
			[ 0, 4, 1 ]
		]
		// with extra points
		var trgl = [
			[ 0, 5, 6 ],
			[ 0, 6, 7 ],
			[ 0, 7, 8 ],
			[ 0, 8, 5 ],
			[ 5, 2, 6 ],
			[ 6, 3, 7 ],
			[ 7, 4, 8 ],
			[ 8, 1, 5 ]
		];
		
		// myPictures[i].mtx is the centered picture coordinates to world coordinates
		// R is a transformation of world coordinates
		// Ri =  R . mtx   is the picture cordinates 
		var Ri = prod(R, myPictures[i].mtx); /// 3x3 . 4x4
		
		// we apply the picture to world coordinates to pictures point. Then we normalise them
		var m = new Array(M.length);
		for (var k=0; k<M.length; k++)
			m[k] = proj(rotate(Ri, M[k]));
		
		//ctx.save();
		//ctx.setTransform(m11, m12, m21, m22, dx, dy);
		//ctx.drawImage(myPictures[i].img, o[0], o[1]);
		//ctx.restore();
		
		// set transparency value  
		ctx.globalAlpha = 0.8;  // 0 = tranparent ... 1 = opaque  
		
		//warn_msg("drawing image "+i+"/"+n+"with kind-of perspective using triangle fan");
		for (var k=0; k<trgl.length; k++) {
			
			var q = m[trgl[k][0]];
			var r = m[trgl[k][1]];
			var s = m[trgl[k][2]];
			
			var t = p[trgl[k][0]];
			var u = p[trgl[k][1]];
			var v = p[trgl[k][2]];
			
			//info_msg("triangle fan "+k+": o/r/t/s/u = "+o+"  "+r+"  "+s+"  "+t+"  "+u)
			
			if ( q==undefined || r==undefined || s==undefined)  continue;
			
			// all three vertices of the triangle are on the same side of the optical plane
			ctx.save();
			
			// Clip path
			ctx.beginPath();  
			ctx.moveTo(q[0], q[1]);
			ctx.lineTo(r[0], r[1]);
			ctx.lineTo(s[0], s[1]);
			ctx.closePath();
			ctx.clip();
			
			trsf = transf( [ t, u, v ], [ q, r, s ] );
			ctx.setTransform(trsf[0], trsf[3], trsf[1], trsf[4], trsf[2], trsf[5]);
			try { // Firefox may fail if the picture is not completely loaded
				ctx.drawImage(myPictures[i], 0, 0); 
			} catch(e) {}
			
			ctx.restore();
		}
		
		/*
		warn_msg("drawing image borders " +m);
		ctx.beginPath();
		for (var k=0; k<M.length; k++) {
			if (k==0) 
				ctx.moveTo(m[k][0], m[k][1]);
			else
				ctx.lineTo(m[k][0], m[k][1]);
		}
		ctx.closePath();
		if (i==0) {
			ctx.strokeStyle  = "red";  
			ctx.stroke(); // actual inking / painting
		}
		*/
	}
}


function proj(M) {
	if (proj_type=="planisphere")
		return projPlanisphere(M);
	else
		return projPinhole(M);
}

function projPinhole(M) {
	if ( !(M[2]<0) ) return;  // we look negative z 
	
	var u = - fc * M[0] / M[2]  +  canvas.width/2;		// minus comes from the fact we divivid by a negative number while we just want to divide but its absolute value
	var v = + fc * M[1] / M[2]  +  canvas.height/2;		// minus*minus = plus, same as above + the 2d coordinates are inverted for heigth
	
	// if ( !isFinite(u) || !isFinite(v) ) return; 	// avoids Infinity and NaN
	return [ u, v, M[2] ];
}

function projPlanisphere(M) {
	var d = Math.sqrt( M[0]*M[0] + M[1]*M[1] + M[2]*M[2] );
	if ( M[2] > 0.95*d ) return;  // we look negative z 
	
	var u = + fc * M[0] / (d-M[2])  +  canvas.width/2;		
	var v = - fc * M[1] / (d-M[2])  +  canvas.height/2;	// minus because the 2d coordinates are inverted for heigth
	
	// if ( !isFinite(u) || !isFinite(v) ) return; 	// avoids Infinity and NaN
	return [ u, v, M[2] ];
}

function rotate(R, M) {
	var N = [];
	for (var i=0; i<3; i++)
		N[i] = R[i][0] * M[0] + R[i][1] * M[1] + R[i][2] * M[2];
	return N;
}

// affine transformation of 2D coordinates   dst = T . src   where 
// -  T is a 2x3 transformation matrix  and 
// -  (dst,src) coordinates are given for 3 points
// solved as  d = S . t where S is a 6x6 matrix, d and t are 6x1 vectors.
function transf( src, dst ) {
	var d = [ dst[0][0], dst[1][0], dst[2][0], dst[0][1], dst[1][1], dst[2][1] ];
	var S = [
		[ src[0][0], src[0][1], 1, 0, 0, 0 ],
		[ src[1][0], src[1][1], 1, 0, 0, 0 ],
		[ src[2][0], src[2][1], 1, 0, 0, 0 ],
		[ 0, 0, 0, src[0][0], src[0][1], 1 ],
		[ 0, 0, 0, src[1][0], src[1][1], 1 ],
		[ 0, 0, 0, src[2][0], src[2][1], 1 ],
	]; 
	var t = prod_mv(inv(S), d);
	return t;
}

function drawLine( A, B ) {
	if ( A==undefined || B==undefined )  return;
	
	ctx.save();
	ctx.beginPath()
	ctx.moveTo(A[0], A[1]);
	ctx.lineTo(B[0], B[1]);
	// ctx.strokeStyle = "red";  
	ctx.stroke();
	ctx.restore();
}

function drawText( txt, P ) {
	if ( P==undefined )  return;
	
	// ctx.font not supported by firefox
	// ctx.font = 'bold 14px sans-serif';
	// ctx.font = 'bold 14px';
	// ctx.fillStyle = "#AA0000";
	ctx.fillText(txt, P[0], P[1]);
}

function drawRect(x,y,w,h) {
	ctx.save();
	ctx.beginPath();
	ctx.rect(x,y,w,h);
	ctx.closePath();
	ctx.fill();
	ctx.restore();
}

// -----------------------------------------------------------------------------------------------------
// mouse/touch/keyboard events

var click_x = 75;
var click_y = 50;
var click_dx = 5;
var click_dy = 3;
var click_drag = false;

function initEvents(canvas) {
	canvas.onmousedown = myDown;
	canvas.onmouseup = myUp;
	
	//canvas.ontouchstart = ...;
	//canvas.ontouchend = ...;
	//canvas.ontouchcancel = ...;
	canvas.ontouchmove = myTouchMove;
}	

function myDown(e) {
	if (e.pageX < click_x + 15 + canvas.offsetLeft 
		&& e.pageX > click_x - 15 + canvas.offsetLeft 
		&& e.pageY < click_y + 15 + canvas.offsetTop 
		&& e.pageY > click_y -15 + canvas.offsetTop)
	{
		click_x = e.pageX - canvas.offsetLeft;
		click_y = e.pageY - canvas.offsetTop;
		click_drag = true;
		canvas.onmousemove = myMove;
	}
}

function myMove(e) {
	if (click_drag) {
		click_x = e.pageX - canvas.offsetLeft;
		click_y = e.pageY - canvas.offsetTop;
	}
}

function myUp() {
	click_drag = false;
	canvas.onmousemove = null;
}

function myTouchMove(e){
	// cancel mouse events
	canvas.onmousedown = null;
	
	if(e.touches.length == 1) { // Only deal with one finger
	
		// * touches: A list of information for every finger currently touching the screen
		// * targetTouches: Like touches, but is filtered to only the information for finger touches that started out within the same node
		// * changedTouches: A list of information for every finger involved in the event (see below)
		var touch = e.touches[0]; // Get the information for finger #1
		
		// * clientX: X coordinate of touch relative to the viewport (excludes scroll offset)
    	// * clientY: Y coordinate of touch relative to the viewport (excludes scroll offset)
    	// * screenX: Relative to the screen
    	// * screenY: Relative to the screen
    	// * pageX: Relative to the full page (includes scrolling)
    	// * pageY: Relative to the full page (includes scrolling)
    	// * target: Node the touch event originated from
		// * identifier: An identifying number, unique to each touch event
		var node = touch.target; // Find the node the drag started from
		
		//node.style.position = "absolute";
		//node.style.left = touch.pageX + "px";
		//node.style.top = touch.pageY + "px";
		
		click_x = touch.pageX - canvas.offsetLeft;
		click_y = touch.pageY - canvas.offsetTop;
	}
}

