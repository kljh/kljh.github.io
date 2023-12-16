
function parse_off_file(txt)
{
	lines = txt.split("\n");

	header = lines.shift().replace("OFF", "").trim();
	if (header=="")
		header = lines.shift().replace("OFF", "").trim();
	var [ nb_vertices, nb_faces, nb_edges ] = header.split(" ").map(x => 1*x);

	console.log("nb_vertices", nb_vertices);
	console.log("nb_faces", nb_faces);
	console.log("nb_edges", nb_edges);

	var vertices = new Array(nb_vertices);
	var faces = new Array(nb_faces);
	var edges = new Array(nb_edges);

	function read_line_vals() {
		return lines.shift().split(" ").map(x => 1*x);
	}

	for (var i=0; i<nb_vertices; i++) {
		var [ x, y, z, extras ] = read_line_vals();
		vertices[i] = [ x, y, z ];
	}

	for (var i=0; i<nb_faces; i++) {
		var tmp = read_line_vals();
		var nb = tmp.shift();
		faces[i] = tmp.slice(0, nb);
	}

	for (var i=0; i<nb_edges; i++) {
		var tmp = read_line_vals();
		var nb = tmp.shift();
		edges[i] = tmp.slice(0, nb);
	}

	var geom = { vertices, faces, edges };
	return geom;
}

function write_off_file(geom)
{
	var { vertices, faces, edges } = geom;
	var nb_vertices = vertices.length,
		nb_faces = faces.length,
		nb_edges = edges.length;

	var lines = [];
	lines.push(`OFF ${nb_vertices} ${nb_faces} ${nb_edges}`);
	for (var v of vertices)
		lines.push(v.join(" "));
	for (var f of faces)
		// lines.push(`${f.length} ${f.join(" ")}`);
		lines.push(`3 ${f.join(" ")}`);
	for (var e of edges)
		// lines.push(`${f.length} ${f.join(" ")}`);
		lines.push(`2 ${e.join(" ")}`);
	return lines.join("\n");
}

function vecAB(A, B) {
	return [ B[0]-A[0], B[1]-A[1], B[2]-A[2]];
}
function vecCrossProduct(u, v) {
	return [
		u[1]*v[2] - u[2]*v[1],
		u[2]*v[0] - u[0]*v[2],
		u[0]*v[1] - u[1]*v[0]];
}
function vecScalarProduct(u, v) {
	return u[0]*v[0]+u[1]*v[1]+u[2]*v[2];
}
function unitVec(u) {
	var L = Math.sqrt(vecScalarProduct(u,u));
	if (L>0.0)
		u = u.map(x => x/L);
	return u;
}

function calculate_face_normals(geom) {
	var { vertices, faces, edges } = geom;
	var nb_vertices = vertices.length,
		nb_faces = faces.length;

	var normals = new Array(nb_faces);
	for (var i=0; i<nb_faces; i++) {
		var face = faces[i];
		var v0 = vertices[face[0]];
		var v1 = vertices[face[1]];
		var v2 = vertices[face[2]];

		var u = vecAB(v0, v1);
		var v = vecAB(v0, v2);
		normals[i] = unitVec(vecCrossProduct(u, v));
	}

	geom.face_normals = normals;
	return normals;
}

function facing_up(geom, upDir)
{
	upDir = upDir || [ 0, 0, 1 ];

	if (!geom.face_normals)
		calculate_face_normals(geom);

	var { vertices, faces, edges, face_normals } = geom;
	var nb_vertices = vertices.length,
		nb_faces = faces.length,
		nb_edges = edges.length;

	var lines = [];
	var new_faces = [];
	for (var i=0; i<nb_faces; i++) {
		var face = faces[i];
		var normal = face_normals[i];
		var nz = vecScalarProduct(normal, upDir);
		if (nz>=0)
			new_faces.push(face);
	}

	var geom = { vertices, faces: new_faces, edges };
	return geom;
}

function list_crease_edges(geom, threshold_angle_deg) {
	if (!geom.face_normals)
		calculate_face_normals(geom);

	var { vertices, faces, edges, face_normals } = geom;
	var nb_vertices = vertices.length,
		nb_faces = faces.length;

	threshold_angle_deg = threshold_angle_deg || -90;
	var threshold_cos_alpha = Math.cos(Math.PI*threshold_angle_deg/180);
	console.log("crease if cos < "+threshold_cos_alpha)
	var is_crease = (n1, n2) => {
		var cos_alpha = vecScalarProduct(n1,n2);
		return cos_alpha < threshold_cos_alpha;
	}

	// Crease edges (v0, v1) stored in a dict:
	// key=v0, value=v1 connected with v0

	// Border edge normals (v0, v1, n) stored in a dict storing dict:
	// key1=v0, key2=v1, value normal

	var border_edge_normals = {};
	var crease_edges = {};
	for (var i=0; i<nb_vertices; i++)
		border_edge_normals[i] = {};

	var add_crease_edge = (i, j) => {
		if (!crease_edges[i])
			crease_edges[i] = new Set();
		crease_edges[i].add(j);
	}

	var toggle = (i, j, n1) => {
		if (i in border_edge_normals[j]) {
			// check if crease edge
			var n2 = border_edge_normals[j][i];
			if (is_crease(n1, n2)) {
				add_crease_edge(i, j);
				add_crease_edge(j, i);
			}
			// cancel opposing edge
			delete border_edge_normals[j][i];
		} else {
			// add edge
			border_edge_normals[i][j] = n1;
		}
	};

	for (var i=0; i<nb_faces; i++) {
		var face = faces[i];
		var normal = face_normals[i];

		var [ u, v, w ] = face;
		toggle(u, v, normal);
		toggle(v, w, normal);
		toggle(w, u, normal);
	}

	return connected_edges(crease_edges);
}

// edges : non-oriented edges, both (i,j) and (j,i) must be stored 
// edges : will be empty on exit
function connected_edges(edges) {
	function first_key(o) { 
		if (o===undefined)
			return;
		else if (o.keys)
			// Set
			for (var k of o.keys()) return k;
		else
			// Object / associative array
			for (var k in o) return k*1; 
	}

	function add_connected_segments(line) {
		while (true) {
			var v0 = line[line.length-1];
			var v1 = first_key(edges[v0]);
			if (v1===undefined)
				break;
			line.push(v1);

			edges[v0].delete(v1);
			edges[v1].delete(v0);
			if (edges[v0].size==0) delete edges[v0];
			if (edges[v1].size==0) delete edges[v1];
		}
	}
	
	var lines = [];
	while (true) {
		var vStart = first_key(edges);
		if (vStart === undefined)
			break;
		
		var line = [ vStart ];
		// add segments at the end of the line
		add_connected_segments(line);
		// add segments at the front of the line (if not a closed circuit already)
		var closed_circuit = line[0] == line[line.length-1];
		if (!closed_circuit) {
			line = line.reverse();
			add_connected_segments(line);
		}
		lines.push(line);	
	}
	return lines;
}

function circumference(geom)
{
	var { vertices, faces, edges } = geom;
	var nb_vertices = vertices.length;

	// Border edges (v0, v1) stored in a dict:
	// key=v0, value=set of all v1 connected from v0

	var border_edges = {};
	for (var i=0; i<nb_vertices; i++)
		border_edges[i] = new Set();

	var toggle = (i, k) => {
		if (border_edges[k].has(i)) {
			// cancel opposing edge
			border_edges[k].delete(i);
		}else {
			// add edge
			border_edges[i].add(k);
		}
	};

	for (var face of faces) {
		var [ u, v, w ] = face;
		toggle(u, v);
		toggle(v, w);
		toggle(w, u);
	}

	// console.log(border_edges);

	// Border edges as non-connected line
	var circum_nc= [];
	for (var v0 in border_edges) {
		var v1_iter = border_edges[v0].values();
		for (var v1 of v1_iter) {
			circum_nc.push([ v0, v1 ]);
		}
	}
	geom.edges = circum_nc;

	/*
	var v0, v1;
	var find_start = () => {
		for (var vFrom in border_edges)
			if (border_edges[vFrom].size>0)
				return vFrom;
	};
	while (true) {
		if (v0===undefined) {
			v0 = find_start();
			console.log(v0, border_edges[v0].keys());
			console.log("starting circumference from vertix "+v0+" " +border_edges[v0]+ " " + border_edges[v0].size + " " + JSON.stringify(border_edges[v0].values()));
			if (v0===undefined)
				break;
		}

		// take an edge off
		v1 = border_edges[v0].values()[0];
		border_edges[v0].delete(v1);
		console.log("adding edge "+v0+" " +v1+" to circumference")

		break;
		circum.push(v0);
		circum.push(v1);
		v0 = v1;
	}
	*/
}

function test()
{
	const fs = require('fs');
	var txt = fs.readFileSync("logo.off", "ascii");
	var geom = parse_off_file(txt);
	var geom2 = facing_up(geom);

	circumference(geom2)

	// geom2.vertices.push([ 0.0,  0.0, 0.0 ]);
	// geom2.faces.unshift([ 2, 0, geom2.vertices.length-1,  255, 0, 0  ]);
	// geom2.faces= [ [ 2, 0, geom2.vertices.length-1] ];
	// geom2.edges.unshift([ 0, geom2.vertices.length-1,  0, 255, 0]);

	var txt2 = write_off_file(geom2);
	fs.writeFileSync("logo-top.off", txt2);

	console.log("nb_faces (up)", geom2.faces.length);
	console.log("nb_edges (up)", geom2.edges.length);

	//console.log(geom2);
}

// test();
