$fa = 6; // minimum angle, default 12deg
$fs = 0.5; // minimum size default 2 mm

onlyOne = true;

dHousing = 24;
thickness = 3;
dScrew = 3.4;  // M3
gap = 1.2;
h0 = 9;

armLength = 25;
armWidth = 3;

switchLength = 14;
switchWidth = 6+1;
switchHeight = 7;
switchHoleDiam = 2;
switchHoleSpace = 5;

holderWalls = 1.5;
holderLength = switchLength + 2*holderWalls;
holderWidth = switchWidth + 2*holderWalls;
holderShoulderHeight = switchHeight + 5;
holderShoulderLength = 7;

R = dHousing/2 + thickness + 1.8*dScrew;
r = dHousing/2 + thickness + 0.8*dScrew;

module switch_holder() {
    union() {
        // holder arm
        translate([ 0, -armWidth/2, 0 ]) 
            cube([ armLength+1, armWidth, h0/2 ]);
        
        // holder itself
        translate([ armLength, 0, 0 ]) 
        intersection() {
            difference() {
                union() {
                    translate([ 0, holderWidth/2, 0 ]) 
                    rotate([ 90, 0, 0 ])
                        linear_extrude(height = holderWidth)
                            polygon(points = [[ 0, 0 ], 
                                [ holderLength, 0], 
                                [ holderLength, 5 ],
                                [ holderShoulderLength, 5 ], 
                                [ 4, holderShoulderHeight ], 
                                [ 0, holderShoulderHeight ]]);
                    
                }
                
                union() {
                    translate([ holderWalls, -switchWidth/2, 0.5 ]) 
                        cube([ switchLength, switchWidth, switchHeight*2 ]);
                    translate([ holderLength/2, 0, -1 ]) 
                        cylinder(h=3, d=switchHoleDiam);
                    translate([ holderLength/2-switchHoleSpace, 0, -1 ]) 
                        cylinder(h=3, d=switchHoleDiam);
                    translate([ holderLength/2+switchHoleSpace, 0, -1 ]) 
                        cylinder(h=3, d=switchHoleDiam);
                }
            }
            
            translate([ holderWalls, -switchWidth/2, -2*holderWalls ]) 
                linear_extrude(height = switchHeight*3)            
                    offset(r=holderWalls)
                        square([ switchLength, switchWidth ]);

        }
    }
}


module screw_join_add() {
    
    translate([ 0, -thickness-gap/2, 0 ]) 
        cube([ R, 2*thickness+gap, h0 ]);
    
}

module screw_join_remove() {
    translate([ 0, -gap/2, -h0 ]) cube([ R+1, gap, 3*h0 ]);
    rotate([ 90, 0, 0 ]) 
        translate([ r, 2*h0/3, -2*thickness ]) 
        cylinder(h=4*thickness, d=dScrew);
}

module laser_attachment() {
    difference() {

        union() {
            cylinder(h=h0, d=dHousing+2*thickness);
            rotate([ 0, 0, +120 ]) switch_holder();
            rotate([ 0, 0,  0.0 ]) switch_holder();
            rotate([ 0, 0, -120 ]) switch_holder();
            rotate([ 0, 0, +60 ]) screw_join_add();
            rotate([ 0, 0, 180 ]) screw_join_add();
            rotate([ 0, 0, -60 ]) screw_join_add();         
        }

        union() {
            translate([0, 0, -h0]) cylinder(h=h0*3, d=dHousing);
            rotate([ 0, 0, +60 ]) screw_join_remove();
            rotate([ 0, 0, 180 ]) screw_join_remove();
            rotate([ 0, 0, -60 ]) screw_join_remove();

            if (onlyOne) {
                rotate([ 0, 0, +60 ]) translate([ -100, 0, -1]) 
                    cube([ 200, 100, 100 ]);
                rotate([ 0, 0, +120 ]) translate([ -100, 0, -1]) 
                    cube([ 200, 100, 100 ]);
            }
        }
    }
}

module cage_disk() {
    
    translate([0, 0, switchHeight]) 
    color([ 0.5,0.5,0, 0.2])
    union() {
        difference() {
            cylinder(h=1, 
                r=armLength+holderLength);
        
            union() {
                translate([0, 0, -1])
                    cylinder(h=3, 
                        r=armLength+gap+holderShoulderLength);
                
                x = armLength+holderShoulderLength
                    +(holderLength-holderShoulderLength)/2;
                for (a = [1:8]) 
                    rotate([ 0, 0, 45*a ])
                    translate([ x, 0, -1 ]) 
                        cylinder(h=3, d=3);

            }
        }
        
        c = 2;
        x = armLength+holderShoulderLength+gap;
        for (a = [1:24]) 
            rotate([ 0, 0, 15*a ])
            translate([ x, 0, 0 ]) 
                rotate([ 0, 0, 45 ])
                    cube([ c, c, 0.5], center=true);
    }    
}

laser_attachment();

if (!onlyOne)
    cage_disk();
