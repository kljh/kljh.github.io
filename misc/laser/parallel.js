'use strict';

function init() {
    draw_delta();
}

function draw_delta() {
    var inputs = get_inputs();
    
    // Dimensions in mm
    var radius_working_area = 110;
    var radius_outter = 120;
    var radius_outter_corner = 50;
    var m3_x0 = 18;
    var thickness = 5;

    var cut = document.getElementById("cut");

    var g = defs.appendChild(svg_node("g", { id: "rods" }));
    // rods are on each side of the pulley
    g.appendChild(svg_node("circle", { cx: -30, cy: 0, r: 4 }));
    g.appendChild(svg_node("circle", { cx: +30, cy: 0, r: 4 }));
    // M3 holes
    g.appendChild(svg_node("circle", { cx: -m3_x0, cy: 0, r: 1.6 }));
    g.appendChild(svg_node("circle", { cx: +m3_x0, cy: 0, r: 1.6 }));
    //g.appendChild(svg_node("circle", { cx: -40, cy: 0, r: 1.6 }));
    //g.appendChild(svg_node("circle", { cx: +40, cy: 0, r: 1.6 }));

    // Disc cut
    var x = radius_outter * Math.tan(30*d2r);
    var dx = radius_outter_corner * Math.tan(30*d2r);
    //g.appendChild(svg_node("line", { x1: -x, y1: -10, x2: x, y2: -10 }));
    //g.appendChild(svg_node("circle", { cx: x-dx, cy: -10+radius_outter_corner, r: radius_outter_corner }));
    // A rx ry x-axis-rotation large-arc-flag sweep-flag x y
    var x0 = -x+dx - radius_outter_corner * Math.sin(30*d2r), 
        y0 = -10+radius_outter_corner - radius_outter_corner * Math.cos(30*d2r),
        x1 = -x+dx,
        y1 = -10;
    var d = `M ${x0} ${y0} A ${radius_outter_corner} ${radius_outter_corner} 0 0 1 ${x1} ${y1}`
        + `L ${-x1} ${y1} A ${radius_outter_corner} ${radius_outter_corner} 0 0 1 ${-x0} ${y0};`
    g.appendChild(svg_node("path", { d }));
    
    var g = defs.appendChild(svg_node("g", { id: "pulley_motor" }));
    g.appendChild(svg_node("use", { "xlink:href": "#rods" }));
    // pulley is 18mm x 8.5mm
    g.appendChild(svg_node("rect", { x: -11, y: -5, width: 22, height: 10, rx: .5, ry: 1.5 })); 
    // motor holes are 30mm appart, 15mm and 40mm from the face plate
    g.appendChild(svg_node("circle", { cx: -15, cy: 25, r: 2.5 }));
    g.appendChild(svg_node("circle", { cx: +15, cy: 25, r: 2.5 }));
    g.appendChild(svg_node("circle", { cx: -15, cy: 50, r: 2.5 }));
    g.appendChild(svg_node("circle", { cx: +15, cy: 50, r: 2.5 }));
    g.appendChild(svg_node("rect", { x: -25, y: 10, width: 50, height: 53, rx: 5, ry: 5, stroke: "red" })); 
        

    var y0 = 0;
    cut.appendChild(svg_node("use", { "xlink:href": "#pulley_motor", transform: `rotate(0)   translate(${0} ${-radius_working_area})` }));
    cut.appendChild(svg_node("use", { "xlink:href": "#pulley_motor", transform: `rotate(60)  translate(${0} ${-radius_working_area})` }));
    cut.appendChild(svg_node("use", { "xlink:href": "#pulley_motor", transform: `rotate(120) translate(${0} ${-radius_working_area})` }));
    cut.appendChild(svg_node("use", { "xlink:href": "#pulley_motor", transform: `rotate(180) translate(${0} ${-radius_working_area})` }));
    cut.appendChild(svg_node("use", { "xlink:href": "#pulley_motor", transform: `rotate(240) translate(${0} ${-radius_working_area})` }));
    cut.appendChild(svg_node("use", { "xlink:href": "#pulley_motor", transform: `rotate(300) translate(${0} ${-radius_working_area})` }));
    // disc cut
    cut.appendChild(svg_node("circle", { cx: 0, cy: 0, r: 45 }));
    //cut.appendChild(svg_node("circle", { cx: 0, cy: 0, r: radius_working_area+15 }));
    
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
