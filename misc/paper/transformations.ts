
import { Point3d, Vector3, Matrix3x3, type Segment3d, SurfaceEquation } from './surfaces.js'
import { v3, m3x3, vecAdd, vecMult, matVecMult, matMult, quadraticProduct, trsp } from './algebra.js'

export interface TransformationMatrix
{
	R: Matrix3x3
	t: Vector3
}

export interface Transformation extends TransformationMatrix
{
	scad: string
}

const id3 : Matrix3x3 = [
	[ 1, 0, 0 ],
	[ 0, 1, 0 ],
	[ 0, 0, 1 ]];

const zero3 : Vector3 =
	[ 0, 0, 0 ];

function cos(deg) { return Math.cos(Math.PI * deg / 180); }
function sin(deg) { return Math.sin(Math.PI * deg / 180); }

export function origin() : Transformation
{
	return { R: id3, t: zero3, scad: "" };
}

export function translate(t: Vector3) : Transformation
{
	return { R: id3, t, scad: `translate(${JSON.stringify(t)})` };
}

export function rotate(deg_xyz: Vector3) : Transformation
{
	// deg_xyz
	// rotation around multiple axes in the following order: x then y then z.
	// That means the code:
	//   rotate(a=[ax,ay,az]) {...}
	// is equivalent to:
	//   rotate(a=[0,0,az]) rotate(a=[0,ay,0]) rotate(a=[ax,0,0]) {...}

	function rot_ek(k) : number[][] {
		var deg = deg_xyz[k];
		var c = cos(deg);
		var s = sin(deg);

		var R = [
			[ 0, 0, 0 ],
			[ 0, 0, 0 ],
			[ 0, 0, 0 ]];

		var k1 = (k+1) % 3;
		var k2 = (k+2) % 3;
		R[k][k] = 1;
		R[k1][k1] = c;    R[k1][k2] = -s;
		R[k2][k1] = s;    R[k2][k2] = c;

		return R;
	}

	var R = matMult(matMult(rot_ek(2), rot_ek(1)), rot_ek(0));

	return { R: m3x3(R), t: zero3, scad: `rotate(${JSON.stringify(deg_xyz)})` };
}

export function applyToPoint(transfo: Transformation, m: Point3d) : Point3d
{
	return v3( vecAdd( matVecMult( transfo.R, m ), transfo.t ));
}

export function applyToVector(transfo: Transformation, v: Vector3) : Vector3
{
	// f(AB) = f(B) - f(A) = (RB+t) - (RA+t) = R(AB)
	return v3(matVecMult( transfo.R, v ));
}

export function applyToSegment3d(transfo: Transformation, line: Segment3d) : Segment3d
{
	var A : Point3d = applyToPoint(transfo, line.A);
	var AB : Vector3 = applyToVector(transfo, line.AB);
	return { A, AB };
}

export function applyToSurfaceEquation(transfo: Transformation, eq: SurfaceEquation) : SurfaceEquation
{
	// Transformation applied to solid :
	// new = R.old + t
	// => old = R'.(new-t)

	// Coordinates where true for old coordinates
	// so if for m in new coordinates
	//   (m-t)'RQR'(m-t) + L.R'(m-t) + C = 0
	//   m' RQR' m  + ( -2RQR't + RL ).m  +  ( -L'R't + C ) =0
	// Note on scalar products :
	//   L.R'm = L'R'm = (RL)'m = RL.M
	//   L.R't = L'R't

	var { R, t } = transfo;

	var Q = m3x3(matMult(matMult( R, eq.Q ), trsp(R)));
	var L = v3(vecAdd( vecMult( -2, matVecMult(Q, t) ), matVecMult( R, eq.L) ));
	var C = - quadraticProduct(eq.L, R, t) + eq.C;

	return { Q, L, C};
}

export function combine(transfos: Transformation[]) : Transformation
{
	// [[ Ra, ta ], [ 0, 1 ]] . [[ Rb, tb ], [ 0, 1 ]] = [[ Ra.Rb, Ra.tb + ta ], [ 0, 1]

	var R : Matrix3x3 = id3;
	var t : Vector3 = zero3;
	var scad : string = "";
	for (var transfo of transfos) {
		R = m3x3(matMult( R, transfo.R ));
		t = v3(vecAdd( matVecMult( R, transfo.t ), t));
		scad = `${scad} ${transfo.scad}`;
	}
	return { R, t, scad };
}
