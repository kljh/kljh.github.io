
import { Segment3d, Cylinder, Cone, RuledSurfaceTransfo } from './surfaces.js'
import { intersectionLineSurface } from './intersections.js'
import { translate, rotate } from './transformations.js'
import { generate } from './svg.js'
import * as fs from 'fs';

export function test()
{
	var line : Segment3d = { A: [ 0, 0, 0 ], AB: [ 0.5, 1, 1 ]}

	var cyl = new Cylinder(2, 10);
	var cyl2 = new RuledSurfaceTransfo(translate([ 0, 0, -5 ]), cyl);
	var cyl3 = new RuledSurfaceTransfo(rotate([ 60, 0, 0 ]), cyl2);

	var cone = new Cone(3, 10);
	var cone2 = new RuledSurfaceTransfo(translate([ 2, 0, 0 ]), cone);

	if (false)
	{
		console.log("Transformations:");
		console.log("translate([ 0, 0, -5 ])\n", translate([ 0, 0, -5 ]));
		console.log("rotate([ 60, 0, 5 ])\n", rotate([ 60, 0, 5 ]));

		console.log()

		console.log("Surfaces transformations:");
		console.log("cyl.line3d(0.25)\n", cyl.line3d(0.25));
		console.log("cyl2.line3d(0.25)\n", cyl2.line3d(0.25));
		console.log("cyl3.line3d(0.25)\n", cyl3.line3d(0.25));

		console.log("cyl.scad()\n", cyl.scad());
		console.log("cyl2.scad()\n", cyl2.scad());
		console.log("cyl3.scad()\n", cyl3.scad());

		console.log("cyl.equation()\n", cyl.equation());
		console.log("cyl2.equation()\n", cyl2.equation());
		console.log("cyl3.equation()\n", cyl3.equation());

		console.log()

		console.log("Intersections:");
		console.log("inter(cyl, line)\n", intersectionLineSurface(line, cyl));
	}

	var svg = generate(cyl2, [ cyl3 ]);
	fs.writeFileSync("cyl.svg", svg, "utf8");

	var svg = generate(cone2, [ cyl ]);
	fs.writeFileSync("cone.svg", svg, "utf8");

}

test();
