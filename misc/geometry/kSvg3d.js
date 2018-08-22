
// globals
var svgns = "http://www.w3.org/2000/svg";

// --------------------------------------------------------------------------------------------------------------------
//   EventHandler

function EventHandler(root, scene) {
	this.scene = scene; 			// scene to contol
	
	this.root = root; 			// root of events
	this.node  = null;			// text node to print status

	this.bMouseDown = false; 		// is the mouse button down ?
	this.xDown; this.yDown; 		// where did we pressed mouse button down ?
	this.objDown; 				// who did receive the mouse down event ?
	
	this.root.addEventListener("keypress",  this.onkeypress, false);
	this.root.addEventListener("mousemove", this.onmousemove, false);
	this.root.addEventListener("mousedown", this.onmousedown, false);
	this.root.addEventListener("mouseup",   this.onmouseup, false);
}

EventHandler.prototype.print = function(txt) {
	var svgdoc = this.root.ownerDocument;
	var txtnode=svgdoc.createTextNode(txt);
		
	if (this.node == null) {
		this.node = svgdoc.createElementNS(svgns, "text");
		this.node.setAttributeNS(null, "x", 10);
		this.node.setAttributeNS(null, "y", 10);
		this.node.setAttributeNS(null,"fill","black"); 
		this.node.setAttributeNS(null,"font-size","10");
		this.root.appendChild(this.node);
		this.node.appendChild(txtnode);
	}
	
	this.node.replaceChild(txtnode, this.node.childNodes.item(0));
}

EventHandler.prototype.onkeypress = function(evt) {
	//var key = String.fromCharCode(evt.getCharCode());
	var key = evt.getCharCode();
	evtHandler.print("Key pressed '" + key + "'.");
}

// Mouse event :
// ctrlKey, altKey, shiftKey, metaKey (booleans)
// button, which, detail, eventPhase (integer)
// clientX/clientY, pageX/Y, layerX/Y, screenX/Y
// target, currentTarget, explicitOriginalTarget

EventHandler.prototype.onmousemove = function(evt) {
	var x=evt.clientX;
	var y=evt.clientY;
	msg = "Mouse " + (this.bMouseDown?"(down) ":"(up) ") + x+","+y 
		+" "+ evt.button+","+evt.which+","+evt.detail 
		+" "+ evt.ctrlKey+","+evt.altKey+","+evt.shiftKey +".       ";
	
	try {
		if (evt.ctrlKey) {
			evtHandler.scene.z_dist = x;
			evtHandler.scene.z_focal = y;	
			msg += "Scene distance " + x + ", focal " + y + ".";
		} else if (evt.shiftKey) {
			msg += this.objDown.shiftAction(x, y, this.xDown, this.yDown);
		} else {
			msg += evtHandler.scene.transform.rotate(y/100,x/100	,0);
		}
		evtHandler.scene.draw();
	} catch (e) { 
		msg += "Exception in onmousemove. '"+e.message+"'.";
		evtHandler.print(msg); //throw new Error(msg);
	}
	
	evtHandler.print(msg);
}

EventHandler.prototype.onmousedown = function(evt) {
	var msg = "Mouse down. ";
	this.bMouseDown = true;
	this.xDown=evt.clientX;
	this.yDown=evt.clientY;
	this.objDown = evt.target; 
	if (evt.shiftKey) {
			//debugger;
			msg += "Id " + this.objDown.id;
			this.objDown = scene.getItemFromId(this.objDown.id);
			msg += "Item " + this.objDown;
	}
	evtHandler.print(msg);
}

EventHandler.prototype.onmouseup = function(evt) {
	this.bMouseDown = false;
	evtHandler.print("Mouse up.");
}

// --------------------------------------------------------------------------------------------------------------------
//   Transform

function Transform() {
	this.rx = 0;
	this.ry = 0;
	this.rz = 0;
	
	this.matrix = new Array(
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1
	);
}

Transform.prototype.translate = function(x, y, z) {
	var matrix = this.matrix;
	matrix[12] = x;
	matrix[13] = y;
	matrix[14] = z;
};

Transform.prototype.rotate = function(rx, ry, rz) {
	var matrix = this.matrix;
	var cosx = Math.cos(rx);
	var sinx = Math.sin(rx);
	var cosy = Math.cos(ry);
	var siny = Math.sin(ry);
	var cosz = Math.cos(rz);
	var sinz = Math.sin(rz);

	// M' = RotZ RotY RotX M + T
	matrix[0]  = cosy*cosz + siny*sinx*sinz;
	matrix[1]  = -cosy*sinz + siny*sinx*cosz;
	matrix[2]  = -siny*cosx;
	matrix[4]  = cosx*sinz;
	matrix[5]  = cosx*cosz;
	matrix[6]  = sinx;
	matrix[8]  = siny*cosz - cosy*sinx*sinz;
	matrix[9]  = -siny*sinz - cosy*sinx*cosz;
	matrix[10] = cosy*cosx;
	
	return "R : " + Math.round(rx*180/Math.PI) + " " + Math.round(ry*180/Math.PI) + " " + Math.round(rz*180/Math.PI);
};

// --------------------------------------------------------------------------------------------------------------------
//  Point3D

function Point3D(x, y, z) {
	this.x3 = x;
	this.y3 = y;
	this.z3 = z;

	this.x2 = 0;
	this.y2 = 0;
}

Point3D.prototype.transform = function(transform, focus, vertices) {
	var matrix = transform.matrix;
	var x = this.x3;
	var y = this.y3;
	var z = this.z3;

	// values bellow are local
	var x3 = x * matrix[0] + y * matrix[4] + z * matrix[8]  + matrix[12];
	var y3 = x * matrix[1] + y * matrix[5] + z * matrix[9]  + matrix[13];
	var z3 = x * matrix[2] + y * matrix[6] + z * matrix[10] + matrix[14];

	// updates projection
	this.x2 = focus * x3 / z3;
	this.y2 = focus * y3 / z3;
};

Point3D.prototype.draw = function (parent, vertices) {
}

Point3D.prototype.shiftAction = function (x, y, xo, yo) {
}

// --------------------------------------------------------------------------------------------------------------------
//  Point3D Barycentre

function Point3D_Barycentre(v1, v2, k) {
	this.k     = k;
	this.v1    = v1;
	this.v2    = v2;
	this.vk    = new Point3D(0,0,0) 

	this.x2 = 0;
	this.y2 = 0;
}

Point3D_Barycentre.prototype.transform = function(transform, focus, vertices) {
	var k  = vertices[this.k].value; 	// vertice number k must have a 'value' member
	var v1 = vertices[this.v1];
	var v2 = vertices[this.v2];

	// calculate vk's x3, y3, z3 first
	this.vk.x3 	= (1-k) * v1.x3 + k * v2.x3;
	this.vk.y3 	= (1-k) * v1.y3 + k * v2.y3;
	this.vk.z3 	= (1-k) * v1.z3 + k * v2.z3;
	// projet vk
	//debugger;
	this.vk.transform(transform, focus, vertices);
	// update projection
	this.x2 = this.vk.x2;
	this.y2 = this.vk.y2;
};

Point3D_Barycentre.prototype.draw = function (parent, vertices) {
}

Point3D_Barycentre.prototype.shiftAction = function (x, y, xo, yo) {
}


// --------------------------------------------------------------------------------------------------------------------
//  Vertex

function Vertex(v1, v2, style) {
	this.v1    = v1;
	this.v2    = v2;
	this.node  = null;
	this.style = (style==null) ? "stroke:purple;" : style;
}

Vertex.prototype.transform = function(transform, focus, vertices) {
}

Vertex.prototype.draw = function(parent, vertices) {
	var vertex1 = vertices[this.v1];
	var vertex2 = vertices[this.v2];

	if (this.node == null) {
		var svgdoc = parent.ownerDocument;
		this.node  = svgdoc.createElementNS(svgns, "line");
		this.node.setAttributeNS(null, "style", this.style);
		parent.appendChild(this.node);
	}

	this.node.setAttributeNS(null, "x1", vertex1.x2);
	this.node.setAttributeNS(null, "y1", vertex1.y2);
	this.node.setAttributeNS(null, "x2", vertex2.x2);
	this.node.setAttributeNS(null, "y2", vertex2.y2);
};

Vertex.prototype.shiftAction = function (x, y, xo, yo) {
}

// --------------------------------------------------------------------------------------------------------------------
//  Variable

function Variable(name, value, min, max, id) {
	this.name   = name;
	this.value  = value;
	this.max    = max;
	this.min    = min;
	this.node   = null;
	this.id     = id;
}

Variable.prototype.transform = function(transform, focus, vertices) {
}

Variable.prototype.draw = function(parent, vertices) {
	//var vertex1 = vertices[this.v1];
	if (this.node == null) {
		var svgdoc = parent.ownerDocument;
		this.node  = svgdoc.getElementById(this.id);
	}
	
	this.node.childNodes.item(0).nodeValue = this.name + " " + this.value;
	//this.node.replaceChild(this.name + " " + this.value, this.node.childNodes.item(0));
	var txt = this.name + " " + this.value;
	
	// data, nodeValue, textContent
};

Variable.prototype.shiftAction = function (x, y, xo, yo) {
	this.value = x * (this.max-this.min) / scene.svgwidth;
	return "Variable.prototype.shiftAction " + this.value;
}

// --------------------------------------------------------------------------------------------------------------------
//   Mesh3D

function Mesh3D(parent) {
	this.vertices = new Array();
	this.parent   = parent;
}

Mesh3D.prototype.add = function(u) {
	var length = this.vertices.length;
	this.vertices[length] = u; 
	return length;
};


Mesh3D.prototype.draw = function(matrix, z_focal) {
	var vertices = this.vertices;

	for (var i = 0; i < vertices.length; i++) {
		vertices[i].transform(matrix, z_focal, vertices);
	}

	for (var i = 0; i < vertices.length; i++) {
		vertices[i].draw(this.parent, vertices);
	}
};


// --------------------------------------------------------------------------------------------------------------------
//   Scene

function Scene(parent) {
	this.svgdoc		= parent.ownerDocument;
	this.svgwidth 		= this.svgdoc.rootElement.getAttribute("width");
	this.svgheight 		= this.svgdoc.rootElement.getAttribute("height");
	
	this.mesh 		= new Mesh3D(parent)
	this.transform    	= new Transform();
	this.parent   		= parent;
	
	this.z_dist = 110;
	this.z_focal = 90;	
}

Scene.prototype.draw = function() {
	this.transform.translate(0, 0, this.z_dist);
	this.mesh.draw(this.transform, this.z_focal);
}

Scene.prototype.getItemFromId = function(id) {
	if (id==null) return null;
	
	var vertices = this.mesh.vertices
	for (var i = 0; i < vertices.length; i++) {
		if (vertices[i].node != undefined) 
			if (vertices[i].node.hasAttribute("id"))
				if (vertices[i].node.id == id)
					return vertices[i]; 
	}
	return null;
}