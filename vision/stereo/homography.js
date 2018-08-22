/*
	Author: Claude Cochet
	Creation date : 2007-03-17 for C++, version, 2013-01-06 for JS translation.
*/

function hmtxProj(hmtx, pt2) {
	require(pt2.length==2, "hmtxProj(hmtx,pt) expects size(pt)==2");
	
	var ku = hmtx[0][0]*pt2[0] + hmtx[0][1]*pt2[1] + hmtx[0][2];
	var kv = hmtx[1][0]*pt2[0] + hmtx[1][1]*pt2[1] + hmtx[1][2];
	var k  = hmtx[2][0]*pt2[0] + hmtx[2][1]*pt2[1] + hmtx[2][2];

	return [ ku / k, kv / k ];
}


function hmtxProjImg(hmtxinv, img) {
	//if (hmtxinv.length==2)	hmtxinv = hmtxinv[1]; // TO CLEAN we received a matrix and its inverse 
	if (hmtxinv.length==2)	hmtxinv = mtx_inv(hmtxinv[0]); // TO CLEAN we received a matrix and its inverse 
	
	var width=cols(img), 
		height=rows(img);
	var res = mtx_make(width,height);
	for (var u=0; u<width; u++) {
		for (var v=0; v<height; v++) {
			// calculation done on x, y but display in i,j
			var pt = hmtxProj(hmtxinv, [ u, (height-1)-v ]);
			pt = [ Math.round(pt[0]), Math.round(pt[1]) ];
			
			
			if ( pt[0]<0 || pt[0]>width-1 || pt[1]<0 || pt[1]>height-1 )
				res[u][v] = 0;
			else
				//res[u][v] = img[pt[0]][pt[1]];
				res[u][v] = img[pt[1]][pt[0]];
		}
	}
	
	var res2 = mtx_make(width,height);
	for (var u=0; u<width; u++) 
		for (var v=0; v<height; v++) 
			res2[(height-1)-u][v] = res[v][u];
	return res2;
}

/*
void hmtxProj(const dmatrix& hmtx, 
		double u0, double v0,
		double& u1, double& v1
) {
	dmatrix v = dmatrix(0.0, 3,1);
	v[0][0]=u0; v[1][0]=v0; v[2][0]=1.0;

	v = hmtx * v;
	u1 = v[0][0]/v[2][0];
	v1 = v[1][0]/v[2][0];
}


void hmtx2invariants(const dmatrix& hmtx, 
		double& u, double& v,
		double& p, double& q, double& r
) {

	// intersection point of Doo & Dx
	dmatrix hi = inv(hmtx);
	u = hi[0][0]*hi[2][0]+hi[0][1]*hi[2][1];
	v = hi[1][0]*hi[2][0]+hi[1][1]*hi[2][1];
	double d = hi[2][0]*hi[2][0]+hi[2][1]*hi[2][1];
	u /= d;
	v /= d;

	// equation Doo
	p = hmtx[2][0];
	q = hmtx[2][1];
	r = hmtx[2][2];
	d = sqrt(p*p+q*q);
	p/=d;
	q/=d;
	r/=d;
}

namespace {	double sq(double x) { return x*x; } }

double hmtx2doo(const dmatrix& hmtx) {
	
	// Direction of P1oo,Q0ooProjOn1 >
	// Q0oo is 'unit' above P0oo

	double u0,v0,p0,q0,r0;
	hmtx2invariants(hmtx,u0,v0,p0,q0,r0);
	
	double unit=13; 
	dmatrix P0oo(3,1), Q0oo(3,1); 
	P0oo[0][0]=u0; P0oo[1][0]=v0-p0; P0oo[2][0]=1.;
	Q0oo[0][0]=u0+unit*q0; Q0oo[1][0]=v0-unit*p0; Q0oo[2][0]=1.;
	
	// Q0ooProjOn1 is at infinity
	dmatrix Q0ooProjOn1 = hmtx * Q0oo;
	double must_be_zero = Q0ooProjOn1[2][0];

	// Direction of P1oo,P01 > is given by (p1,q1)

	dmatrix hi = inv(hmtx);
	double u1,v1,p1,q1,r1;
	hmtx2invariants(hi,u1,v1,p1,q1,r1);

	// Angle gamma = P01,P1oo,P0ooProjOn1 ^
	// is given by cos(gamma)
	double cosg = Q0ooProjOn1[0][0]*p1 + Q0ooProjOn1[1][0]*q1;
	cosg /= sqrt(sq(Q0ooProjOn1[0][0])+sq(Q0ooProjOn1[1][0]) * sqrt(sq(p1)+sq(q1)));
	double gamma = acos(cosg);

	// We also have tang = unit/d
	double doo = unit*cosg / sqrt(1-sq(cosg)); // = 1/tan(gamma);
	return doo;
}

void hmtxdoo2dABC01(const dmatrix& hmtx, double doo, 
		double& d0a, double& d0b, double& d0c, 
		double& d1a, double& d1b, double& d1c,
		double direction
) {
	if (direction==0.) {
		Xthrow("Choisis ton camp;");
	} else {
		double u0,v0,p0,q0,r0;
		hmtx2invariants(hmtx,u0,v0,p0,q0,r0);
		double u1,v1,p1,q1,r1;
		hmtx2invariants(inv(hmtx),u1,v1,p1,q1,r1);
		
		doo *= direction;
		double u0a, v0a, u0b, v0b, u0c, v0c;
		u0a = u0 + p0*doo;
		v0a = v0 + q0*doo;
		u0b = u0 + p0*doo/2;
		v0b = v0 + q0*doo/2;
		u0c = u0 + 2*p0*doo;
		v0c = v0 + 2*q0*doo;
		
		double u1a, v1a, u1b, v1b, u1c, v1c;
		hmtxProj(hmtx, u0a, v0a, u1a, v1a);
		hmtxProj(hmtx, u0b, v0b, u1b, v1b);
		hmtxProj(hmtx, u0c, v0c, u1c, v1c);
		// these ones must be (.5,1,2)*doo
		d0a = sqrt(sq(u0a-u0)+sq(v0a-v0));
		d0b = sqrt(sq(u0b-u0)+sq(v0b-v0));
		d0c = sqrt(sq(u0c-u0)+sq(v0c-v0));
		// these one are critical 
		d1a = sqrt(sq(u1a-u1)+sq(v1a-v1));
		d1b = sqrt(sq(u1b-u1)+sq(v1b-v1));
		d1c = sqrt(sq(u1c-u1)+sq(v1c-v1));
	}
}

*/

function hmtxProjectionBoundaries(hmtx, srcb) {
	if (hmtx.length==2)	hmtx = hmtx[0]; // TO CLEAN we received a matrix and its inverse 
	
	var dst = hmtxProj(hmtx, [srcb.min_x, srcb.min_y]);
	var outb = { min_x: dst[0], max_x: dst[0], min_y:dst[1], max_y: dst[1] };
	
	var dst = hmtxProj(hmtx, [srcb.max_x, srcb.min_y]);
	outb.min_x = Math.min(outb.min_x, dst[0]);
	outb.max_x = Math.max(outb.max_x, dst[0]);
	outb.min_y = Math.min(outb.min_y, dst[1]);
	outb.max_y = Math.max(outb.max_y, dst[1]);

	var dst = hmtxProj(hmtx, [srcb.min_x, srcb.max_y]);
	outb.min_x = Math.min(outb.min_x, dst[0]);
	outb.max_x = Math.max(outb.max_x, dst[0]);
	outb.min_y = Math.min(outb.min_y, dst[1]);
	outb.max_y = Math.max(outb.max_y, dst[1]);

	var dst = hmtxProj(hmtx, [srcb.max_x, srcb.max_y]);
	outb.min_x = Math.min(outb.min_x, dst[0]);
	outb.max_x = Math.max(outb.max_x, dst[0]);
	outb.min_y = Math.min(outb.min_y, dst[1]);
	outb.max_y = Math.max(outb.max_y, dst[1]);

	return outb;
}

function hmtxProjectionBoundariesAdapt(hmtx, inb, outb) {
	if (hmtx.length==2)	hmtx = hmtx[0]; // TO CLEAN we received a matrix and its inverse 
	
	// Input boundaries are typically {{0,width}{0,height}}
	// Output boundaries are {{min_x,max_x}{min_y,max_y}}
	// Given hMtx is modified to output into same boundaries than input.

	var transf = mtx_make(3,3);
	transf[0][0] = (inb.max_x-inb.min_x)/(outb.max_x-outb.min_x);  // xRescale
	transf[1][1] = (inb.max_y-inb.min_y)/(outb.max_y-outb.min_y);  // yRescale
	transf[0][2] = - outb.min_x * transf[0][0] + inb.min_x;  // xOffset
	transf[1][2] = - outb.min_y * transf[1][1] + inb.min_y;  // yOffset
	transf[2][2] = 1.0;

	// transf now store the projection from the new hmtx
	transf = mtx_prod(transf, hmtx);
	return [ transf, mtx_inv(transf) ];
}
