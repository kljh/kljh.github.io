
// $fn = 32;

difference()
{
    union() {
        sphere(r=10);
        
        translate([ -9, -9, -9 ])
        cube(9);
    }
    
    translate([ 0, 0, +15 ])
    cylinder(r=2, h=30, center=true);

    translate([ 0, 0, -15 ])
    cylinder(r=3, h=30, center=true);

    rotate([ 90, 0, 0 ])
    cylinder(r=4, h=30, center=true);

    rotate([ 0, 90, 0 ])
    cylinder(r=5, h=30, center=true);
}