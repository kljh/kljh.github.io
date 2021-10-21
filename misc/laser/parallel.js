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
    var m3_x0 = 18;
    var thickness = 6;

    var cut = document.getElementById("cut");

    var g = defs.appendChild(svg_node("g", { id: "rods" }));
    // rods are on each side of the pulley
    // g.appendChild(svg_node("circle", { cx: -30, cy: 0, r: 4 }));
    // g.appendChild(svg_node("circle", { cx: +30, cy: 0, r: 4 }));
    // M3 (1.6) or M4 (2.1) holes,  M5 in the center
    g.appendChild(svg_node("circle", { cx: -m3_x0, cy: 0, r: 2.1 }));
    g.appendChild(svg_node("circle", { cx: +m3_x0, cy: 0, r: 2.1 }));
    g.appendChild(svg_node("circle", { cx: 0, cy: 0, r: 2.6 }));
    
    // Disc cut
    var g = defs.appendChild(svg_node("g", { id: "disk_outer" }));
    var x = radius_outer * Math.tan(30*d2r);
    var dx = radius_outer_corner * Math.tan(30*d2r);
    //g.appendChild(svg_node("line", { x1: -x, y1: -10, x2: x, y2: -10 }));
    //g.appendChild(svg_node("circle", { cx: x-dx, cy: -10+radius_outer_corner, r: radius_outer_corner }));
    // A rx ry x-axis-rotation large-arc-flag sweep-flag x y
    var x0 = -x+dx - radius_outer_corner * Math.sin(30*d2r), 
        y0 = -10+radius_outer_corner - radius_outer_corner * Math.cos(30*d2r),
        x1 = -x+dx,
        y1 = -10;
    var d = `M ${x0} ${y0} A ${radius_outer_corner} ${radius_outer_corner} 0 0 1 ${x1} ${y1}`
        + ` L ${-x1} ${y1} A ${radius_outer_corner} ${radius_outer_corner} 0 0 1 ${-x0} ${y0}`;
    g.appendChild(svg_node("path", { d }));
    
    var g = defs.appendChild(svg_node("g", { id: "disk_inner" }));
    var x = radius_inner * Math.tan(30*d2r);
    var dx = radius_inner_corner * Math.tan(30*d2r);
    var x0 = -x+dx - radius_inner_corner * Math.sin(30*d2r), 
        y0 = 10+radius_inner_corner - radius_inner_corner * Math.cos(30*d2r),
        x1 = -x+dx,
        y1 = 10;
    var d = `M ${x0} ${y0} A ${radius_inner_corner} ${radius_inner_corner} 0 0 1 ${x1} ${y1}`
        + ` L ${-x1} ${y1} A ${radius_inner_corner} ${radius_inner_corner} 0 0 1 ${-x0} ${y0}`;
    g.appendChild(svg_node("path", { d }));

    var g = defs.appendChild(svg_node("g", { id: "base_rods" }));
    g.appendChild(svg_node("use", { "xlink:href": "#rods" }));
    g.appendChild(svg_node("use", { "xlink:href": "#disk_outer" }));
    g.appendChild(svg_node("use", { "xlink:href": "#disk_inner" }));

    var g = defs.appendChild(svg_node("g", { id: "pulley_motor" }));
    g.appendChild(svg_node("use", { "xlink:href": "#rods" }));
    g.appendChild(svg_node("use", { "xlink:href": "#disk_outer" }));

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
    g.appendChild(svg_node("circle", { cx: -10, cy: -95, r: 2.5 }));
    g.appendChild(svg_node("circle", { cx: +10, cy: -95, r: 2.5 }));

    var g = defs.appendChild(svg_node("g", { id: "spacer1" }));
    g.appendChild(svg_node("path", { d: `M ${x1} ${y2} L ${x2} ${y2} L ${x2} ${y1} L ${x3} ${y1} L ${x3} ${y2} L ${x4} ${y2}
        L ${x4} ${-y2} L ${x3} ${-y2} L ${x3} ${-y1} L ${x2} ${-y1} L ${x2} ${-y2} L ${x1} ${-y2}  Z` })); 

    var g = defs.appendChild(svg_node("g", { id: "spacer" }));
    var w = 92, h = y1 * 2, x2 = 39;
    g.appendChild(svg_node("rect", { x: -w/2, y: -h/2, width: w, height: h })); 
    g.appendChild(svg_node("rect", { x: -x2-2, y: -h/2, width: 4, height: 15 })); 
    g.appendChild(svg_node("rect", { x: -x2-2, y: h/2-15, width: 4, height: 15 })); 
    g.appendChild(svg_node("rect", { x: +x2-2, y: -h/2, width: 4, height: 15 })); 
    g.appendChild(svg_node("rect", { x: +x2-2, y: h/2-15, width: 4, height: 15 })); 
    g.appendChild(svg_node("rect", { x: -x2-3.5, y: -h/2+10, width: 7, height: 3 })); 
    g.appendChild(svg_node("rect", { x: -x2-3.5, y: h/2-10-3, width: 7, height: 3 })); 
    g.appendChild(svg_node("rect", { x: +x2-3.5, y: -h/2+10, width: 7, height: 3 })); 
    g.appendChild(svg_node("rect", { x: +x2-3.5, y: h/2-10-3, width: 7, height: 3 })); 

    //g.appendChild(svg_node("path", { d: `M ${x1} ${y2} L ${x2} ${y2} L ${x2} ${y1} L ${x3} ${y1} L ${x3} ${y2} L ${x4} ${y2}
    //    L ${x4} ${-y2} L ${x3} ${-y2} L ${x3} ${-y1} L ${x2} ${-y1} L ${x2} ${-y2} L ${x1} ${-y2}  Z` })); 

    var g = defs.appendChild(svg_node("g", { id: "traveler" }));
    var w = 60+15, h = 25;
    g.appendChild(svg_node("rect", { x: -w/2, y: -h/2, width: w, height: h })); 
    
    var y0 = 0;
    var used_def = "#pulley_motor";
    // var used_def = "#base_rods";
    for (var theta=0; theta<360; theta+=60) {
        cut.appendChild(svg_node("use", { "xlink:href": used_def, transform: `rotate(${theta})   translate(${0} ${-radius_working_area})` }));
        cut.appendChild(svg_node("use", { "xlink:href": "#spacer_holes", transform: `rotate(${theta+30})   translate(${0} ${0})` }));
    }
    cut.appendChild(svg_node("use", { "xlink:href": "#spacer", transform: `translate(${0} ${150})` }));

    cut.appendChild(svg_node("use", { "xlink:href": "#traveler", transform: `translate(${-100} ${150})` }));

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
