
use <rounded_cube.scad>

$fn = 36;

// to print upside down

module nema_motor_clamp(
    clamp_width = 15,
    clamp_adjust = 6,
    screw_diam = 6.5,
    support_width = 51.5,
    h = 4.0  // > support_thickness (typ 4.0)
    )
{
    epsilon = 1;
    
    translate([ 0, 0, h/2 ])
    difference()
    {
        R = clamp_width / 2;
        L = support_width + 2*clamp_width + 2*epsilon + clamp_adjust;
        
        rounded_column([ 2*R, L, h ], r=R, center=true);

        r = screw_diam / 2;
        l = 2*r + clamp_adjust;
        y = support_width/2 + clamp_adjust + epsilon;
        
        translate([ 0, -y, 0 ])
        rounded_column([ 2*r, l, h ], r=r, center=true);

        translate([ 0, +y, 0 ])
        rounded_column([ 2*r, l, h ], r=r, center=true);
    }
}

module nema_motor_support(
    support_width = 51.5,     // measured: 50
    support_thickness = 2.5,  // measured: 2.5
    slot_width = 3.25,        // measured: 4
    slot_dist = 31.25,        // measured: 30
    slot_length = 34,
    hole_diameter = 22.5 )
{
    L = support_width;
    h = support_thickness;
    r = 1.5;
    
    l = slot_length;
    w = slot_width;
    
    epsilon = 0.5;
        
    translate([ 0, 0, h/2 - epsilon ])
    difference() {
        cube([ L, L, h ], center=true);
        translate([ 0, -slot_dist/2, 0 ])
            rounded_column([ l, w, h], center=true, r=r);
        translate([ 0, +slot_dist/2, 0 ])
            rounded_column([ l, w, h], center=true, r=r);
    }
    
    translate([ L/2+h/2, 0, L/2 ])
    rotate([ 0, 90, 0 ])
    difference() {
        cube([ L, L, h ], center=true);
        cylinder(r = hole_diameter/2, h = 3*h, center=true);
    }
}

difference() {
    nema_motor_clamp();
    nema_motor_support();
}

%nema_motor_support();
