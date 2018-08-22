/*
	Author: Claude Cochet
	Creation date : 2007-03-17 for C++, version, 2013-01-06 for JS translation.
*/

/*
///		Projection matrix.  This is a 3x4 matrix noted Pp, 
///		composed of a 3x3 matrix noted P and a 3x1 vector noted p.
///		Three dimension coordinates are M (3x1 Cartesian vector) 
///		and Mh (4x1 homogeneous vector, first 3 coordinates must be divided by the forth).
///		Two dimension coordinates are m (2x1 Cartesian vector) 
///		and mh (3x1 homogeneous vector, first 2 coordinates must be divided by the third).
///		
/// 
///		In canonical camera referential (R0): 
///		e0_x is image top
///		e0_y is image right
///		e0_z is image looking direction
///		Canonical camera projection matrix is ( Id33, Zero3 )
/// 
///		Projection matrix decomposition
///		 [mm 2 px]    M 2 mh    Mh 2 M       Mh 2 Mh
///		| r    u0 | | f     | | 1     0 | |             |
///		|   r  v0 |.|   f   |.|   1   0 |.| R33 -R33.p3 |
///		|      1  | |     1 | |     1 0 | | 0_3   1     |
/// 
///		[mm 2 px]:	u[px] = u[mm] . res[px/mm] + u0[px] 
///		M 2 mh :	u[mm] / f[mm] = x / z
///		Mh 2 M :	homogeneous to std coordinates
///		Mh 2 Mh :	x' = R.x + R.p, camera in p, rotated by R (head, pitch, roll)
/// 
///		Detail of Mh 2 Mh (deplacement of the camera).
/// 	Coordinates convention for point M in space, given for referential Ri  : (xMi, yMi, zMi)/Ri.
///		Vector convention for referential Ri orientation : exi> is the vector for the x axis.
///		R0: referential canonical camera
///		R1:	referential of camera move at point P : (xP0, yP0, zP0)/R0 		=>	xM1 = xM0 - xP0 (so that the point P is the origin in R1) = TranslatMtx(-P0) . xM0
///		R2: referential of camera, after head left/right by angle 'head'	=>	xM2 = RotMtx2(around e1x> = e0x> by angle MINUS 'head' in -Pi..Pi ) . xM1
///		R3: referential of camera, after pitch up/down by angle 'pitch'		=>	xM3 = RotMtx3(around e2y> by angle MINUS 'pitch' in -Pi/2..Pi/2 ) . xM2
///		R4: referential of camera, after roll clock/anticlock by 'roll'		=>	xM4 = RotMtx4(around e3z> by angle MINUS 'roll' in -Pi..Pi ) . xM3
///		Mh 2 Mh = RotMtx4 . RotMtx3 . RotMtx2 . TranslatMtx
///		
///		|  c3  -s3   0  | |  c2 0 s2 | | 1  0  0  |   | c3c2 c3s2s1-s3c1 c3s2c1-s3s1 | 
///		|  s3   c3   0  |.|  0  1  0 |.| 0 c1 -s1 | = | s3c2 s3s2s1+c3c1 s3s2c1-c3s1 |
///		| -s2 c2s1 c2c1 | | -s2 0 c2 | | 0 s1  c1 |   | -s2      c2s1        c2c1    |
///		
///		Reverse induction of camera parameters from projection matrix
///		
///		Pp_43 . X.41 = ( P_33 p_31 ) . ( X_3 1) = x~_3, 
///		if x~[3]=0, the point is projected at infinity 
///		=> the equation of the focal plan is P_33[3,.] . X = - p_31[3]
///		
///		if x~_3 = 0_3, the point projection is undefined (zero divided by zero)
///		=> the coordinates of focal center is - P_33^-1 . p_31[3]
*/

/*
namespace {

/// Basic rotation matrices for head, pitch, roll
dmatrix rotation_hpr(
	const int		axe,			///< axe around which we turn (0 for x, 1 for y, 2 for z)
	const double	angle			///< rotation angle
) { 
	const int n=3;
	const double c = cos(angle);
	const double s = sin(angle);
	dmatrix R(0.0, n,n);

	R[axe][axe] = 1;
	R[(axe+1)%3][(axe+1)%3] = c;
	R[(axe+2)%3][(axe+1)%3] = s;
	R[(axe+2)%3][(axe+2)%3] = c;
	R[(axe+1)%3][(axe+2)%3] = -s;

	return R;
}


} // anonymous namespace

camera projMatrix(const camera_parameters&	params)
{
	// exogenous parameters
	dmatrix Pp(3,4);
	
	dmatrix P(3,3); 
	P = rotation_hpr(2,-params.extra.roll)*rotation_hpr(1,-params.extra.pitch)*rotation_hpr(0,-params.extra.head);
	setsubmtx(Pp, 0,0, P);
	
	dmatrix p(3,1); 
	p[0][0] = params.extra.x; p[1][0] = params.extra.y; p[2][0] = params.extra.z; 
	setsubmtx(Pp, 0,3, -P*p);

	// intrinsic parameters
	dmatrix intra(0.0, 3,3);
	intra[0][0] = intra[1][1] = params.intra.focal * params.intra.pixel_per_mm;
	intra[2][2] = 1.0;
	intra[0][2] = params.intra.uo;
	intra[1][2] = params.intra.vo;

	// composition
	Pp = intra * Pp;
	return Pp;
}

*/

function projOpticalCenter(cam_pmtx) {
	require(rows(cam_pmtx)==3 && cols(cam_pmtx)==4, "camera sprojection matrix expected size is 3x4.");
	var P = mtx_get_slice(cam_pmtx, 0,0, 3,3); 	// left 3x3 bloc
	var p = mtx_get_slice(cam_pmtx, 0,3, 3,1); 	// right 3x1 bloc
	return vec_scalar_prod(mtx_2_vec(mtx_prod(mtx_inv(P), p)), -1);
}

function projOpticalAxis(cam_pmtx) { 
	require(rows(cam_pmtx)==3 && cols(cam_pmtx)==4, "camera projection matrix expected size is 3x4.");
	// return third row, three first columns
	return mtx_2_vec(mtx_get_slice(cam_pmtx, 2,0, 1,3));
}

/*
camera_parameters projParameters(const camera &cam, bool ortho_assumtion) {
	const dmatrix &pmtx = cam.pmtx;
	dmatrix P = cols(pmtx,0,2);
	dvector P1=vect(row(P,0)), P2=vect(row(P,1)), P3=vect(row(P,2));
	double  p1=pmtx[0][3], p2=pmtx[1][3], p3=pmtx[2][3];

	// Check scale factor ||P3||=1
	// ...

	// Check ortho factor
	double cost = 1./( norm(pvect(P1,P3))*norm(pvect(P2,P3))) * pscal(pvect(P1,P3),pvect(P2,P3)) ;
	double sint = sqrt(1-sq(cost));
	double tant = sint/cost;
	double theta = acos(cost);

	// Retrieve parameters
	double u0, v0, fu, fv; //, fuv;
	double tx, ty, tz;
	dvector  r1(dvector(3)),r2(dvector(3)),r3(dvector(3));

	u0 = pscal(P1,P3);
	v0 = pscal(P2,P3);
	fu = norm(pvect(P1,P3))*sint;
	fv = norm(pvect(P2,P3))*sint;
	r1 = (1./(norm(pvect(P1,P3))*sint)) * pvect(P3,pvect(P1,P3))  
	   + (1./(norm(pvect(P2,P3))*tant)) * pvect(P3,pvect(P2,P3));
	r2 = (1./norm(pvect(P2,P3)))   *      pvect(P3,pvect(P2,P3));
	r3 = P3;
	tx = (p1-u0*p3)/fu  + (p2-v0*p3)*cost/fv;
	ty = (p2-v0*p3)*sint/fv;
	tz = p3;

	camera_parameters params;
	params.intra.uo = u0;
	params.intra.vo = v0;
	//params.intra.ku = 1.;
	//params.intra.kv = fv/fu;
	//params.intra.kuv = 0; // from theta 
	params.intra.focal = fu;
	params.extra.x = tx;
	params.extra.y = ty;
	params.extra.z = tz;
	//params.extra.head = 0;
	//params.extra.pitch = 0;
	//params.extra.roll = 0;
	return params;
}

*/

// output:
//  - matrix
function coProjectionBase(lhs, rhs) {
	
	// optical centre
	var lhsCenter = projOpticalCenter(lhs);
	var rhsCenter = projOpticalCenter(rhs);
	var center = vec_make(3);
	for (var i=0; i<3; i++) center[i] = (lhsCenter[i]+lhsCenter[i])*.5;
	
	// optical axis and new referential  
	
	// co-projection optical axis as average of optical axis
	// (works: when camera are translated, looking at the same thing (stereo) or looking from the same point (homography)
	// (fails: when camera are looking one another, take one or the other cam in that case)
	var lhsOpticalAxis = projOpticalAxis(lhs);
	var rhsOpticalAxis = projOpticalAxis(rhs);
	var ek = vec_make(3); 
	for (var i=0; i<3; i++)  ek[i] = (lhsOpticalAxis[i]+rhsOpticalAxis[i])*.5;
	ek = vec_scalar_prod( ek, 1/norm(ek) );

	// normalised LR> vector 
	// le plan optique doit etre // a ce vecteur
	var ei = vec_make(3);
	for (var i=0; i<3; i++)  
		ei[i] = rhsCenter[i] - lhsCenter[i];
	var ei = vec_scalar_prod( ei, 1/norm(ei) );
	
	// 2nd projection plane vector
	var ej = pvect(ek, ei);
	var ej = vec_scalar_prod( ej, 1/norm(ej) ); 

	// exact e_k z
	var ek = pvect(ei, ej);
	var ek = vec_scalar_prod( ek, 1/norm(ek) );

	// on retourne (e_i, e_j, e_k)	
	return [ ei, ej, ek ];
}

// output:
//  - pair of re-projection matrix 3x3
function coProjectionHmtx(base, cam_pmtx) {

	// On veut reprojeter l'image obtenue par la camera cam
	// sur un plan optique de normale k>, muni du repere par i>, j> (ie. base)

	var P = mtx_get_slice(cam_pmtx, 0,0, 3,3);

	var Q = mtx_make(3,3);
	for (var i=0; i<3; i++) 
		mtx_set_slice(Q, i,0, vec_2_mtx_row(base[i]));
			
	var Base2Cam = mtx_prod( P, mtx_inv(Q) );
	var Cam2Base = mtx_prod( Q, mtx_inv(P) );
	
	return [ Cam2Base, Base2Cam ];
}

//  Basic geometry

function norm(x) {
	return Math.sqrt(pscal(x,x));
}

function pscal(lhs, rhs) { 
	require(lhs.length==rhs.length, "pscal: dimensions mismatch");
	var sum=0.0;
	for (var i=0; i<lhs.length; i++)
		sum += lhs[i]*rhs[i];
	return sum;
}

function pvect(lhs, rhs) { 
	require(lhs.length==3, "pvect: dimension must be 3");
	require(lhs.length==rhs.length, "pvect: dimensions mismatch");

	var res = new Array(3);
	res[0] = lhs[1]*rhs[2]-lhs[2]*rhs[1];
	res[1] = lhs[2]*rhs[0]-lhs[0]*rhs[2];
	res[2] = lhs[0]*rhs[1]-lhs[1]*rhs[0];
	return res;
}
