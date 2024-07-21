
import { Vector2, Vector3, Matrix3x3 } from './surfaces.js'

export function v2<T>(arr: T[]): [T, T] {
	if (arr.length != 2)
		throw new Error("wrong size");
	return [ arr[0], arr[1] ];
}

export function v3<T>(arr: T[]): [T, T, T] {
	if (arr.length != 3)
		throw new Error("wrong size");
	return [ arr[0], arr[1], arr[2] ];
}

export function m3x3<T>(arr: T[][]): [[ T, T, T], [ T, T, T], [ T, T, T]] {
	if (arr.length != 3)
		throw new Error("wrong size");
	return [ v3(arr[0]), v3(arr[1]), v3(arr[2]) ];
}


export function norm(u: number[]) : number
{
	return scalarProduct(u, u);
}

export function scalarProduct(u: number[], v: number[]) : number
{
	var n = u.length;
	if (n != v.length)
		throw new Error("wrong size");

	var p = 0.0;
	for (var i=0; i<n; i++)
		p += u[i]*v[i];
	return p;
}

export function vecAdd2(u: Vector2, v: Vector2) : Vector2
{
	return [ u[0] + v[0], u[1]+v[1] ];
}

export function vecAdd3(u: Vector3, v: Vector3) : Vector3
{
	return [ u[0] + v[0], u[1]+v[1], u[2]+v[2] ];
}

export function vecMult3(u: number, v: Vector3) : Vector3
{
	return [ u*v[0], u*v[1], u*v[2] ];
}

export function vecAdd(u: number[], v: number[]) : number[]
{
	var n = u.length;
	if (n != v.length)
		throw new Error("wrong size");

	var res = new Array(n);
	for (var i = 0; i<n; i++)
		res[i] = u[i] + v[i];
	return res;
}

export function vecMult(u: number, v: number[]) : number[]
{
	var n = v.length;

	var res = new Array(n);
	for (var i = 0; i<n; i++)
		res[i] = u * v[i];
	return res;
}

export function matVecMult(u: number[][], v: number[]) : number[]
{
	var n = u.length, m = u[0].length;
	if (m != v.length)
		throw new Error("wrong size");

	var res = new Array(n);
	for (var i = 0; i<n; i++)
	{
		var tmp = 0.0;
		for (var k = 0; k<m; k++)
			tmp += u[i][k] * v[k];
		res[i] = tmp;
	}
	return res;
}

export function matMult(u: number[][], v: number[][]) : number[][]
{
	var n1 = u.length, m1 = u[0].length;
	var n2 = v.length, m2 = u[0].length;
	if (m2 != n2)
		throw new Error("wrong size");

	var res = new Array(n1);
	for (var i = 0; i<n1; i++)
	{
		res[i] = new Array(m2);
		for (var j = 0; j<m2; j++)
		{
			var tmp = 0.0;
			for (var k = 0; k<m1; k++)
				tmp += u[i][k] * v[k][j];
			res[i][j] = tmp;
		}
	}
	return res;
}

export function trsp(M: number[][]) : number[][]
{
	var n = M[0].length, m = M.length;

	var res = new Array(n);
	for (var i = 0; i<n; i++)
	{
		res[i] = new Array(m);
		for (var j = 0; j<m; j++)
			res[i][j] = M[j][i];
	}
	return res;
}

export function quadraticProduct3(u: Vector3, Q: Matrix3x3, v: Vector3) : number
{
	return u[0]*Q[0][0]*v[0] + u[1]*Q[1][1]*v[1] + u[2]*Q[2][2]*v[2]
		+ u[0]*Q[0][1]*v[1] + u[1]*Q[1][0]*v[0]
		+ u[0]*Q[0][2]*v[2] + u[2]*Q[2][0]*v[0]
		+ u[1]*Q[1][2]*v[2] + u[2]*Q[2][1]*v[1];
}

export function quadraticProduct(u: Vector3, Q: Matrix3x3, v: Vector3) : number
{
	var n = u.length, m = v.length;
	if (n != Q.length || m != Q[0].length)
		throw new Error("wrong size");

	var res = 0;
	for (var i = 0; i<n; i++)
		for (var j = 0; j<m; j++)
			res += u[i] * Q[i][j] * v[j];
	return res;
}
