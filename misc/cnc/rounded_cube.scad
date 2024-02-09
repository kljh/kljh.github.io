

module rounded_cube(size = [ 1, 1, 1 ], center = false, r = 0.5) {
	// if single value, convert to [x, y, z] vector
	size = (size[0] == undef) ? [size, size, size] : size;

	translate = (center == false) ?
		[ r, r, r ] :
		[
			r - (size[0] / 2),
			r - (size[1] / 2),
			r - (size[2] / 2)
        ];

	translate(translate)
	minkowski() {
		cube(size = [
			size[0] - (r * 2),
			size[1] - (r * 2),
			size[2] - (r * 2)
		]);
		sphere(r);
	}
}


module rounded_column(size = [1, 1, 1], center = false, r = 0.5) {
	// if single value, convert to [x, y, z] vector
	size = (size[0] == undef) ? [size, size, size] : size;

    x = size[0] - 2*r;
    y = size[1] - 2*r;
    h = size[2];
    
	translate = (center == false) ?
		[ r, r, 0 ] :
		[
			r - (size[0] / 2),
			r - (size[1] / 2),
			  - h / 2
        ];

	translate(translate)
    hull() {
		translate([ 0, 0, 0 ]) cylinder(r=r, h);
		translate([ x, 0, 0 ]) cylinder(r=r, h);
		translate([ 0, y, 0 ]) cylinder(r=r, h);
		translate([ x, y, 0 ]) cylinder(r=r, h);
	}
}

rounded_cube(20, r=4, center=true);
