
use <rounded_cube.scad>

$fn = 36;

// Delta printer slide (x3)

DW = 61.0;      // distance between rails
HD = 20;        // holder diameter
BW = HD - 5;    // base width 
BH = 4.0;       // base height
WW = 3.0;       // wall width

// GT2 belt (6mm)
GT2D = 18.5;    // puller diameter
GT2W = 9;       // holes width
GT2H = 3;       // holes size (narrow fit)

// Linear bearings
LBOD = 15.5;    // outer diameter
LBID = 8;       // inner diameter
LBH = 24;       // height
LBNH = 4;       // height (from ends) for notch

// Hex pivots
HL = 40;        // parallelogram width
HW = 9.0;
HOD = 6;        // axis inner diameter (M3)
HID = 3;        // axis inner diameter (M3)


module slide() {

    translate([ -DW/2, 0, 0 ])
    linear_bearing_holder();

    translate([ DW/2, 0, 0 ])
    linear_bearing_holder();

    central_beam();
    
    hex_arms_pivots();
    
}

module linear_bearing_holder() {
    difference() {
        cylinder(r=HD/2, h=LBH);
        cylinder(r=LBOD/2, h=LBH);
    }
    
    translate([ 0, 0, LBNH ])
    torus(R=LBOD/2, r=0.5);

    translate([ 0, 0, LBH-LBNH ])
    torus(R=LBOD/2, r=0.5);

}

module torus(R=10, r=1) {
    rotate_extrude() // convexity = 10)
    translate([R, 0, 0])
    circle(r, $fn = 40);    
}

module central_beam() {

    difference() {

        union() {

            // base (narrow)
            translate([ -DW/2, -BW/2, 0 ])
            cube([ DW, BW, BH ]);

            // base (bearing holder width)
            translate([ -DW/2, -HD/2, 0 ])
            cube([ DW, HD/2, BH ]);

            // bridge wall
            translate([ -DW/2, -GT2W/2-WW, 0 ])
            cube([ DW, WW, LBH ]);
           
            // rounded fillet with wall
            
            rounded_filet();

            scale([ -1, 1, 1])
            rounded_filet();
            
        }
        
        union() {
            
            // linear bearing space

            translate([ -DW/2, 0, 0 ])
            cylinder(r=LBOD/2, h=LBH);
            
            translate([ DW/2, 0, 0 ])
            cylinder(r=LBOD/2, h=LBH);
                    
            // GT2 belt holes (wide)
            
            D = GT2D - 1.5*GT2H;
            
            translate([ D/2, 0, 0 ])
            rounded_column([ 2*GT2H, GT2W, 2*BH ], center=true, r=1);

            // GT2 belt holes (narrow x2)
            
            translate([ -D/2-0.8*GT2H, 0, 0 ])
            rounded_column([ GT2H, GT2W, 2*BH ], center=true, r=1);
            
            translate([ -D/2+0.8*GT2H, 0, 0 ])
            rounded_column([ GT2H, GT2W, 2*BH ], center=true, r=1);
        }
    }
}

module rounded_filet() {
    r = GT2W/2;
    translate([ DW/2-HD/2-r, 0, 0 ])
    difference() {
        translate([ 0, -r, 0 ])
        cube([ 2*r, r, LBH ]);
        cylinder(r=r, h=LBH);
    }
}

// Hex pivots
module hex_arms_pivots()
{   
    epsilon = 0;
    
    translate([ 0, -HD/2-HW, HOD/2 ])
    {
        difference() {
            
            union() {
                    
                translate([ -HL/2, 0, -HOD/2 ])
                cube([ HL, HW, BH ]);
                
                rotate([ 0, 90, 0 ])
                cylinder(r=HOD/2, h=HL, center=true);    
                
            }
            
            union() {
                
                rotate([ 0, 90, 0 ])
                cylinder(r=HID/2, h=HL-epsilon, center=true);
                
            }
        }
    }

    // if (false)
    translate([ 0, -HD/2, 0 ])
    {

        R = HW - 3*HID/2;
        L = HL + 2* R;
        
        translate([ 0, -R, 0 ])

        difference() {
            
            translate([ -L/2, 0, 0 ])
            cube([ L, R, BH ]);
            
            union() {
                translate([ -L/2, 0, 0 ])
                cylinder(r=R, h=3*HL, center=true);    

                translate([ +L/2, 0, 0 ])
                cylinder(r=R, h=3*HL, center=true);
            }
        }

    }
}

// truncating the whole stuff 

difference()
{
    intersection() {
        slide();
        cube([DW+8,250,250], center=true);
    }

    Rcut = 40;
    translate([ 0, 0, Rcut+15 ])
    rotate([ 90, 0, 0 ])
    cylinder(r=Rcut, h=100, center=true);
}
