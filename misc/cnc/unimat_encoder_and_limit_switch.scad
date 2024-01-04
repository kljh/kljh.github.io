
rpm_switch = false;

// rail saddle
D = 12.5; // with minimal margin
H = rpm_switch ? 11 : 8;
E = rpm_switch ? 4.2: 1.6;  // top edge
e = 1.6;  // side edge

// screw
m = 3;
g = 0.5;  // gap with rail
z = 0.5;

// switch pivots
a = 10;   // distance
d = 2.2;  // diameter
h = 6.5;  // height

// RPM switch dupont connector
c1 = 2.6;
c3 = 3 * c1 + 1; 

if (rpm_switch)
{
    E = 2*e + c;
}

if (false)
{
    union() {
        // rail
        color("red")
        cylinder(r=D/2, h=2*H, center=true, $fn=20);

        // screw
        color("green")
        translate([ 0, D/2+g+m/2, 0 ])
        rotate([ 0, 90, 0 ])
        cylinder(r=m/2, h=3*D, center=true, $fn=20);
    }

    if (rpm_switch)
    {
        translate([ 0, -c1/2-D/2-g, 0 ])
        cube([ 3*D, c1, c3 ], center=true);
    }
}


#difference() 
{
union() {
    // saddle bloc
    
    translate([ -D/2-e, -E-D/2, -H/2 ])
    cube( [ D+2*e, E+D+g+m/2, H ]);

    // saddle bloc around screw
    
    translate([ 0, D/2+g+m/2, 0 ])
    rotate([ 0, 90, 0 ])
    cylinder(r=H/2, h=D+2*e, center=true, $fn=20);


    // switch pivots

    if (!rpm_switch)
    {
        translate([ -a/2, 0, d/2-H/2 ])
        rotate([ 90, 0, 0 ])
        cylinder(r=d/2, h=D/2+E+h, $fn=20);

        translate([ a/2, 0, d/2-H/2 ])
        rotate([ 90, 0, 0 ])
        cylinder(r=d/2, h=D/2+E+h, $fn=20);
    }
    
}
union() {
    
    // rail
    cylinder(r=D/2, h=2*H, center=true, $fn=20);

    // rail passage
    translate([ 0, D, 0 ])
    cube( [ D, 2*D, 2*H ], center=true);

    // screw with half a diameter space with rail
    translate([ 0, D/2+g+m/2, 0 ])
    rotate([ 0, 90, 0 ])
    cylinder(r=z*m/2, h=3*D, center=true, $fn=20);

    // RPM switch dupont connector
    if (rpm_switch)
    {
        translate([ 0, -c1/2-D/2-g, 0 ])
        cube([ 3*D, c1, c3 ], center=true);
    }
}
}
