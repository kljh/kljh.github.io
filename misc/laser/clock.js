'use strict';

function init() {
    draw_clock();
}

function draw_clock() {
    var inputs = get_inputs();
    
    // Dimenesions in mm
    var thickness = 5;
    var base_length = 200;
    var base_width = 30;
    var base_rcorner = 10;
    var base_x0 = base_length/2- 30;
    var base_track_length = base_length- 100;
    var mast_height = 160;
    var mast_width = 20;
    var mast_dh = 10;
    var mast_r = 2.5;
    var mast_w = Math.sqrt(thickness*thickness-(mast_r)*(mast_r));
    var feet_length = mast_width - 2.5;
    var feet_width = 5;
    var track_length = 250;
    var track_width = 14;
    var track_gap = 5;
    var track_rout = 5;
    var track_rin = 4;
    
    var cut = document.getElementById("cut");
    
    var g = defs.appendChild(svg_node("g", { id: "base" }));
    g.appendChild(svg_node("rect", { x: -base_length/2, y: -base_width/2, width: base_length, height: base_width, rx: base_rcorner, ry: base_rcorner }));
    g.appendChild(svg_node("rect", { x: -base_track_length/2, y: -track_gap/2, width: base_track_length, height: track_gap, rx: track_gap/2, ry: track_gap/2 }));
    g.appendChild(svg_node("circle", { cx: -base_length/2+base_rcorner, cy: 0, r: track_rout }));
    g.appendChild(svg_node("circle", { cx: +base_length/2-base_rcorner, cy: 0, r: track_rout }));
    var feets = [ [ -1, -1 ],  [ -1, 1 ], [ 1, -1 ], [ 1, 1 ] ];
    for (var [ xmult, ymult ] of feets) {
        g.appendChild(svg_node("rect", {  x: xmult * base_x0 - feet_length/2, y: ymult * track_width/2 - feet_width/2, width: feet_length, height: feet_width }));
    }
    
    function rect_with_recess(l, w, dl, dw) {
        var d = `M ${dl},0, ${dl},${dw} 0,${dw} 0,${w-dw} ${dl},${w-dw} ${dl},${w} ${l-dl},${w} ${l-dl},${w-dw} ${l},${w-dw} ${l},${dw} ${l-dl},${dw} ${l-dl},0, Z`;
        return svg_node("path", {  d });
    }
    
    var g = defs.appendChild(svg_node("g", { id: "support" }));
    g.appendChild(rect_with_recess(track_width+2*thickness, mast_w+2*2.5, thickness, 2.5));
    

    var g1 = defs.appendChild(svg_node("g", { id: "mast1" }));
    var g2 = defs.appendChild(svg_node("g", { id: "mast2" }));
    g1.appendChild(rect_with_recess(mast_height, mast_width, thickness, 2.5));
    g2.appendChild(rect_with_recess(mast_height, mast_width, thickness, 2.5));
    for (var i=0, n=(mast_height-2*thickness)/mast_dh-1; i<n; i++) {
        g1.appendChild(svg_node("circle", { cx: (i+1.0)*mast_dh+thickness, cy: mast_width/2, r: mast_r }));
        if ((i+1)==n) break;
        g2.appendChild(svg_node("circle", { cx: (i+1.5)*mast_dh+thickness, cy: mast_width/2, r: mast_r }));
    }

    var g = defs.appendChild(svg_node("g", { id: "track" }));
    g.appendChild(svg_node("rect", {  x: 0, y: -track_width/2, width: track_length, height: track_width, rx: track_width/2, ry: track_width/2 }));
    g.appendChild(svg_node("rect", {  x: track_width/2, y: -track_gap/2, width: track_length - track_width, height: track_gap, rx: track_gap/2, ry: track_gap/2 }));
    g.appendChild(svg_node("circle", {  cx: track_width/2, cy: 0, r: track_rout }));
    g.appendChild(svg_node("circle", {  cx: track_length-track_width/2, cy: 0, r: track_rin }));
    
 
    var y0 = 0;
    cut.appendChild(svg_node("use", { "xlink:href": "#base", transform: `translate(${base_length/2} ${y0 + base_width/2})` }));
    y0 += base_width + 2;
    cut.appendChild(svg_node("use", { "xlink:href": "#base", transform: `translate(${base_length/2} ${y0 + base_width/2})` }));
    y0 += base_width + 2; var y02 = y0;
    cut.appendChild(svg_node("use", { "xlink:href": "#mast1", transform: `translate(${0} ${y0})` }));
    y0 += mast_width + 2;
    cut.appendChild(svg_node("use", { "xlink:href": "#mast1", transform: `translate(${0} ${y0})` }));
    y0 += mast_width + 2;
    cut.appendChild(svg_node("use", { "xlink:href": "#mast2", transform: `translate(${0} ${y0})` }));
    y0 += mast_width + 2;
    cut.appendChild(svg_node("use", { "xlink:href": "#mast2", transform: `translate(${0} ${y0})` }));
    y0 += mast_width + 2;
    for (var i=0; i<6; i++) {
        cut.appendChild(svg_node("use", { "xlink:href": "#track", transform: `translate(${0} ${y0 + track_width/2})` }));
        y0 += track_width + 2;
        cut.appendChild(svg_node("use", { "xlink:href": "#support", transform: `translate(${mast_height+2} ${y02})` }));
        cut.appendChild(svg_node("use", { "xlink:href": "#support", transform: `translate(${mast_height+2+track_width+2*thickness+2} ${y02})` }));
        y02 += mast_w+2*2.5 + 2;
    }
    
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
