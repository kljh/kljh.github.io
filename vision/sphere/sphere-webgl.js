// http://www.khronos.org/webgl/wiki/Debugging

var gl;
var shaderProgram;
var perVertexProgram;
var perFragmentProgram;
var bFragment = false;

var squareVertexPositionBuffer;
var squareVertexNormalBuffer;
var squareVertexColorBuffer;
var squareVertexTextureCoordBuffer;
var sphereTextures = [];
var sphereMatrices = [];
	
var theta = 0.005 ;
var mvMatrixStack = [];
var rSquare = 0;

var b_canvas_snapshot;

// --------------------------------------------------------------------------------------------------------------------
// --- WebGL init code ---

function webGLStart() {
	var canvas = document.getElementById("canvas");
	initGL(canvas);
	initShaders();
	initBuffers();

	$("#menu").append('<a href="js-event.html" onclick="b_canvas_snapshot = true; return false;">Snapshot</a> &nbsp; ');
	
	tick();
}

function initGL(canvas) {
	function throwOnGLError(err, funcName, args) {
		msg =  WebGLDebugUtils.glEnumToString(err) + " was caused by call to" + funcName;
		//alert(msg);
		//throw msg;
	};
	
	try {
		//gl = canvas.getContext("experimental-webgl");
		gl = WebGLDebugUtils.makeDebugContext(canvas.getContext("experimental-webgl"), throwOnGLError);
		
		gl.viewportWidth = canvas.width;
		gl.viewportHeight = canvas.height;
		
		gl.clearColor(0.1, 0.2, 0.3, 1.0);
		
		gl.enable(gl.DEPTH_TEST);
		// or for transparency
		if (bFragment){
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.enable(gl.BLEND);
		gl.disable(gl.DEPTH_TEST);
		}
	} catch (e) {
	}
	if (!gl) {
		alert("Could not initialise WebGL, sorry :-(");
	}
}

function mvPushMatrix() {
	var copy = mat4.create();
	mat4.set(mvMatrix, copy);
	mvMatrixStack.push(copy);
}

function mvPopMatrix() {
	if (mvMatrixStack.length == 0)
		throw "Invalid popMatrix!";
	mvMatrix = mvMatrixStack.pop();
}

function degToRad(degrees) {
	return degrees * Math.PI / 180;
}

// --------------------------------------------------------------------------------------------------------------------
// --- WebGL init code (shaders) ---

// setMatrixUniforms sends the projection rotation matrix to the vertex shadders that will do actual calculation
function setMatrixUniforms() {
	// in vertex shader program :
	// gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);

	gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
	gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
	
	if (bFragment) {
	var normalMatrix = mat3.create();
	mat4.toInverseMat3(mvMatrix, normalMatrix);
	mat3.transpose(normalMatrix);
	gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
	}
}

function initShaders() {
	if (bFragment)
		shaderProgram= createProgram("per-fragment-lighting-fs", "per-fragment-lighting-vs", true);
	else 
		shaderProgram= createProgram("shader-fs", "shader-vs", false);
	
	gl.useProgram(shaderProgram);
}

function createProgram(fragmentShaderID, vertexShaderID, bFragment) {
	var fragmentShader = getShader(gl, fragmentShaderID);
	var vertexShader = getShader(gl, vertexShaderID);

	var shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		alert("Could not initialise shaders");
	}

	shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
	gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
	
	if (bFragment) {
	shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
	gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
	}
	
	// color (replaced by as texture coord)
	//shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord"); // "aVertexColor");
	//gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
	
	shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
	gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

	shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
	shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
	shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
	
	shaderProgram.useTexturesUniform = gl.getUniformLocation(shaderProgram, "uUseTextures");
	shaderProgram.ambientColorUniform = gl.getUniformLocation(shaderProgram, "uAmbientColor");
	shaderProgram.fltBrightness = gl.getUniformLocation(shaderProgram, "uBrightness");
	
	if (bFragment) {
	shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
	shaderProgram.useLightingUniform = gl.getUniformLocation(shaderProgram, "uUseLighting");
	shaderProgram.pointLightingLocationUniform = gl.getUniformLocation(shaderProgram, "uPointLightingLocation");
	shaderProgram.pointLightingColorUniform = gl.getUniformLocation(shaderProgram, "uPointLightingColor");
	}
	
	return shaderProgram;
}


function getShader(gl, id) {
	var shaderScript = document.getElementById(id);
	if (!shaderScript) {
		return null;
	}

	var str = "";
	var k = shaderScript.firstChild;
	while (k) {
		if (k.nodeType == 3) {
			str += k.textContent;
		}
		k = k.nextSibling;
	}

	var shader;
	if (shaderScript.type == "x-shader/x-fragment") {
		shader = gl.createShader(gl.FRAGMENT_SHADER);
	} else if (shaderScript.type == "x-shader/x-vertex") {
		shader = gl.createShader(gl.VERTEX_SHADER);
	} else {
		return null;
	}

	gl.shaderSource(shader, str);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert(gl.getShaderInfoLog(shader));
		return null;
	}

	return shader;
}

// --------------------------------------------------------------------------------------------------------------------
// --- WebGL init code (buffers) ---

function initBuffers() {
	initPictBuffers();
	initHorizonBuffers();
}

function initPictBuffers() {
	squareVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
	fc = -2.0;
	var vertices = [
		-1.0, -1.0,  fc,
		 1.0, -1.0,  fc,
		-1.0,  1.0,  fc,
		 1.0,  1.0,  fc
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	squareVertexPositionBuffer.itemSize = 3;
	squareVertexPositionBuffer.numItems = 4;

	
	squareVertexNormalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexNormalBuffer);
	var c = 1.7
	var vertexNormals = [
		-c,  -c,  1.0,
		 c,  -c,  1.0,
		-c,   c,  1.0,
		 c,   c,  1.0
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
	squareVertexNormalBuffer.itemSize = 3;
	squareVertexNormalBuffer.numItems = 4;

	/*squareVertexColorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
	var colors = []
	for (var i=0; i < 4; i++) {
		colors = colors.concat([0.5, 0.5, 1.0, 1.0]);
	}
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
	squareVertexColorBuffer.itemSize = 4;
	squareVertexColorBuffer.numItems = 4;*/

	squareVertexTextureCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexTextureCoordBuffer);
	var textureCoords = [
		0.0, 0.0,
		1.0, 0.0,
		0.0, 1.0,
		1.0, 1.0,
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
	squareVertexTextureCoordBuffer.itemSize = 2;
	squareVertexTextureCoordBuffer.numItems = 4;

/*
    squareVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, squareVertexIndexBuffer);
    var squareVertexIndices = [
        0, 1, 2,      0, 2, 3
    ];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(squareVertexIndices), gl.STATIC_DRAW);
    squareVertexIndexBuffer.itemSize = 1;
    squareVertexIndexBuffer.numItems = 6;
*/
}

function initHorizonBuffers() {
	horizonVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, horizonVertexPositionBuffer);
	var d = 1.5;
	var vertices = [
		-d,  0,  0,  // nord
		0,  -d,  0,  // ouest
		d,   0,  0,  // sud
		0,   d,  0,  // est
		0,   0,  d,  // sky
		0,   0,  -d,  // ground
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	horizonVertexPositionBuffer.itemSize = 3;
	horizonVertexPositionBuffer.numItems = 6;

	horizonVertexColorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, horizonVertexColorBuffer);
	var colors = []
	for (var i=0; i<6; i++) {
		colors = colors.concat([1.0, 0.5, 0.0, 1.0]);
	}
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
	horizonVertexColorBuffer.itemSize = 4;
	horizonVertexColorBuffer.numItems = 4;

	var idx = [ 0, 1, 2, 3,  0, 4, 2, 5, 0,  1, 4, 3, 5, 1 ];
	horizonIndexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, horizonIndexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
	horizonIndexBuffer.itemSize = 1;
	horizonIndexBuffer.numItems = idx.length;
}


// --------------------------------------------------------------------------------------------------------------------
// --- WebGL init code (textures) ---

function initTexture(texture_img_src) {
	var texture = gl.createTexture();
	var image = new Image();
	image.onload = function() { handleLoadedTexture_pot(texture, image);  };
	image.src = texture_img_src;
	return texture;
}

// version using non power-of-two images
function handleLoadedTexture_npot(texture, image) {
	gl.bindTexture(gl.TEXTURE_2D, texture);
	
	// mandatory for non power-of-two images:
	// TEXTURE_MIN_FILTER : gl.NEAREST or gl.LINEAR only
	// TEXTURE_WRAP : CLAMP_TO_EDGE
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); 
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);  // Y coordinates increase as go up the image
	
	info_msg("texImage2D");
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	info_msg("bindTexture0");
	gl.bindTexture(gl.TEXTURE_2D, null);
}

// version forcing power-of-two images
// http://www.khronos.org/webgl/wiki/WebGL_and_OpenGL_Differences
function handleLoadedTexture_pot(texture, image) {
	gl.bindTexture(gl.TEXTURE_2D, texture);
	
	var canvas;
	if (!isPowerOfTwo(image.width) || !isPowerOfTwo(image.height)) {
		// scale up the texture to the next highest power of two dimensions.
		canvas = document.createElement("canvas");
		canvas.width = nextHighestPowerOfTwo(image.width);
		canvas.height = nextHighestPowerOfTwo(image.height);
		var ctx = canvas.getContext("2d");
		ctx.drawImage(image,
			0, 0, image.width, image.height,
			0, 0, canvas.width, canvas.height);
	}
	
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas); 
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
	gl.generateMipmap(gl.TEXTURE_2D);
	
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);  // Y coordinates increase as go up the image
	
	gl.bindTexture(gl.TEXTURE_2D, null);
	return texture;
}

function isPowerOfTwo(x) {
	return (x & (x - 1)) == 0;
}

function nextHighestPowerOfTwo(x) {
	--x;
	for (var i = 1; i < 32; i <<= 1) {
		x = x | x >> i;
	}
	return x + 1;
}

// --------------------------------------------------------------------------------------------------------------------
// --- loop code ---

function tick() {
	// setInterval keeps getting called even even from hidden tab or window, .
	// requestAnimationFrame  takes one parameter, a function which will be called when the browser thinks you should render your scene again. 
	requestAnimFrame(tick);
	
	drawSphere();
	animate();
}

var lastTime = 0;

function animate() {
	var timeNow = new Date().getTime();
	if (lastTime != 0) {
		var elapsed = timeNow - lastTime;
		rSquare += (75 * elapsed) / 1000.0;
	}
	lastTime = timeNow;
}

function drawSphere() {

	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	// gl.Perspective(GLdouble fov, GLdouble aspect, GLdouble near, GLdouble far);
	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
	mat4.identity(mvMatrix);
	
	/*if (bFragment) {
		shaderProgram = perFragmentProgram;
	} else {
		shaderProgram = perVertexProgram;
	}
	gl.useProgram(shaderProgram);
	*/
	
	gl.uniform1i(shaderProgram.useTexturesUniform, true); //true);
	gl.uniform1i(shaderProgram.fltBrightness, 1.0);
	
	if (bFragment) {
		var lighting = true;
		gl.uniform1i(shaderProgram.useLightingUniform, lighting);
		
		gl.uniform3f( shaderProgram.ambientColorUniform, 0.0, 0.0, 0.0 );
		gl.uniform3f( shaderProgram.pointLightingLocationUniform, 0.0, 0.0, 0.0 );
		gl.uniform3f( shaderProgram.pointLightingColorUniform, 0.5, 0.5, 0.5 );
	}

	// turn around vertical 
	var WorldAroundVertical = [ [ Math.cos(theta), -Math.sin(theta), 0 ], [ Math.sin(theta), Math.cos(theta), 0 ], [ 0, 0, 1 ] ]
	WorldToDeviceRotMtx = prod(WorldToDeviceRotMtx, WorldAroundVertical)
	
	drawPictures()
}

function drawPictures() {
	if (myPictures==undefined) {
		warn_msg("drawPictures: myPictures not yet loaded.")
		return;
	}
	
	var n = myPictures.length;
	for (var i=0; i<n; i++) {
		
		var w = myPictures[i].width;
		var h = myPictures[i].height;
		if (!(w>0 && h>0 && myPictures[i].loaded==true)) { 
			warn_msg("image "+i+" not yet loaded: w x h = "+w+" x "+h+" - .");	return;
		} 
		
		if (!sphereTextures[i]) { 
			warn_msg("image "+i+" loaded, texture "+i+" not yet loaded, loading...");
			sphereTextures[i] = gl.createTexture();
			handleLoadedTexture_npot(sphereTextures[i], myPictures[i]);
			warn_msg("texture "+i+" loaded.");
		} 
		var tex = sphereTextures[i];
		
		/*if (sphereMatrices[i]==undefined && !!myPictures[i]) {
			warn_msg("matrix "+i+" not yet created, creating...");
			sphereMatrices[i] = mat4.create();
			for (var p=0; p<16; p++)
				for (var q=0; q<16; q++)
					sphereMatrices[i][p][q] = myPictures[i].mtx[p][q];
			sphereMatrices[i][3][3] =1.0;
			info_msg("matrix "+i+" created.");
		}
		var mtx = sphereMatrices[i];
		*/
		var mtx0 = myPictures[0].mtx;
		var mtx0 = trsp(WorldToDeviceRotMtx);
		var mtx = myPictures[i].mtx;
		
		// myPictures[i].mtx is the centered picture coordinates to world coordinates
		// R is a transformation of world coordinates
		// Ri =  R . mtx   is the picture cordinates 
		var Ri = myPictures[i].mtx;
		
		// we apply the picture to world coordinates to pictures point. Then we normalise them
		//var m = new Array(M.length);
		//for (var k=0; k<M.length; k++)
		//	m[k] = proj(rotate(Ri, M[k]));
		
		drawPicture(tex, mtx, mtx0, i);
	}
	
	{
		gl.uniform1i(shaderProgram.useTexturesUniform, false);
		gl.uniform1i(shaderProgram.fltBrightness, 1.0);
		
		gl.uniform3f( shaderProgram.ambientColorUniform, 1.0, 0.0, 0.0 );
		
		if (bFragment) {
		gl.uniform1i(shaderProgram.useLightingUniform, false);
		}
		
		gl.bindBuffer(gl.ARRAY_BUFFER, horizonVertexPositionBuffer);
		gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, horizonVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, horizonVertexColorBuffer);
		gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, horizonVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
		
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, horizonIndexBuffer);
		
		// LINE_LOOP, LINE, LINES
		gl.lineWidth(1);
		
		// give the transformation matrix to the vertex shader
		//setMatrixUniforms();
		// and send buffers to OpenGL
		//gl.drawArrays(gl.LINE_STRIP, 0, horizonIndexBuffer.numItems);
		gl.drawElements(gl.LINE_STRIP, horizonIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0); 
		
	}
	
	if (!!b_canvas_snapshot) 
		canvas_snapshot();
}


var draw_count = 0;
function drawPicture(texture, mtx, mtx0, i) {
	draw_count++;
	
	if (draw_count%3==0)
		gl.uniform1i(shaderProgram.fltBrightness, 2.0);
	if (draw_count%3==1)
		gl.uniform1i(shaderProgram.fltBrightness, 1.0);
	if (draw_count%3==2)
		gl.uniform1i(shaderProgram.fltBrightness, 0.5);
	
	mvPushMatrix();
	
	// restore matrix 4x4
	mtx = mat4.create([].concat(mtx[0], [0], mtx[1], [0], mtx[2], [0, 0, 0, 0, 1]));
	mtx0 = mat4.create([].concat(mtx0[0], [0], mtx0[1], [0], mtx0[2], [0, 0, 0, 0, 1])); 

	// display 
	if (draw_count < 15) {
		info_msg("R["+i+"] = " + mat4.str_br(mtx));
		info_msg("R0 = " + mat4.str_br(mtx0));
	}

	/*mat4.transpose(mtx);
	mat4.multiply(mtx0,mtx, mtx);  // if no destination A*B  ->  A
	//mat4.transpose(mtx);
	*/
	
	mat4.transpose(mtx0);
	mat4.multiply(mtx,mtx0, mtx);  // if no destination A*B  ->  A
	mat4.transpose(mtx);
	
	// display 
	if (draw_count < 15) {
		info_msg("R = " + mat4.str_br(mtx));
	}
	
	if (false) {
		// ***** DEMO VERSION *****
		mat4.translate(mvMatrix, [ 1.0*(i-2.5),  0.0, -7.0 ]);
		mat4.rotate(mvMatrix, degToRad(rSquare), [1, 0, 0]);
	} else if (true) {
		// ***** FULL VERSION *****
		//mat4.translate(mvMatrix, [ 0.0,  0.0, -5 ]); // to see from outside
		mat4.translate(mvMatrix, [ 0.0,  0.0, 0.98 * fc ]); // to see from shifted inside
		mat4.multiply(mvMatrix, mtx);
		//mat4.translate(mvMatrix, [ 0.0,  0.0, -3.0 ]);
		//mat4.translate(mvMatrix, [ 1.0*(i-2.5),  0.0, -7.0 ]);
		//mat4.rotate(mvMatrix, degToRad(rSquare), [1, 0, 0]);
	} else {
		// ***** SIMPLE VERSION *****
		mat4.identity(mvMatrix);
		mat4.translate(mvMatrix, [ 0.0,  0.0, -2.5 ]);
	}
	
	gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

	if (bFragment) {
	gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexNormalBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, squareVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
	}
		
	//gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
	//gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, squareVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexTextureCoordBuffer);
	gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, squareVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.uniform1i(shaderProgram.samplerUniform, 0);

	// give the transformation matrix to the vertex shader
	setMatrixUniforms();
	// and send buffers to OpenGL
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);

	// in vertex shader program :
	// gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
	if (draw_count < 15) {
		info_msg("pMatrix = " + mat4.str_br(pMatrix));
		info_msg("mvMatrix = " + mat4.str_br(mvMatrix));
		
		var p = [ 0, 0, 0, 1.0 ]
		mat4.multiplyVec4(mvMatrix, p);   // mvMatrix*p   ->   p
		mat4.multiplyVec4(pMatrix, p);     // pMatrix*p   ->   p
		vec3.scale(p,1/p[3]); 			 //  p / p[3]  ->  p
	
		info_msg("proj = " + vec3.str(p));
	}
	
	mvPopMatrix();
}

// --------------------------------------------------------------------------------------------------------------------
// --- event code  ---

function canvas_snapshot() {
	var canvas = document.getElementById("canvas");
	var img    = canvas.toDataURL("image/png");
	
	b_canvas_snapshot = false;
	//$("#snapshots").empty();        // remove this item children
	//$("#snap_img").remove(); 		// remove this item
	
	
	// equivalent
	var nb_child = $("#snapshots > img ").size();  // img children only
	var nb_child = $("#snapshots").children().size();
	
	if (nb_child==0) {
		$("#snapshots").append('(right-click, save as): ');
		$("#snapshots").append('<a href="js-event.html" onclick="return canvas_snapshot_clear();"><img src="icon/remove.png"/></a><br/>'); }
	$("#snapshots").append('<img id="snap_img" src="'+img+'" width="150" />');
}

function canvas_snapshot_clear() {
	$("#snapshots").empty();
	return false;
}
