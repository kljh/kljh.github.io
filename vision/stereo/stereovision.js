/*
	Author: Claude Cochet
	Creation date : 2007-03-17 for C++, version, 2013-01-06 for JS translation.
*/

/*

void set_zeros(dvector& vec)
{
	uint n = size(vec);
	for (uint i=0; i<n; i++)
		vec[i] = 0.0;
}

void set_zeros(dmatrix& mtx)
{
	uint n = rows(mtx);
	uint m = cols(mtx);
	for (uint i=0; i<n; i++)
		for (uint j=0; j<m; j++)
			mtx[i][j] = 0.0;
}

ivector d2i(const dvector &u) {
	ivector res(size(u));
	for (int i=0; i<size(u); i++) 
		res[i] = static_cast<int>(u[i]);
	return res;
}

*/

function epipolar_projection_projmtx(
	cam00, 
	cam01, 
	img00, 
	img01) 
{
	//Xassert(image_width(img00)==image_width(img01) && image_height(img00)==image_height(img01), 
	//	"epipolar_projection image size mismatch");

	// we find the plane on which we will project both images
	var base = coProjectionBase(cam00, cam01);
	var fromcam_tocam_00 = coProjectionHmtx(base, cam00);
	var fromcam_tocam_01 = coProjectionHmtx(base, cam01);
	
	// we calculate min_x, max_x, min_y and max_y that fit each projection
	info_msg( "<p>Boundaries</p>" );
	var width = cols(img00), height = rows(img00);
	var img_box = { min_x: 0, max_x: width, min_y:0, max_y: height };
	var box00 = hmtxProjectionBoundaries(fromcam_tocam_00, img_box);
	var box01 = hmtxProjectionBoundaries(fromcam_tocam_01, img_box);
	info_msg("Initial projection boundaries");
	info_msg("min_x "+box00.min_x+" \t max_x "+box00.max_x+" \t min_y "+box00.min_y+" \t max_y "+box00.max_y);
	info_msg("min_x "+box01.min_x+" \t max_x "+box01.max_x+" \t min_y "+box01.min_y+" \t max_y "+box01.max_y);
	
	// we update both min_y and max_y to fit the narrowest
	box00.min_y = box01.min_y = Math.max(box00.min_y, box01.min_y);
	box00.max_y = box01.max_y = Math.min(box00.max_y, box01.max_y);
	info_msg("Modified Projection Boundaries (same y range)");
	info_msg("min_x "+box00.min_x+" \t max_x "+box00.max_x+" \t min_y "+box00.min_y+" \t max_y "+box00.max_y);
	info_msg("min_x "+box01.min_x+" \t max_x "+box01.max_x+" \t min_y "+box01.min_y+" \t max_y "+box01.max_y);

	// we adapt projection matrices so that output boundaries are input boundaries ie {{0,width},{0,height}}
	fromcam_tocam_00 = hmtxProjectionBoundariesAdapt(fromcam_tocam_00, img_box, box00);
	fromcam_tocam_01 = hmtxProjectionBoundariesAdapt(fromcam_tocam_01, img_box, box01);
	// check adapted projection is correct
	var box00 = hmtxProjectionBoundaries(fromcam_tocam_00, img_box);
	var box01 = hmtxProjectionBoundaries(fromcam_tocam_01, img_box);
	info_msg("Adapted projection boundaries");
	info_msg("min_x "+box00.min_x+" \t max_x "+box00.max_x+" \t min_y "+box00.min_y+" \t max_y "+box00.max_y);
	info_msg("min_x "+box01.min_x+" \t max_x "+box01.max_x+" \t min_y "+box01.min_y+" \t max_y "+box01.max_y);

	// we do the projection
	var img0b = hmtxProjImg(fromcam_tocam_00, img00);
	var img1b = hmtxProjImg(fromcam_tocam_01, img01);
	//var cam0b_pmtx = mtx_prod( fromcam_tocam_00[0], cam00);  // TO CLEAN : remove the [0]
	//var cam1b_pmtx = mtx_prod( fromcam_tocam_01[0], cam01);
	
	return [ img0b, img1b ];
}

//  The fundamental matrix F is such that for
//  any point m_lft from left image and any point m_rgt from right image,
//  m_lft' . F . m_rght = 0
//
//   l_0 '    f_11 f_12 f_13     r_0
//   l_1   .  f_21 f_22 f_23  .  r_1   =  0 
//    1       f_31 f_23  1        1  
//
//  Let define the vectors 
//    f = ( f_11 f_12 f_13 f_21 f_22 f_23 f_31 f_23 )'
//  and 
//    p = ( l_0.r_0, l_0.r_1, l_0,  l_1.r_0, l_1.r_1, l_1,  r_0, r_1 )'
//  then
//    p' . f = -1
//
//  Given 8 pairs, we build the get the system
//     P . f = -1
//  where P is a 8x8 matrix with each equal to a different p' and -1 is a 8x1 vector.
function fundamental_from_8pairs(pts_left, pts_rght) {
	var P = mtx_make(8,8);
	var I = vec_make(8);
	for (var i=0; i<8; i++) {
		P[i][0] = pts_left[i][0] * pts_rght[i][0];
		P[i][1] = pts_left[i][0] * pts_rght[i][1];
		P[i][2] = pts_left[i][0];
		P[i][3] = pts_left[i][1] * pts_rght[i][0];
		P[i][4] = pts_left[i][1] * pts_rght[i][1];
		P[i][5] = pts_left[i][1];
		P[i][6] = pts_rght[i][0];
		P[i][7] = pts_rght[i][1];
		I[i] = -1.;
	}
	var f = mtx_vec_prod(mtx_inv(P), I);
	var F = [
		[ f[0], f[1], f[2] ],
		[ f[3], f[4], f[5] ],
		[ f[6], f[7], 1.0 ] ];
	return F;
}

/*
// Other solution : pick 8 random 3D points, calculate their projections and apply 8 pairs method.
dmatrix fundamental_from_projection_8pts(const camera &cam_left, const camera &cam_rght) {
	dmatrix pts_left = dmatrix(0.0, 8,2), pts_rght = dmatrix(0.0, 8,2);
	for (int i=0; i<8; i++) {
		dvector M = dvector(4); 
		M[0] = (i&0x1?1:0);
		M[1] = (i&0x2?1:0);
		M[2] = (i&0x4?1:0);
		M[3] = 1;
		
		dvector m_left = cam_left * M;
		dvector m_rght = cam_rght * M;

		pts_left[i][0] = m_left[0]/m_left[2];
		pts_left[i][1] = m_left[1]/m_left[2];
		pts_rght[i][0] = m_rght[0]/m_rght[2];
		pts_rght[i][1] = m_rght[1]/m_rght[2];
	}
	return fundamental_from_8pairs(pts_left, pts_rght);
}
*/

// Given points A, M and X, 
// the relation X belongs to (AM) can be expressed as Xt.A~.M=0.
// This function returns A~ from A (homogeneous) coordinates.
//
// X belongs to (AM)
// <=>       XA> ^ AM>  =  0
//            ( 0 1 0 )
// <=>  XA> . (-1 0 0 ) . AM> = 0
//            ( 0 0 0 )
//        (-wA 0  0) ( 0 1 0 ) (-wA 0 uA)
// <=> X>.( 0 -wA 0).(-1 0 0 ).(0 -wA vA).M> = 0
//        (uA vA wA) ( 0 1 0 ) ( 0 0 -wA)
//            (0 wA -vA)
// <=>   X  . (-wA 0 uA) . M = 0
//            (vA -uA 0)
function line_from_pivot(A) {
	require(is_vector(A)&&A.length==3, "line_from_pivot");
	return [
		[ 0,  A[2],  -A[1] ], 
		[ -A[2],  0,  A[0] ], 
		[ A[1],  -A[0],  0 ] ] ;	
}

// We solve P.M=m.
// The familly of solution is the ray 
//  	M(lambda) = P~.x + lambda.C
// where
//  	P~ is the pseudo inverse of P
//		C is the camera centre, formaly P null-vector defined by PC = 0.
//
// These two points are imaged by the second camera P' at P'.P~.m and P'.C respectively in the second view.
// The epipolar line is the line joining these two projected points, namely l' = (P'C)×(P'P~m). 
// The point P'C is the epipole in the second image, namely the projection of the first camera centre, and may be denoted by e'.
// Thus, l' = [e']×(P'P~).m = F.m, where F is the matrix F = [e']×P'P~.m 
//
// P=cam_right
// P'=cam_left
//
// Pseudo inverse of P : P~
// 1. r=rank(P) =< min(n,m) :
//     P  =  P .  D .  Q
//     P~ = Qt . D^-1 . Pt
// 2. Alternative : QR decomposition
//
// Sources:
// NAG Library f01 — Matrix Factorizations Chapter Introduction
// Richard Hartley and Andrew Zisserman, "Multiple View Geometry in Computer Vision"
function fundamental_from_projection(cam_left, cam_rght) {
	var sv = svdcmp(cam_rght);  // retuns U, w, V     and   M  = U.diag(w).trsp(V)
	var check = mtx_prod(mtx_prod(sv.u,mtx_diag(sv.w)),mtx_trsp(sv.v));
    
    // M   =  U . diag(w) . V'
	// M~  =  V . diag(1/w) . U'
	
	for (var i=0; i<3; i++) sv.w[i] = 1./sv.w[i];
	var cam_rght_pseudo_inv = 	mtx_prod(mtx_prod(sv.v,mtx_diag(sv.w)),mtx_trsp(sv.u));
	
	// Camera center as the inverse of zero.
	//dvector C_rght = cam_rght_pseudo_inv * zero_3; // will be zero
	var C_rght = projOpticalCenter(cam_rght);
	C_rght = [ C_rght[0], C_rght[1], C_rght[2], 1.0 ];

	// Epipol namely the projection of camera center by right camera
	var e_rght = mtx_vec_prod( cam_left, C_rght );

	// Fundamental matrix
	var F = mtx_prod(
		line_from_pivot([ e_rght[0],e_rght[1],e_rght[2] ]),
		mtx_prod(cam_left, cam_rght_pseudo_inv) );
	
	F = mtx_scalar_prod(F, 1./F[2][2]);
	return F;
}

// minimize_fundamental2homography returns the matrix M as bellow 
// which minimizes the norm || M_3x3 . R_3x3 - Id_3x3 ||^2
//
//            ( a b c )
//    M_3x3 = ( 0 e f )
//            ( 0 h i )
//
//  ( R00 R10 R20   0 0   0 0   )             ( 1 )
//  ( R01 R11 R21   0 0   0 0   )   ( a )     ( 0 )
//  ( R02 R12 R22   0 0   0 0   )   ( b )     ( 0 )
//  (  0   0   0  R10 R20 0 0   )   ( c )     ( 0 )
//  (  0   0   0  R11 R21 0 0   )   ( e )     ( 1 )
//  (  0   0   0  R12 R22 0 0   ) . ( f )  -  ( 0 )
//  (  0   0   0    0 0 R10 R20 )   ( h )     ( 0 )
//  (  0   0   0    0 0 R11 R21 )   ( i )     ( 0 )
//  (  0   0   0    0 0 R12 R22 )             ( 1 )
//
// min_x ||Ax-b||
// ||Ax-b|| = (Ax-b)'.(Ax-b) = (x'A'-b').(Ax-b) = x'A'Ax - x'A'b - b'Ax + b'b = x'A'Ax - 2b'Ax + b'b
// extremum pour  d/dx = 0
//  <=>   2A'Ax - 2A'b = 0
//  <=>  x = (A'A)^(-1).A'b
function minimize_fundamental2homography_right(R){
	require(rows(R)==3 && cols(R)==3, "minimize_fundamental2homography_right expects a 3x3 matrix");
	
	var A = mtx_make(9,7);
	
	mtx_set_slice(A,0,0,mtx_trsp(R));
	mtx_set_slice(A,3,3,mtx_trsp(mtx_get_slice(R,1,0,2,3)));
	mtx_set_slice(A,6,5,mtx_trsp(mtx_get_slice(R,1,0,2,3)));

	var b = [ 1, 0, 0, 0, 1, 0, 0, 0, 1 ];
	
	var x = mtx_vec_prod( mtx_inv(mtx_prod(mtx_trsp(A),A)) , mtx_vec_prod(mtx_trsp(A),b) );

	var M = [
		[ x[0], x[1], x[2] ],
		[ 0.0, x[3], x[4] ],
		[ 0.0, x[5], x[6] ] ];

	return M;
}
//   M and M' define as bellow
//       ( aL bL cL )        ( aR bR cR )
//    ML= ( 0  e  f )    MR = ( 0  e  f )   
//        ( 0  h  i )         ( 0  h  i )
//
//   leaves epipolar matrix unchanged
//         ( 0  0  0 )        ( 0  0  0 )
//   MLt . ( 0  0 -1 ) . MR = ( 0  0 -1 ) . (ei-hf)
//         ( 0  1  0 )        ( 0  1  0 )
//   in consequence 
//      RLt . ( " ) .  RR
//  = RLt.MLt.( " ) . MR.RR    .  (ei-hf)
//  =(ML.RL)t.( " ) .(MR.RR)   .  (ei-hf)
//
//  minimize_fundamental2homography_right minimize MR.RR - Id   (7 factors)
//  minimize_fundamental2homography_left  minimize ML'RR'- Id  (3 factors left : aL,bL,cL)
// 
//   mL a point from Left img, we want :
//                        mL.(ML.RL)t   ~= mL			where ~= is the equivalence i.e. (ku,kv,k)~=(u,v,1) 
//   ie          (mL.RLt)_1x3 .MLt_3x3  ~= mL_1x3
//   ie ( (mL.RLt)_1x3 . row(ML,1)_3x1 ) = mL(1)_1x1		considering the equivalence of the first coordinate  
//     / ( (mL.RLt)_1x3 . row(ML,3)_3x1 )  / mL(3)_1x1	
//
//   ie    (mL.RLt)_1x3 . ( aL bL cL )'  = mL(1)_1x1 * ( (mL.RLt)_1x3 . ( 0 h i )' )		with assumption mL(3)=1.
//   id      CstA_1x3  .  ( aL bL cL )'  = CstB_1x1 
//   we resolve this last equation for three choosen points mL of the left image (typically the 3 corners of the image)
function minimize_fundamental2homography_left(RL, MR) {
	var x1=100, y1=100, x0=0, y0=0;
	require(rows(RL)==3 && cols(RL)==3 && rows(MR)==3 && cols(MR)==3, "minimize_fundamental2homography_left expects 3x3 matrices");
	
	var M3 = mtx_2_vec(mtx_get_slice(MR, 2,0, 1,3)); // third line of MR ie ( 0 h i )

	// the 3x3 linear system from the last equation above x 3 points of the image
	var RLmL3 = mtx_make(3,3);
	var mL3 = vec_make(3);
	
	// first point
	var pt=0;
	var tmp = [ x0, y0, 1.0 ];
	mtx_set_slice(RLmL3, pt,0, vec_2_mtx_row(mtx_vec_prod(RL,tmp)));
	mL3[pt] = tmp[0] * pscal(mtx_vec_prod(RL,tmp),M3);
	// second point
	var pt=1;
	var tmp = [ x0, y1, 1.0 ];
	mtx_set_slice(RLmL3, pt,0, vec_2_mtx_row(mtx_vec_prod(RL,tmp)));
	mL3[pt] = tmp[0] * pscal(mtx_vec_prod(RL,tmp),M3);
	// third point
	var pt=2;
	var tmp = [ x1, y0, 1.0 ];
	mtx_set_slice(RLmL3, pt,0, vec_2_mtx_row(mtx_vec_prod(RL,tmp)));
	mL3[pt] = tmp[0] * pscal(mtx_vec_prod(RL,tmp),M3);
	
	info_msg("RLmL3 " + mtx_html(RLmL3) + "mL3 " + mL3);

	// aL, bL, cL
	var tmp = mtx_vec_prod(mtx_inv(RLmL3), mL3);
	var ML = mtx_copy(MR);
	ML[0][0] = tmp[0];
	ML[0][1] = tmp[1];
	ML[0][2] = tmp[2];
	return ML;
}

// Returned value must be as close as possible from 0
function epipolar_projection_fundamental(
	fundamental, 
	img00, 
	img01 ) 
{
	// Search the homography to apply to images

	// Fundamental = U.SV.Vt (singular value decomposition)
	var sv = svdcmp(fundamental);  // retuns U, w, V     and   M  = U.diag(w).trsp(V)
	var U = sv.u;
	var vSV = sv.w, mSV=mtx_diag(sv.w);
	var Vt = mtx_trsp(sv.v);
	
	// Fundamental = RLt.EP.RR (where EP = [ 0 0 0; 0 0 -1; 0 1 0])
	var sv_01 = vSV[0]/vSV[1];
	var sv_21 = vSV[2]/vSV[1]; 
	var RLt = mtx_make(3,3); 
	mtx_set_slice(RLt, 0,0, mtx_get_slice(U, 0,2, 3,1));
	mtx_set_slice(RLt, 0,1, mtx_scalar_prod(mtx_get_slice(U, 0,0, 3,1), Math.sqrt(sv_01)));
	mtx_set_slice(RLt, 0,2, mtx_get_slice(U, 0,1, 3,1));
	var RL = mtx_trsp(RLt);
	var RR = mtx_make(3,3); 
	mtx_set_slice(RR, 0,0, mtx_get_slice(Vt, 2,0, 1,3));
	mtx_set_slice(RR, 1,0, mtx_get_slice(Vt, 1,0, 1,3));
	mtx_set_slice(RR, 2,0, mtx_scalar_prod(mtx_get_slice(Vt, 0,0, 1,3), -Math.sqrt(sv_01)));
	
	info_msg("Smallest singular value SV[2] must be negligible compared to SV[0] and SV[1]. " + sv_21 + " << 0.0"); 
	var EP = [ [ sv_21*0.0, 0, 0 ], [ 0, 0, -1. ], [ 0, 1., 0 ] ]; // sv_21 should be almost zero
	
	var MR = minimize_fundamental2homography_right(RR);
	var ML = minimize_fundamental2homography_left(RL,MR);
	//var ei_hf = MR[1][1]*MR[2][2] - MR[2][1]*MR[1][2];
	var hmtxL = mtx_prod(ML,RL);
	var hmtxR = mtx_prod(MR,RR);

	var tmp = mtx_prod(mtx_prod( mtx_trsp(hmtxL),EP), hmtxR);
	info_msg("fundamental "	+ mtx_html(fundamental) );
	info_msg("trsp(hmtxL)*EP*(hmtxR) "	+ mtx_html(tmp) );
	info_msg("U.SV.Vt "	+ mtx_html(mtx_prod(mtx_prod(U,mSV),Vt)) );
	//info_msg("sigma2.RLt.EP.RR (approximation) ", vSV[1]*(RLt*EP*RR));
	//info_msg("sigma2.(ML.RL)t.EP.(MR.RR).1/ei_hf "		<< vSV[1]*(1/ei_hf)*(RLt*trsp(ML)*EP*MR*RR));
	//info_msg("MLt.EP.MR ([ 0 0 0; 0 0 -1; 0 1 0]) "	<< (1/ei_hf)*(trsp(ML)*EP*MR)); 	

	info_msg("Project first image.");
	var img0b = hmtxProjImg(mtx_inv(hmtxL), img00);
	info_msg("Project second image.");
	var img1b = hmtxProjImg(mtx_inv(hmtxR), img01);

	return { "img": [img0b, img1b], "hmtx": [ hmtxL, hmtxR], "sv_21": sv_21};
}

/*
void camera_xp() {
	bool bDoProjection_ProjMtx = false;
	bool bDoProjection_Fundamental = false;
	
	dmatrix pts00, pts01;
	camera cam00, cam01;
	
	dImg img00 = to_grey_levels(flipUpsideDown(load_image("..\\Data\\face00.jpg")));
	dImg img01 = to_grey_levels(flipUpsideDown(load_image("..\\Data\\face01.jpg")));
	
	// fundamental matrix from 8 pairs of matching points.
	// 00 is left, 01 is right : pts00.F.pts01 = 0
	dmatrix fundamental8 = fundamental_from_8pairs(pts00, pts01);

	// fundamental matrix from projection matrices
	dmatrix fundamentalP8 = fundamental_from_projection_8pts(cam00, cam01);
	dmatrix fundamentalP = fundamental_from_projection(cam00, cam01);
	
	// compare fundamental matrices before correction
	info_msg("Compare fundamental matrices (from pairs and projection matrices) before correction");
	info_msg("fundamental_8 " << fundamental8);
	info_msg("fundamental_P " << fundamentalP);
	info_msg("fundamental_P8 " << fundamentalP8);
	info_msg("Pts8' fundamental_8 Pts8" << endl 
		<< join(diag(pts00 * fundamental8 * trsp(pts01)),", "));
	info_msg("Pts8' fundamental_P Pts8" << endl 
		<< join(diag(pts00 * fundamentalP * trsp(pts01)),", "));
	info_msg("Pts8' fundamental_P8 Pts8" << endl 
		<< join(diag(pts00 * fundamentalP8 * trsp(pts01)),", "));
	
	
	// calculate new projection matrices and apply them to the images (if one of bDoProjection=true)
	epipolar_projection_projmtx(cam00, cam01, img00, img01, bDoProjection_ProjMtx);
	dmatrix hM00=dmatrix(0.0, 3,3), hM01=dmatrix(0.0, 3,3); 
	epipolar_projection_fundamental(fundamental8, img00, img01, hM00, hM01, bDoProjection_Fundamental);
	

	dmatrix fundamental_post = fundamental_from_projection(cam00, cam01);
	info_msg("After correction fundamental matrices");
	info_msg("fundamental_post " << fundamental_post);


	// we save the projection
	//save_image(flipUpsideDown(from_grey_levels(img00)), "../Data/face00_epipolar.jpg");
	//save_image(flipUpsideDown(from_grey_levels(img01)), "../Data/face01_epipolar.jpg");

	// we put them side by side and save it
	info_msg("Assemble side by side reprojected images.");
	
	info_msg("Done.");
}


inline double sq(double a) {return a*a; }


void oliv() {
	
	vector<dmatrix> hmtx;
	//pairs2hpmtx(proj_list, hmtx);

	dmatrix h = hmtx[1];
	double f, sqrt_f, f_stdev, invf, g, sqrt_g, g_stdev, invg;
	{
		// hdht = h.diag(a,b,c).h'  with a=b='k' and c='1'
		double hdht01_a=h[0][0]*h[1][0], hdht01_b=h[0][1]*h[1][1], hdht01_c=h[0][2]*h[1][2];
		double hdht02_a=h[0][0]*h[2][0], hdht02_b=h[0][1]*h[2][1], hdht02_c=h[0][2]*h[2][2];
		double hdht12_a=h[1][0]*h[2][0], hdht12_b=h[1][1]*h[2][1], hdht12_c=h[1][2]*h[2][2];
		double f01 = hdht01_c / (hdht01_a+hdht01_b);
		double f02 = hdht02_c / (hdht02_a+hdht02_b);
		double f12 = hdht12_c / (hdht12_a+hdht12_b);
		f = (f01+f02+f12)/3;
		f_stdev = sqrt( sq(f-f01) + sq(f-f02) + sq(f-f12) ) / f;
		sqrt_f = sqrt(f);
		invf = 1./sqrt_f;
	}
	{
		// htdh = h'.diag(a,b,c).h  with a=b='k' and c='1'
		double htdh01_a=h[0][0]*h[0][1], htdh01_b=h[1][0]*h[1][1], htdh01_c=h[2][0]*h[2][1];
		double htdh02_a=h[0][0]*h[0][2], htdh02_b=h[1][0]*h[1][2], htdh02_c=h[2][0]*h[2][2];
		double htdh12_a=h[0][1]*h[0][2], htdh12_b=h[1][1]*h[1][2], htdh12_c=h[2][1]*h[2][2];
		double g01 = htdh01_c / (htdh01_a+htdh01_b);
		double g02 = htdh02_c / (htdh02_a+htdh02_b);
		double g12 = htdh12_c / (htdh12_a+htdh12_b);
		g = (g01+g02+g12)/3;
		g_stdev = sqrt( sq(g-g01) + sq(g-g02) + sq(g-g12) ) / g;
		sqrt_g = sqrt(g);
		invg = 1./sqrt_g;
	}
	
} 
*/