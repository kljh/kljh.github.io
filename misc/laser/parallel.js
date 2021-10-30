'use strict';

function init() {
    draw_delta();
}

function draw_delta() {
    var inputs = get_inputs();
    
    // Dimensions in mm
    var radius_working_area = 110;
    var radius_outer = 120;
    var radius_inner = 100;
    var radius_outer_corner = 50;
    var radius_inner_corner = radius_outer_corner * radius_inner / radius_outer;

    var M3 = { nut_width: 5.5, nut_height: 2.4, tap_diam: 2.7, clear_diam: 3.2 };
    var M4 = { nut_width: 7.0, nut_height: 3.2, tap_diam: 3.5, clear_diam: 4.2 };
    var M5 = { nut_width: 8.0, nut_height: 4.7, tap_diam: 4.4, clear_diam: 5.2 };
    var M6 = { nut_width: 10., nut_height: 5.2, tap_diam: 5.4, clear_diam: 6.2 };
    
    var thickness = 6;    
    var rod_x = 30, rod_diam = 8;
    var rod_screw_x = 18, rod_screw = M3;

    var cut = document.getElementById("cut");

    function holes_pair(r, x, d) {
        g.appendChild(svg_node("circle", { cx: -x, cy: 0, r: d/2 }));
        g.appendChild(svg_node("circle", { cx: +x, cy: 0, r: d/2 }));
    } 

    // rods are on each side of the pulley
    var g = defs.appendChild(svg_node("g", { id: "rods" }));
    holes_pair(r, rod_x, rod_diam);
    holes_pair(r, rod_screw_x, rod_screw.clear_diam);
    
    g.appendChild(svg_node("circle", { cx: 0, cy: 0, r: M5.clear_diam/2 }));  // M5 shaft for pulley
    
    // Disc cut
    function hexa_cut(g, radius, corner_radius) {
        var x = radius * Math.tan(30*d2r);
        var dx = corner_radius * Math.tan(30*d2r);
        // A rx ry x-axis-rotation large-arc-flag sweep-flag x y
        var x0 = -x+dx - corner_radius * Math.sin(30*d2r), 
            y0 = (radius_working_area-radius) + corner_radius - corner_radius * Math.cos(30*d2r),
            x1 = -x+dx,
            y1 = (radius_working_area-radius);
        var d = `M ${x0} ${y0} A ${corner_radius} ${corner_radius} 0 0 1 ${x1} ${y1}`
            + ` L ${-x1} ${y1} A ${corner_radius} ${corner_radius} 0 0 1 ${-x0} ${y0}`;
        g.appendChild(svg_node("path", { d }));
    }
    
    var g = defs.appendChild(svg_node("g", { id: "disk_outer" }));
    hexa_cut(g, radius_outer, radius_outer_corner);

    var g = defs.appendChild(svg_node("g", { id: "disk_inner" }));
    hexa_cut(g, radius_inner, radius_inner_corner);

    var g = defs.appendChild(svg_node("g", { id: "base_rods" }));
    g.appendChild(svg_node("use", { "xlink:href": "#rods" }));
    g.appendChild(svg_node("use", { "xlink:href": "#disk_outer" }));
    g.appendChild(svg_node("use", { "xlink:href": "#disk_inner" }));

    var g = defs.appendChild(svg_node("g", { id: "pulley_motor" }));
    g.appendChild(svg_node("use", { "xlink:href": "#rods" }));
    g.appendChild(svg_node("use", { "xlink:href": "#disk_outer" }));
    g.appendChild(svg_node("use", { "xlink:href": "#disk_inner", "stroke": "red" }));

    // pulley is 18mm x 8.5mm
    g.appendChild(svg_node("rect", { x: -11, y: -5, width: 22, height: 10, rx: .5, ry: 1.5 })); 

    // motor holes are 30mm appart, 15mm and 40mm from the face plate
    g.appendChild(svg_node("circle", { cx: -15, cy: 25, r: 2.5 }));
    g.appendChild(svg_node("circle", { cx: +15, cy: 25, r: 2.5 }));
    g.appendChild(svg_node("circle", { cx: -15, cy: 50, r: 2.5 }));
    g.appendChild(svg_node("circle", { cx: +15, cy: 50, r: 2.5 }));
    g.appendChild(svg_node("rect", { x: -25, y: 10, width: 50, height: 53, rx: 5, ry: 5, stroke: "red" })); 
        

    var g = defs.appendChild(svg_node("g", { id: "step" }));
    g.appendChild(svg_node("use", { "xlink:href": "#rods" }));
    g.appendChild(svg_node("rect", { x: -40, y: -10, width: 80, height: 20, rx: 10, ry: 10 })); 


    var x1 = 0, x2 = 15, x3 = 50, x4 = 65, y1 = 27, y2 = y1+thickness;
    
    var g = defs.appendChild(svg_node("g", { id: "spacer_holes" }));
    g.appendChild(svg_node("rect", { x: -thickness/2, y: -75-x1, width: thickness, height: 15 }));
    g.appendChild(svg_node("rect", { x: -thickness/2, y: -75-x3, width: thickness, height: 15 }));

    var g = defs.appendChild(svg_node("g", { id: "spacer1" }));
    g.appendChild(svg_node("path", { d: `M ${x1} ${y2} L ${x2} ${y2} L ${x2} ${y1} L ${x3} ${y1} L ${x3} ${y2} L ${x4} ${y2}
        L ${x4} ${-y2} L ${x3} ${-y2} L ${x3} ${-y1} L ${x2} ${-y1} L ${x2} ${-y2} L ${x1} ${-y2}  Z` })); 

    var g = defs.appendChild(svg_node("g", { id: "spacer2" }));
    var w = 80, h = 56, x2 = 18, wn = 5.5, hn = 2.5, ws = 3, hs = 15, yn = 10;
    g.appendChild(svg_node("rect", { x: -w/2, y: -h/2, width: w, height: h })); 
    g.appendChild(svg_node("rect", { x: -x2-ws/2, y: -h/2, width: ws, height: hs })); 
    g.appendChild(svg_node("rect", { x: -x2-ws/2, y: h/2-hs, width: ws, height: hs })); 
    g.appendChild(svg_node("rect", { x: +x2-ws/2, y: -h/2, width: ws, height: hs })); 
    g.appendChild(svg_node("rect", { x: +x2-ws/2, y: h/2-hs, width: ws, height: hs })); 
    g.appendChild(svg_node("rect", { x: -x2-wn/2, y: -h/2+yn, width: wn, height: hn })); 
    g.appendChild(svg_node("rect", { x: -x2-wn/2, y: h/2-yn-hn, width: wn, height: hn })); 
    g.appendChild(svg_node("rect", { x: +x2-wn/2, y: -h/2+yn, width: wn, height: hn })); 
    g.appendChild(svg_node("rect", { x: +x2-wn/2, y: h/2-yn-hn, width: wn, height: hn })); 

    //g.appendChild(svg_node("path", { d: `M ${x1} ${y2} L ${x2} ${y2} L ${x2} ${y1} L ${x3} ${y1} L ${x3} ${y2} L ${x4} ${y2}
    //    L ${x4} ${-y2} L ${x3} ${-y2} L ${x3} ${-y1} L ${x2} ${-y1} L ${x2} ${-y2} L ${x1} ${-y2}  Z` })); 

    var g = defs.appendChild(svg_node("g", { id: "traveler" }));
    var w = 60+15, h = 25, x1 = 30-7.5, x2 = 37.5;
    g.appendChild(svg_node("rect", { x: -w/2, y: -h/2, width: w, height: h })); 
    g.appendChild(svg_node("circle", { cx: 0, cy: -h/5, r: 2.5 }));
    g.appendChild(svg_node("circle", { cx: 0, cy: +h/5, r: 2.5 }));
    var r = 2, y1 = 15.5/2;
    g.appendChild(svg_node("circle", { cx: -x1, cy: -y1, r }));
    g.appendChild(svg_node("circle", { cx: -x1, cy: +y1, r }));
    g.appendChild(svg_node("circle", { cx: -x2, cy: -y1, r }));
    g.appendChild(svg_node("circle", { cx: -x2, cy: +y1, r }));
    g.appendChild(svg_node("circle", { cx: +x1, cy: -y1, r }));
    g.appendChild(svg_node("circle", { cx: +x1, cy: +y1, r }));
    g.appendChild(svg_node("circle", { cx: +x2, cy: -y1, r }));
    g.appendChild(svg_node("circle", { cx: +x2, cy: +y1, r }));
    
    var y0 = 0;
    var used_def = "#pulley_motor";
    // var used_def = "#base_rods";
    for (var theta=0; theta<360; theta+=60) {
        cut.appendChild(svg_node("use", { "xlink:href": used_def, transform: `rotate(${theta})   translate(${0} ${-radius_working_area})` }));
        cut.appendChild(svg_node("use", { "xlink:href": "#spacer_holes", transform: `rotate(${theta+30})   translate(${0} ${0})` }));
    }
    cut.appendChild(svg_node("use", { "xlink:href": "#spacer1", transform: `translate(${50} ${155})` }));
    cut.appendChild(svg_node("use", { "xlink:href": "#spacer2", transform: `translate(${0} ${155})` }));

    cut.appendChild(svg_node("use", { "xlink:href": "#traveler", transform: `translate(${-100} ${140})` }));

    // disc cut
    cut.appendChild(svg_node("circle", { cx: 0, cy: 0, r: 45 }));
    //cut.appendChild(svg_node("circle", { cx: 0, cy: 0, r: radius_working_area+15 }));
    

    cut.appendChild(svg_node("use", { "xlink:href": "#step", transform: `rotate(90) translate(${-80} ${125})` }));
    cut.appendChild(svg_node("use", { "xlink:href": "#step", transform: `rotate(90) translate(${-80} ${-125})` }));
    cut.appendChild(svg_node("use", { "xlink:href": "#step", transform: `rotate(90) translate(${-80} ${-148})` }));
    cut.appendChild(svg_node("use", { "xlink:href": "#step", transform: `rotate(90) translate(${80} ${125})` }));
    cut.appendChild(svg_node("use", { "xlink:href": "#step", transform: `rotate(90) translate(${80} ${-125})` }));
    cut.appendChild(svg_node("use", { "xlink:href": "#step", transform: `rotate(90) translate(${80} ${-148})` }));
    
    download_link();
}


function download_link() {
    // Download link
    var svg_elnt = document.getElementById("svg_elnt");
    var svg_xml = svg_elnt.outerHTML;
    var blob = new Blob([svg_xml], { type: "image/svg+xml" });

    var a = document.getElementById("get_svg");
    a.download = document.location.pathname.split('/').pop().split('.')[0] + ".svg";
    a.href = URL.createObjectURL(blob);
    a.dataset.downloadurl = [ "image/svg+xml", a.download, a.href].join(':');

}

function get_inputs() {
    var inputs = {};
    var elnts = document.getElementsByTagName("input");
    for (var el of elnts) {
        var val = isNaN(el.value*1) ? el.value : el.value*1;
        if (el.type == "checkbox")
            val = el.checked;
        if (el.name)
            inputs[el.name] = val;
    }
    return inputs;
}

function translateXY(id, x, y) {
    var el = document.getElementById(id);
    el.setAttribute("transform", "translate("+x+", "+(y||0)+")");
}

function rotateZ(id, deg) {
    var el = document.getElementById(id);
    el.setAttribute("transform", "rotate("+deg+")");
}

function svg_path(path) {
    var [ x, y ] = path.shift();
    var d = `M ${x} ${y} `;
    d += path.map(P => `L ${P[0]} ${P[1]}`).join(" ");
    return d;
}

function svg_node(tag, attrs) {
    var el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (var k in attrs) {
        var ns = null, name = k;
        var tmp = k.split(":");
        if (tmp.length==2)
            ns = namespaces[tmp[0]]; 
        el.setAttributeNS(ns, name, attrs[k]);
    }
    return el;
}

function svg_text_node(txt) {
    var el = document.createTextNode(txt || "\n");
    return el;
}
