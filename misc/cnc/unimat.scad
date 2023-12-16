
module spindle(spindle_diam = 35, spindle_len=120, 
    shoulder_diam=17, shoulder_len=10, 
    thread_diam=12, thread_len=10, 
    pulley_diam=12, pulley_len=15)
{
    color("red", 0.5)
    union()
    {
        rotate([ -90, 0, 0 ])
        cylinder(d=spindle_diam, h=spindle_len);

        rotate([ -90, 0, 0 ])
        cylinder(d=shoulder_diam, h=spindle_len+shoulder_len);
        
        rotate([ -90, 0, 0 ])
        cylinder(d=thread_diam, h=spindle_len+shoulder_len+thread_len);

        translate([ 0, -pulley_len, 0 ])
        rotate([ -90, 0, 0 ])
        cylinder(d=pulley_diam, h=spindle_len);
    }    
}
    
module bed(bars_len=400, bars_diam=12) 
{
    union()
    {
        translate([ -20, 0, 0 ])
        rotate([ -90, 0, 0 ])
        cylinder(d=bars_diam, h=bars_len);

        translate([ +20, 0, 0 ])
        rotate([ -90, 0, 0 ])
        cylinder(d=bars_diam, h=bars_len);
    }
    
}

module carriage(w=60, h=28)
{
    x0 = -30;
    x1 = +30;
    x2 = +80;
    x3 = +84;
    
    z1 = 1;
    z2 = 8;
    z3 = 28;
    
    y_bars = w/3;
    bars_len = x3-x0;
    bars_diam = 6;
    
    color("blue", 0.5)
    union()
    {
        translate ([ 0, -w/2, 0 ])
        union()
        {
            translate([ x0, 0, -z2 ])
            cube([ x3-x0, w, z2-z1 ]);

            translate([ x0, 0, z1 ])
            cube([ x3-x0, w, z2-z1 ]);

            translate([ x1, 0, -z2 ])
            cube([ x3-x1, w, 2*z2 ]);

            translate([ x2, 0, -z2 ])
            cube([ x3-x2, w, z3+z2 ]);
        }
        
        translate([ x0, -y_bars, (z2+z3)/2 ])
        rotate([ 0, 90, 0 ])
        cylinder(d=bars_diam, h=bars_len);

        translate([ x0, +y_bars, (z2+z3)/2 ])
        rotate([ 0, 90, 0 ])
        cylinder(d=bars_diam, h=bars_len);
    }   
}

module cross_slide(l=50, w=60, h=20)
{   
    eps = 1;
    
    t_slot_depth = 5;
    t_slot_height = 2;
    t_slot_wide = 6;
    t_slot_narrow = 3;
    
    color("green", 0.5)
    translate ([ 0, -w/2, 0 ])
    difference()
    {
        translate ([ -l/2, 0, -h ])
        cube([ l, w, h ]);

        union()
        {
            translate ([ -t_slot_narrow/2, -eps, -t_slot_depth ])
            cube([ t_slot_narrow, w+2*eps, t_slot_depth+eps ]);

            translate ([ -t_slot_wide/2, -eps, -t_slot_depth ])
            cube([ t_slot_wide, w+2+eps, t_slot_height ]);
        }   
    }   
}


module lathe(carriage_pos = 160, cross_slide_pos = 0)
{
    height_spindle = 50;
    height_cross_slide = height_spindle - 11;
    
    union()
    {
        translate([ 0, 0, height_spindle ])
        spindle();

        bed();   
        // headstock();
        // tailstock_deadcenter();
        
        translate([ 0, carriage_pos, 0 ])
        union()
        {
            carriage();
            // carriage_attachment();
            
            translate([ cross_slide_pos, 0, height_cross_slide ])
            cross_slide();
            // tool_post();
        }
        
    }
}

// lathe();

module lathe_top_view()
{
    projection()
    lathe();
}

module lathe_end_view()
{
    projection()
    rotate([ 90, 0, 0])
    lathe();
}

module lathe_front_view()
{
    projection()
    rotate([ 0, -90, 0])
    lathe();
}

lathe();
// lathe_front_view();
// lathe_top_view();
// lathe_end_view();