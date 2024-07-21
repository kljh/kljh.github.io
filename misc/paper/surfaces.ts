
import { Transformation, translate, applyToSegment3d, applyToSurfaceEquation } from './transformations.js';

// Points in 2D and 3D

export type Point2d = [ number, number ];
export type Point3d = [ number, number, number ];

export type Vector2 = [ number, number ];
export type Vector3 = [ number, number, number ];
// export type Vector4 = [ number, number, number, number ];

// export type Matrix2x2 = [ Vector2, Vector2, Vector2 ];
export type Matrix3x3 = [ Vector3, Vector3, Vector3 ];
// export type Matrix3x4 = [ Vector4, Vector4, Vector4 ];
// export type Matrix4x4 = [ Vector4, Vector4, Vector4, Vector4 ];


// Segments [AB] in 2D and 3D

export interface Segment2d
{
	A : Point2d
	AB : Vector2
}

export interface Segment3d
{
	A : Point3d
	AB : Vector3
}


// Common property of all surfaces
// a x^2 + b y^2 + c xy + d x + e y + f = 0
//   or, matrix notations
// P' Q P + L P + C = 0  with Q = [ [ a, c/2 ], [ c/2, b ] ], L = [ d, e ]', C = f
//   or, with homogeneous coordinates
// P' Q P  = 0  with Q 3x3 for 2d, 4x4 for 3d   Q = [ [ Q, L ], [ zero, cste ]]

export interface SurfaceEquation
{
	Q? : Matrix3x3
	L : Vector3
	C : number
}

export interface Surface
{
	// Method implemented by all surfaces
	equation() : SurfaceEquation;
	scad() : string;

	color?: string;
}

export interface RuledSurface extends Surface
{
	// Method implemented by all ruled surfaces
	line3d(x: number) : Segment3d;  // to calculate intersections
	line2d(x: number) : Segment2d;  // to draw intersections on paper
}


// Rectangle ABDC

class Rectangle // implements RuledSurface
{
	constructor(A: Point3d, B: Point3d, C: Point3d)
	{
	}
}

// Cylinder

export class Cylinder implements RuledSurface
{
	radius: number;
	height: number;

	constructor(radius: number, height: number)
	{
		this.radius = radius;
		this.height = height;
	}

	scad() : string
	{
		var height = this.height;
		var r = this.radius;
		var top_radius = this.radius;
		return `cylinder(h = ${this.height}, r = ${this.radius})`;
	}

	equation() : SurfaceEquation
	{
		// cylinder is around z axis, radius r
		// x^2 + y^2 - r^2 = 0
		var Q : Matrix3x3 = [[ 1, 0, 0 ], [ 0, 1, 0 ], [ 0, 0, 0 ]];
		var L : Vector3 = [ 0, 0, 0 ];
		var C : number = - this.radius * this.radius;

		return { Q, L, C };
	}

	// to calculate intersections
	line3d(x: number) : Segment3d
	{
		var a = 2 * Math.PI * x;
		var r = this.radius;
		var A : Point3d = [ r * Math.cos(a), r * Math.sin(a), 0 ];
		var AB : Vector3 = [ 0, 0, this.height ];
		return { A, AB };
	}

	// to draw intersections on paper (3D transformations does not apply)
	line2d(x: number) : Segment2d
	{
		var L = 2 * Math.PI * this.radius;
		var A : Point2d = [ L * x, 0 ];
		var AB : Vector2 = [ 0, this.height ];
		return { A, AB };
	}
}

// Cone

export class Cone implements RuledSurface
{
	radius: number;
	height: number;

	constructor(radius: number, height: number)
	{
		this.radius = radius;
		this.height = height;
	}

	scad() : string
	{
		var height = this.height;
		var bottom_radius = this.radius;
		var top_radius = this.radius;
		return `cylinder(h = ${height}, r1 = ${bottom_radius}, r2 = ${top_radius})`;
	}

	equation() : SurfaceEquation
	{
		// cone is around z axis, radius r at high h
		// x^2 + y^2 - r^2 * (z/h)^2  = 0
		var zc = - this.radius * this.radius /  ( this.height * this.height);
		var Q : Matrix3x3 = [[ 1, 0, 0 ], [ 0, 1, 0 ], [ 0, 0, zc ]];
		var L : Vector3 = [ 0, 0, 0 ];
		var C : number = 0;

		var eq = applyToSurfaceEquation(translate([ 0, 0, this.height ]), { Q, L, C });
		return eq;
	}

	line3d(x: number) : Segment3d
	{
		var a = 2 * Math.PI * x;
		var r = this.radius;

		var xA = r * Math.cos(a),
			yA = r * Math.sin(a);
		var A : Point3d = [ xA, yA, 0 ];
		var AB : Vector3 = [ -xA, -yA, this.height ];
		return { A, AB };
	}

	// to draw intersections on paper (3D transformations does not apply)
	line2d(x: number) : Segment2d
	{
		var R = Math.sqrt(this.height*this.height + this.radius*this.radius);
		var r = this.radius;

		var a = 2 * Math.PI * x * (r / R);

		var xA = -R * Math.cos(a),
			yA = -R * Math.sin(a);
		var A : Point2d = [ xA, yA ];
		var AB : Vector2 = [ -xA, -yA ];
		return { A, AB };
	}
}

// Sphere

export class Sphere implements Surface
{
	radius: number;

	constructor(radius: number)
	{
		this.radius = radius;
	}

	scad() : string
	{
		return `sphere(${this.radius})`;
	}

	equation() : SurfaceEquation
	{
		// cylinder is centered on origin, radius r
		// x^2 + y^2 + z^2 - r^2 = 0
		var Q : Matrix3x3 = [[ 1, 0, 0 ], [ 0, 1, 0 ], [ 0, 0, 1 ]];
		var L : Vector3 = [ 0, 0, 0 ];
		var C : number = - this.radius * this.radius;

		return { Q, L, C };
	}
}

// Apply transformation

export class SurfaceTransfo implements Surface
{
	transfo: Transformation;
	surf: Surface;

	constructor(
		transfo: Transformation,
		surf: Surface )
	{
		this.transfo = transfo;
		this.surf = surf;
	}

	scad() : string
	{
		return `${this.transfo.scad} ${this.surf.scad()})`;
	}

	equation() : SurfaceEquation
	{
		var eq = this.surf.equation();
		return applyToSurfaceEquation(this.transfo, eq);
	}
}

export class RuledSurfaceTransfo implements RuledSurface
{
	transfo: Transformation;
	surf: RuledSurface;

	constructor(
		transfo: Transformation,
		surf: RuledSurface )
	{
		this.transfo = transfo;
		this.surf = surf;
	}

	scad() : string
	{
		return `${this.transfo.scad} ${this.surf.scad()})`;
	}

	equation() : SurfaceEquation
	{
		var eq = this.surf.equation();
		return applyToSurfaceEquation(this.transfo, eq);
	}

	// to calculate intersections
	line3d(x: number) : Segment3d
	{
		var line = this.surf.line3d(x);
		return applyToSegment3d(this.transfo, line);
	}

	// to draw intersections on paper (3D transformations does not apply)
	line2d(x: number) : Segment2d
	{
		var line = this.surf.line2d(x);
		return line;
	}
}
