'use strict';

const TwoPi = 2*Math.PI;
const deg = TwoPi / 360.;
const rad = 1/deg;

function init() {
    draw_grid();
}

function draw_grid() {
    var inputs = get_inputs();
    var dx = 5;
    var dh = dx * Math.sqrt(3)/2;
    
    var cut = document.getElementById("cut");
    var grid = document.getElementById("grid");
    cut.appendChild(svg_node("circle", { cx: 0, cy: 0, r: 40 }));
    grid.appendChild(svg_node("line", { x1: 0, x2: 0, y1: -dh, y2: dh }));
    
    var n = 15;
    for (var j=-n; j<n; j++) {
        var x0 = ( j % 2 ) / 2 * dx;
        var y = j * dh;
        for (var i=-n; i<n; i++)
            grid.appendChild(svg_node("line", { x1: x0+2*i*dx, x2: x0+(2*i+1)*dx, y1: y, y2: y }));
    }

    download_link();
}


function download_link() {
    // Download link
    var svg_elnt = document.getElementById("svg_elnt");
    var svg_xml = svg_elnt.outerHTML;
    var blob = new Blob([svg_xml], { type: "image/svg+xml" });

    var a = document.getElementById("get_svg");
    a.download = "gear.svg";
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
            ns = tmp[0], name = tmp[1];
        el.setAttributeNS(ns, name, attrs[k]);
    }
    return el;
}
