
use <rounded_cube.scad>

$fn = 36;

rRail = 4;       // diam 8mm
rCorner = 1;
hClip = 3.5;
wClip = 11;


difference() {
    rounded_column([ wClip, wClip, hClip ], r=rCorner, center=true);
    
    translate([ 0.3*wClip, 0, 0] )
    cylinder(r=rRail, h=hClip*3, center=true);

    translate([ -0.3*wClip, 0.0*wClip, 0] )
    rounded_column([ 0.2*wClip, 0.75*wClip, hClip*3 ], r=rCorner, center=true);
    
    translate([ -0.3*wClip, -0.5*wClip, 0] )
    cube([ 0.04*wClip, 0.8*wClip, hClip*3 ], center=true);
    
}
