
use <rounded_cube.scad>

$fn = 36;

GT2D = 18.5;    // puller diameter
GT2W = 8.5;     // puller width
GT2d = 5;       // pulley axis diameter
GT2g = 1.0;     // pulley gap
thickness = 2;  // wall thickness

dScrews = 36.5; // distance between screws
dScrew = 3;     // screw diameter
dNut = 5.4;     // nut diameter (between faces)
hNut = 2;       // nut height

module outer_hull(L = dScrews+10, l = 8, 
    w = GT2W + 2 * GT2g + 2*thickness, 
    h = GT2D + 2 * GT2g , 
    r = thickness)
{
    l = l - 2*r;
    
    hull()
    {
        translate([ -L/2, 0, -h/2 ])
        rotate([ 90, 0, 0 ])
        cylinder(h=w, r=r, center=true);

        translate([ +L/2, 0, -h/2 ])
        rotate([ 90, 0, 0 ])
        cylinder(h=w, r=r, center=true);

        rotate([ 90, 0, 0 ])
        cylinder(h=w, r=GT2D/2, center=true);

        /*
        translate([ -l/2, 0, h/2 ])
        rotate([ 90, 0, 0 ])
        cylinder(h=w, r=r, center=true);

        translate([ +l/2, 0, h/2 ])
        rotate([ 90, 0, 0 ])
        cylinder(h=w, r=r, center=true);
        */
    }
}

module inner_space(
    r = 2*GT2g) 
{
    hMult = 5;
    
    rotate([ 90, 0, 0 ])
    minkowski() {
        cylinder(r = GT2D/2, h = GT2W, center=true);
        scale([ hMult, hMult, 1 ]) 
            sphere(r = GT2g);
    }
    
    h = GT2D + 2 * GT2g - 2 * hNut;
    w = GT2W + 2 * GT2g; 

    rotate([ 0, 90, 0 ])
    rounded_column([ h, w, 99 ], center=true, r=2);
}

module screws_holes(rAxis=GT2d/2) 
{
    // screws
    
    translate([ -dScrews/2, 0, -GT2D/2])
    nut();
    
    translate([ +dScrews/2, 0, -GT2D/2 ])
    nut();
    
    // ball bearing axis
    
    rotate([ 90, 0, 0 ])
    cylinder(h=99, r=rAxis, center=true);    
}

module nut(dScrew = 3, dNut = 5.4, hNut = 2)
{
    union() {
        rotate([ 0, 0, 30 ]) 
        intersection() {
            rotate([ 0, 0,  0  ]) cube([ dNut, 5*dNut, hNut ], center=true);
            rotate([ 0, 0, 120 ]) cube([ dNut, 5*dNut, hNut ], center=true);
            rotate([ 0, 0, 240 ]) cube([ dNut, 5*dNut, hNut ], center=true);
        }
        
        rScrew = 1.8;
        cylinder(h=99, r=dScrew/2, center=true);
    }
}

translate([ 0, 0, GT2D/2+GT2g+thickness ])
{
    difference() {
        outer_hull();
        screws_holes();
        inner_space();
    }

    // if (false) 
    {
        rotate([ 90, 0, 0 ])
        %cylinder(r=GT2D/2, h=GT2W, center=true);
    }
}

