
import { vecAdd3, vecMult3, scalarProduct, quadraticProduct3 } from './algebra.js'
import { Surface, SurfaceEquation, RuledSurface, Point3d, type Segment3d } from './surfaces.js'

export function intersectionLineSurface(line: Segment3d, surf: Surface)
	: { points : Point3d[], abscissas: number[] }
{
	return intersectionLineSurfaceEquation(line, surf.equation())

}

export function intersectionLineSurfaceEquation(line: Segment3d, eq: SurfaceEquation)
	: { points : Point3d[], abscissas: number[] }
{
	// Surface equation :  p'.Q.p + L.p + C = 0
	// Line equation :  p = o + v.x
	// => scalar 2nd degree equation
	// (v'.Q.v) x^2 + ( 2 o'.Q.v + L.v ) x + ( o'.Q.o + L.o + C ) = 0

	if (!eq.Q)
	{
		// => scalar 1st degree equation
		// L.v x + L.o + C = 0
		var x : number = - ( scalarProduct(eq.L, line.A) + eq.C ) / scalarProduct(eq.L, line.AB);
		var p : Point3d = vecAdd3(line.A, vecMult3(x, line.AB));
		return { points: [ p ], abscissas: [ x ] }
	}
	else
	{
		var a = quadraticProduct3(line.AB, eq.Q, line.AB);
		var b = 2 * quadraticProduct3(line.A, eq.Q, line.AB) + scalarProduct(eq.L, line.AB);
		var c = quadraticProduct3(line.A, eq.Q, line.A) + scalarProduct(eq.L, line.A) + eq.C;
		var det = b*b - 4*a*c;
		if (det<0)
		{
			return { points: [], abscissas: [] };
		}
		else if (det<1e-12)
		{
			var x : number = -b / (2*a);
			var p : Point3d = vecAdd3(line.A, vecMult3(x, line.AB));
			return { points: [ p ], abscissas: [ x ] }
		}
		else
		{
			var x0 : number = ( -b - Math.sqrt(det) ) / ( 2*a );
			var x1 : number = ( -b + Math.sqrt(det) ) / ( 2*a );
			var p0 : Point3d = vecAdd3(line.A, vecMult3(x0, line.AB));
			var p1 : Point3d = vecAdd3(line.A, vecMult3(x1, line.AB));
			return { points: [ p0, p1 ], abscissas: [ x0, x1 ] }
		}
	}
}

export function intersectionRuledSurface(ruledSurf: RuledSurface, surf: Surface, nbSteps: number =25)
{
	var step = 1.0 / nbSteps;
	var x = 0.0;

	for (var iStep=0; iStep < (nbSteps+1); iStep++)
	{
		var line : Segment3d = ruledSurf.line3d(x);
		var inter = intersectionLineSurface(line, surf);

		// console.log(inter);
	}
}
