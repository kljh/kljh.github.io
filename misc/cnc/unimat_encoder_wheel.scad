


module encoder_wheel(D, d, h=1.5, nb=25, L=5, l=2, nh=7, slim=false) 
{
    difference() {
        
        cylinder(r=D/2, h=h);

        for (i = [ 0 : nb ]) {
            rotate([0, 0, i*360/nb])
            translate([ D/2-L, 0, 0])
            cube([ L, l, 3*h], , center=true);
        }
        
        // thiner core
        if (slim) {
            translate([ 0, 0, h/2])
            cylinder(r=D/2-2*L, h=h);
        }
        
        union() {
            
            // central hole
            cylinder(r=d/2, h=3*h, center=true);
        
            for (k = [ 0 : nh]) {
                rotate([0, 0, k*360/nh])
                translate([ D/4, 0, 0])
                cylinder(r=6, h=10, center=true);
            }
        }
    }
}

module draw_encoder()
{
    // spindle is 12mm with 17mm shoulder
    // chuck is 48mm diameter 
    D = 65;
    d = 12.5;
    h = 0.8;
    // holes
    nb = 18;
    L = 5.2;
    l = 1.5;

    encoder_wheel(D, d, h, nb, L, l);
}

draw_encoder();
