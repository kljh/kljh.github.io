

// quick preview might not display properly.
// slow rendering works fine. 
module offset_outwards() {
    render() { 
        minkowski() {
            children(0);
            children(1);
        }
    }
}

module offset_inwards(bbox = [500, 500, 500])
{
    invert_volume(0.9 * bbox)
    offset_outwards() {
        invert_volume(bbox) 
            children(1);  // the object 
        children(0);      // the tool
    }
}

// function below is identity
module invert_volume_twice(bbox = [500, 500, 500]) {
    invert_volume(0.9 * bbox)
    invert_volume(bbox)
    children(0);
}

module invert_volume(bbox) {
    difference() {
        cube(bbox, center=true);
        children();
    }        
}



module use_fillets(size=1, horizontal_edges=true, vertical_edges=true)
{
    epsilon = 2*size;

    if (vertical_edges && horizontal_edges)
    {
        sphere(r = size);
    }
    else if (vertical_edges)
    {
        cylinder(r = size, h=epsilon, center=true);
    }
    else if (horizontal_edges)
    {
        intersection () {
            rotate([ 90, 0, 0 ]) cylinder(r = size, h=2*size, center=true);
            rotate([ 0, 90, 0 ]) cylinder(r = size, h=2*size, center=true);
        }
    }
    else
    {
        assert(false, "must fillet either horizontal, vertical, or both edges.");
    }
}

module use_chamfer(size=1, horizontal_edges=true, vertical_edges=true)
{
    c = size * 2 / sqrt(2);

    if (vertical_edges && horizontal_edges)
    {
        intersection ()
        {
            rotate([ 45, 0, 0 ])
            cube([ 2*c, c, c ], center=true);

            rotate([ 0, 45, 0 ])
            cube([ c, 2*c, c ], center=true);

            rotate([ 0, 0, 45 ])
            cube([ c, c, 2*c ], center=true);
        }
    }
    else if (vertical_edges)
    {    
            rotate([ 0, 0, 45 ])
            cube([ c, c, 2*c ], center=true);
    }
    else if (horizontal_edges)
    {
        intersection ()
        {
            rotate([ 45, 0, 0 ])
            cube([ 2*c, c, c ], center=true);

            rotate([ 0, 45, 0 ])
            cube([ c, 2*c, c ], center=true);
        }
    }
    else
    {
        assert(false, "must fillet either horizontal, vertical, or both edges.");
    }
}

module test_shape(size=150)
{
    cube([ size, size, size ], center=true);
    cylinder(r=size/3, h=2*size, center=true);
    rotate([ 90, 0, 0]) cylinder(r=size/3, h=2*size, center=true);
}

module test(size=10, horizontal_edges=true, vertical_edges=true, 
    with_chamfer=true, outwards=true)
{
    if (with_chamfer)
    {
        if (outwards)
            offset_outwards()
            {
                use_chamfer(size, horizontal_edges, vertical_edges);
                test_shape();
            }
        else
            offset_inwards()
            {
                use_chamfer(size, horizontal_edges, vertical_edges);
                test_shape();
            }            
    } else { 
        if (outwards)
            offset_outwards()
            {
                use_fillets(size, horizontal_edges, vertical_edges);
                test_shape();
            }
        else
            offset_inwards()
            {
                use_fillets(size, horizontal_edges, vertical_edges);
                test_shape();
            }
    }
}

test();