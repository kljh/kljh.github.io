
/// prototye below would be better using sort but features a nice continue to outer loop
Array.prototype.unique = function () {
	var r = new Array();
	o:for(var i = 0, n = this.length; i < n; i++)
	{
		for(var x = 0, y = r.length; x < y; x++)
		{
			if(r[x]==this[i])
			{
				continue o;
			}
		}
		r[r.length] = this[i];
	}
	return r;
}

/// returns a polyedron mesh
function mesh() {

	var r = 15;
	var phi = r * (1.+Math.sqrt(5)) / 2.;

	var vertices = [
		[ 0, +r, phi ], 	
		[ 0, -r, phi ], 	
		[ +phi, 0, +r ], 	
		[ -phi, 0, +r ], 	
		[ +r, +phi, 0 ], 	
		[ -r, +phi, 0 ], 	
		[ +r, -phi, 0 ], 	
		[ -r, -phi, 0 ], 	
		[ +phi, 0, -r ], 	
		[ -phi, 0, -r ], 	
		[ 0, +r, -phi ], 	
		[ 0, -r, -phi ]
	];

	var faces = [
		[ 0, 1, 2 ],
		[ 0, 1, 3 ],
		[ 0, 2, 4 ],
		[ 0, 3, 5 ],
		[ 0, 4, 5 ],
		[ 1, 2, 6 ],
		[ 1, 3, 7 ],
		[ 1, 6, 7 ],
		[ 2, 4, 8 ],
		[ 2, 6, 8 ],
		[ 3, 5, 9 ],
		[ 3, 7, 9 ],
		[ 10, 4, 5 ],
		[ 10, 4, 8 ],
		[ 10, 5, 9 ],
		[ 11, 6, 7 ],
		[ 11, 6, 8 ],
		[ 11, 7, 9 ],
		[ 11, 10, 8 ],
		[ 11, 10, 9 ]
	];

	var m = direct_mesh(vertices, faces);
	
	var bTruncate = true;
	if (bTruncate)
		m = truncate(m.vertices, m.faces);
	else 
		m = geode(1, 2, m.vertices, m.faces);

	var bDual = false;
	if (bDual)
		m = dual(m.vertices, m.faces);

	return m;
}

/// makes sure all the faces are direct (as tested by is_direct)
function direct_mesh(vertices, faces) {
	var nf = [];
	for (var f=0; f<faces.length; f++) {
		var A = faces[f][0];
		var B = faces[f][1];
		var C = faces[f][2];
		
		if (is_direct(vertices[A],vertices[B],vertices[C]))
			nf[f] = [ A, B, C ];
		else
			nf[f] = [ A, C, B ];
	}
	return { vertices : vertices, faces : nf};
}

/// test whether ABC is direct e.g. OA>*(AB>^AC>) > 0 
function is_direct(A, B, C)
{
	var i = [ B[0]-A[0], B[1]-A[1], B[2]-A[2] ];
	var j = [ C[0]-A[0], C[1]-A[1], C[2]-A[2] ];
	var p = [ i[1]*j[2]-i[2]*j[1], i[2]*j[0]-i[0]*j[2], i[0]*j[1]-i[1]*j[0] ];
	var scal = A[0]*p[0] + A[1]*p[1] + A[2]*p[2];
	return scal > 0;
}

function truncate(vertices, faces)
{
	// a) build vertices 
	// b) creates a lookup from truncated sommet description to sommet index
	var sommet_trunc_desc2id = {} // dict index : pair of vertices id, dict value: new vertice after truncation
	var nv = [];
	{
		var edges = faces_2_edges(faces);
		for (var k=0; k<edges.length; k++) {
			var line = edges[k];
			
			nv[2*k] = pt_from_wght_2(vertices[line[0]], vertices[line[1]], 0.667, 0.333);   
			sommet_trunc_desc2id[ [ line[0], line[1] ] ] = 2*k;
			
			nv[2*k+1] = pt_from_wght_2(vertices[line[1]], vertices[line[0]], 0.667, 0.333);
			sommet_trunc_desc2id[ [ line[1], line[0] ] ] = 2*k+1;
		}
	}
	
	// c) build faces
	nf = [];
	for (var i=0; i<faces.length; i++) {
		nf[i] = [];
		
		var initial_from = faces[i][faces[i].length-1];
		for (var j=0; j<faces[i].length; j++) {
			var initial_to = faces[i][j];
			var new_from = sommet_trunc_desc2id[ [ initial_from, initial_to ] ];
			var new_to = sommet_trunc_desc2id[ [ initial_to, initial_from ] ];
			initial_from = initial_to;
			
			nf [i][2*j] = new_from;
			nf [i][2*j+1] = new_to;
		}
	}
	
	return { vertices : nv, faces : nf};
}

function faces_2_edges( faces) 
{                                              
	var line_set = [];
	
	for (var i=0; i<faces.length; i++) {
		var face = faces[i];
		var from = face[face.length-1];
		for (var j=0; j<face.length; j++) {
			var to = face[j];
			if (from<to)
				line_set.push( [ from, to ] );
			else
				line_set.push( [ to, from ] );
			from = to;
		}
	}
	return line_set.unique();
}

function  pt_from_wght_2(A, B, wA, wB)
{
	var M = [];
	for (var i=0; i<3; i++)
		M[i] = wA*A[i] + wB*B[i];
	return M;
}

function  pt_from_wght_3(A, B, C, wA, wB, wC)
{
	var M = [];
	for (var i=0; i<3; i++)
		M[i] = wA*A[i] + wB*B[i] + wC*C[i];
	return M;
}


// ---------------------------- More complex code for geode and dual -------------------------------

function dual(vertices, faces)
{
	// vertices
	nv = [];
	for ( k=0; k<faces.length; k++)
		nv[k] = pt_from_wght_3(vertices[faces[k][0]], vertices[faces[k][1]], vertices[faces[k][2]], 0.3333, 0.3333, 0.3333);
	
	// faces
	nf = [];
	for ( k=0; k<vertices.length; k++)
		nf[k] = dual_face(k, faces);
	
	return { vertices : nv, faces : nf};
}	

function dual_face(center, faces)
{
	var stack = [];

	// find a starting triangle
	var v1 = 123, v2 = 123;
	
	for (var k=0; k<faces.length; k++) {
		for (var v=0; v<faces[k].length; v++) {
			if (faces[k][v]==center) {
				stack.push(k);
				v1 = faces[k][(v+1)%(faces[k].length)]; 
				v2 = faces[k][(v+2)%(faces[k].length)];
				break;
			}
		}
		if (!stack.empty()) break;
	}
			
	var vStart = v1;
	while (v2!=vStart) {
		
		var next = find_other_face(faces, center, v2, v1);
		var face_id = next[0];
		var pt_pos = next[1];
		
		v1 = v2;
		v2 = faces[face_id][pt_pos];
		stack.push(face_id);
	}
	
	return stack;
}

function geode( q,  r,  vertices, faces)
{	
	var desc2id = {};
	nv = geode_vertices(q, r, vertices, faces, desc2id);
	nf = geode_faces(q, r, faces, desc2id);
	
	return { vertices : nv, faces : nf};
}	

function  geode_vertices(q,  r,  vertices, faces, desc2id) 
{
	// check 'q' and 'r' are primes => they are odd (e.g. 2n+1)
	var surf_ratio = q*q + r*r + q*r; // => surf_ratio is odd (e.g. 4p+1)
	var nbInner = (surf_ratio-1) / 2; // per face
	var nbTotal = vertices.length + faces.length * nbInner; 
	var nv = [];
	
	
	// main vertices
	var k=0;
	for (; k<vertices.length; k++)
		nv[k] = vertices[k];
	

	// inner vertices 
	for ( f=0; f<faces.length; f++) {
		var A = faces[f][0];
		var B = faces[f][1];
		var C = faces[f][2];
		
		// A local coordinates are (0,0)
		// B local coordinates are (r,-q)
		// C local coordinates are (q,r)
		
		for ( i=1; i<r+q; i++) {
			for ( j=-q; j<r; j++) {					
				if (is_inner(i,j,q,r)) {
					desc2id[ [f, i, j] ] = k ;
					nv[k++] = pt_from_hexa_coords(i, j, q, r, vertices[A], vertices[B], vertices[C]);
				}
			}
		}
	}
	return nv;
} 

function geode_faces(q,  r, faces, desc2id)
{
	var surf_ratio = q*q + r*r + q*r;
	var new_faces = [];
	var all_faces = [];  
	
	// default values (in case of)
	for ( f=0; f<new_faces.length; f++)
		new_faces[f] = faces[f%faces.length];
	
	// new faces values
	var nf = 0;
	for ( f=0; f<faces.length; f++) {
		var A = faces[f][0];
		var B = faces[f][1];
		var C = faces[f][2];
		
		var fA = find_other_face(faces, B, C, A);
		var fB = find_other_face(faces, A, C, B);
		var fC = find_other_face(faces, A, B, C);
		
		for ( i=0; i<r+q; i++) {
			for ( j=-q; j<r; j++) {
				// for each i, j, we look take care of two triangles:
				// (the AND condition shall be replaced by an OR condition + avoiding duplicates)
				
				// 1. triangle (i,j),(i+1,j),(i,j+1)
				//if (is_inner(i,j,q,r) && is_inner(i+1,j,q,r) && is_inner(i,j+1,q,r)) 
				if (is_inner(i,j,q,r) || is_inner(i+1,j,q,r) || is_inner(i,j+1,q,r)) 
				{
					var newA = geode_desc2id( f, i,   j,   q, r, A, B, C, fA, fB, fC, desc2id );
					var newB = geode_desc2id( f, i+1, j,   q, r, A, B, C, fA, fB, fC, desc2id );
					var newC = geode_desc2id( f, i,   j+1, q, r, A, B, C, fA, fB, fC, desc2id );
					
					nfc = tr_smaller_index_first( [ newA, newB, newC ] );
					// check if new face candidate is not already present
					if (!all_faces.contains(nfc)) {
						new_faces[nf++] = nfc;
						all_faces.add(nfc);
					}
					 
				}
				
				// 2. triangle (i,j),(i+1,j-1),(i+1,j)
				if (is_inner(i,j,q,r) && is_inner(i+1,j-1,q,r) && is_inner(i+1,j,q,r)) 
				{
					var newA = geode_desc2id( f, i,   j,   q, r, A, B, C, fA, fB, fC, desc2id );
					var newB = geode_desc2id( f, i+1, j-1, q, r, A, B, C, fA, fB, fC, desc2id );
					var newC = geode_desc2id( f, i+1, j,   q, r, A, B, C, fA, fB, fC, desc2id );
					
					nfc = tr_smaller_index_first( [ newA, newB, newC ] );
					/// check if new face candidate is not already present
					if (!all_faces.contains(nfc)) {
						new_faces[nf++] = nfc;
						all_faces.add(nfc);
					} 
				}
			}
		}
	}
	
	return new_faces ;
}

function  geode_desc2id( f,  i,  j,  q,  r,  A,  B,  C,  fA,  fB,  fC, desc2id) {
	// easy case
	if (is_inner(i,j,q,r)) 
		return desc2id[ [ f, i, j ] ];

	if (i==0 && j==0)
		return A;
	if (i==q+r && j==-q)
		return B;
	if (i==q && j==r)
		return C;
		
	// We are in breach of one of the conditions:
	// - above AB is (-j)/i < q/(q+r) 
	// - below AC is j/i < r/q 
	// - before BC is (j+q)/(i-q-r) < -(q+r)/r 
	
	var bC = (-j*(q+r)>i*q);
	var bB = (j*q>i*r);
	var bA = (j+q)*r>(r+q)*(q+r-i);
	
	// (i2,j2) coordinates of po (i,j) in neighbour triangle with origin in the complementary vertex
	var i2 = 456, j2 = 456;
	var f2 = null;
	if (bA) {
		f2 = fA;
		// AA symmetric of A w.r. BC coordinates : (2*q+r, r-q),  u> = -u2>, v> = -v2> 
		// AA,M > = (i-(2*q+r)).u> + (j-(r-q)).v> 
		//        =  (2*q+r-i).u2> +  (r-q-j).v2> 
		i2 = 2*q + r - i;
		j2 = r - q   - j;
	} 
	if (bB) {
		f2 = fB;
		// BB symmetric of B w.r. AC coordinates : (-r, q+r),  u> = v2>, v> = v2> - u2> 
		// BB,M > = (i+r).u> + (j-q-r).v> 
		//        = (i+r).v2> + (j-q-r).(v2>-u2>) 
		//        = (q+r-j).u2> + (i+j-q).v2>
		i2 = q + r - j;
		j2 = i + j - q;
	} 
	if (bC) {
		f2 = fC;
		// CC symmetric of C w.r. AB coordinates : (r, -q-r),  u> = u2> - v2>, v> = u2> 
		// CC,M > = (i-r).u> + (j+q+r).v> 
		//        = (i-r).(u2>-v2>) + (j+q+r).u2> 
		//        = (j+i+q).u2> + (r-i).v2>
		i2 = j + i + q;
		j2 = r - i;
	}
	
	// (i3,j3) coordinates of po (i,j) in neighbour triangle with origin in the vertex of lower index
	var face_id = f2[0];
	var origin_pos = f2[1];
	var i3 = i2, j3 = j2;
	if (origin_pos==1) {
		// origin is in B we want origin back in A
		// A coordinates (with B origin): (q, r),  uB> = v> - u>, vB> = -u>
		// AM> = (i2-q).uB> + (j2-r).vB>
		//     = (i2-q).(v>-u>) + (j2-r).(-u>)
		//     = (q + r-i2-j2).u> + (i2-q).v>
		i3 = r + q - i2 - j2;
		j3 = -q + i2;
	} 
	if (origin_pos==2) {
		// origin is in C we want origin back in A
		// A coordinates (with C origin): (q+r, -q),  uC> = -v>, vC> = u> - v>
		// AM> = (i2-q-r).uC> + (j2+q).vC>
		//     = (i2-q-r).(-v>) + (j2+q).(u>-v>)
		//     = (j2+q).u> + (r-i2-j2).v>
		i3 = j2 + q;
		j3 = r - i2 - j2;
	} 
	
	return desc2id[ face_id, i3, j3 ];
}
	
// is (i,j) an strictly inner po ?
function is_inner( i,  j,  q,  r) {
	return (-j*(q+r)<i*q) && (j*q<i*r) && ((j+q)*r<(r+q)*(q+r-i));
}

// reorders triangle vertex order so that vertex with smaller index comes first.
// triangle orientation (direct/indirect) is not modified.
function tr_smaller_index_first(tr) {
	var m = Math.min(tr[0], Math.min(tr[1], tr[2]));
	if ( m == tr[0] )
		return tr;
	if ( m == tr[1] )
		return [ tr[1], tr[2], tr[0] ];
	if ( m == tr[2] )
		return [ tr[2], tr[0], tr[1] ];
	return tr;
}
function  pt_from_hexa_coords( i,  j,  q,  r,  A,  B,  C)
{
	/*
	 Coordinates of base vector from A, B and C coordinates:
	 ( q+r -q )   ( u     ( AB         ( u     1./    (  r  q )   ( AB  
	 (  q   r ) . ( v  =  ( AC     =>  ( v  =  det  . ( -q q+r ) . ( AC  
	*/
	
	var u = [], v = [];
	var inv_det = ( 1.0 / ((q+r)*r+q*q) ); 
	for ( k=0; k<3; k++) {
		u[k] = inv_det * (  r*(B[k]-A[k]) +  q*(C[k]-A[k]) );
		v[k] = inv_det * ( -q*(B[k]-A[k]) + (q+r)*(C[k]-A[k]) );
	}
	
	var M = [];
	for ( k=0; k<3; k++)
		M[k] = A[k] + i*u[k] + j*v[k];
	
	return M;
}

// return id of triangle, and position of the complementary vertex in its vertex list 
function  find_other_face(faces,  A,  B,  notC)
{
	var res = [ -1, -1 ];
	
	for ( i=0; i<faces.length; i++)
		if ( contains(faces[i],A) && contains(faces[i],B) && !contains(faces[i],notC) ) {
			// id of the triangle
			res[0] = i;
			
			// returns the position of the complementary vertex
			for ( j=0; j<faces[i].length; j++)
				if ( faces[i][j]!=A && faces[i][j]!=B ) 
					res[1] = j;
		}
	return res;
}
function contains(face,  sommet)
{
	for ( i=0; i<face.length; i++)
		if (face[i]==sommet)
			return true;
	return false;
}

