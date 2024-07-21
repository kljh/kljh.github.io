

import { Point2d, Segment2d, type Segment3d, Surface, RuledSurface } from './surfaces.js'
import { vecAdd2 } from './algebra.js'
import { intersectionLineSurface } from './intersections.js'

interface BoundingBox
{
	minx, miny, maxx, maxy : number
}

export function generate(surf: RuledSurface, intersects: Surface[], nbSteps: number = 50)
{
	var svg: string = "";

	var step = 1.0 / nbSteps;
	var w = 0.0;
	var bb : BoundingBox = { minx: 0.0, miny: 0.0, maxx: 0.0, maxy: 0.0 };
	for (var iStep=0; iStep < (nbSteps+1); iStep++, w += step)
	{
		var line : Segment2d = surf.line2d(w);

		bb = updateBoundingBox(bb, line.A);
		bb = updateBoundingBox(bb, vecAdd2(line.A, line.AB));

		svg += `    <line x1="${line.A[0]}" y1="${line.A[1]}" x2="${line.A[0]+line.AB[0]}" y2="${line.A[1]+line.AB[1]}" />\n`
	}

	var width = bb.maxx-bb.minx, height = bb.maxy-bb.miny;
	var margin = 0.04;
	var stroke = 0.001 * width;
	svg = `  <g stroke="grey" stroke-width="${stroke}">\n\n${svg}\n  </g>\n`;

	var r = 0.005 * width;

	for (var intersect of intersects)
	{

		var svg2: string = "";
		for (var iStep=0, w=0.0; iStep < (nbSteps+1); iStep++, w += step)
		{
			var line2 : Segment2d = surf.line2d(w);
			var line3 : Segment3d = surf.line3d(w);
			var inter = intersectionLineSurface(line3, intersect);

			for (var u of inter.abscissas) {
				var x = line2.A[0] + u * line2.AB[0];
				var y = line2.A[1] + u * line2.AB[1];
				svg2 += `    <circle cx="${x}" cy="${y}" r="${r}" />\n`;
			}
		}
		svg2 = `  <g stroke="black" stroke-width="${stroke}" fill="none">\n\n${svg2}\n  </g>\n`;

		svg = `${svg}\n${svg2}`
	}

	svg = `<svg viewBox="${bb.minx-width*margin} ${bb.miny-height*margin} ${width*(1+2*margin)} ${height*(1+2*margin)}" xmlns="http://www.w3.org/2000/svg">\n\n${svg}\n</svg>`;
	return svg;
}

function updateBoundingBox(bb: BoundingBox, pt: Point2d)
{
	bb.minx = Math.min(bb.minx, pt[0]);
	bb.miny = Math.min(bb.minx, pt[1]);
	bb.maxx = Math.max(bb.minx, pt[0]);
	bb.maxy = Math.max(bb.minx, pt[1]);
	return bb;
}
