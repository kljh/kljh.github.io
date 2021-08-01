'use strict';

const TwoPi = 2*Math.PI;
const d2r = TwoPi / 360.;
const r2d = 1/d2r;

function init() {
    draw_grid();
}

function draw_grid() {
    var inputs = get_inputs();
    var dx = 5;
    var dh = dx * Math.sqrt(3)/2;
    
    var defs = document.getElementById("defs");
    var L = 50;
    var t = 0.5 * L, 
        r = 0. * L;
    var x = Math.cos(18*d2r);
    var y = Math.sin(18*d2r);
    var X = Math.cos(36*d2r);
    var Y = Math.sin(36*d2r);
    var Xx = Math.cos(54*d2r);
    var Yy = Math.sin(54*d2r);
    var XX = Math.cos(72*d2r);
    var YY = Math.sin(72*d2r);

    var d0 = `M 0 0 L ${L*x} ${L*y} L ${2*L*x} 0 L ${L*x} ${-L*y} Z `
    var d = `M 0 0 Q ${t*x} ${-t*y} ${L*x} ${L*y} Q ${2*L*x-t*Xx} ${t*Yy} ${2*L*x} 0 Q ${L*x+r*Xx} ${-L*y+r*Yy} ${L*x} ${-L*y} Q ${L*x-r*x} ${-L*y-r*y} 0 0 `;
    var da = `M ${2*L*x/3} ${2*L*y/3} A ${L/3} ${L/3} 0 0 1 ${4*L*x/3} ${2*L*y/3} `;
    var g = defs.appendChild(svg_node("g", { id: "rhomb" }));
    g.appendChild(svg_node("path", { d }));
    g.appendChild(svg_node("path", { d: da, stroke: "green" }));
    //defs.appendChild(svg_node("use", { id: "rhombF", href: "#rhomb", transform: `scale(1 -1)` }));
    defs.appendChild(svg_node("use", { id: "rhombR", href: "#rhomb", transform: `translate(${2*L*x} 0) rotate(180)` }));
    //defs.appendChild(svg_node("use", { id: "rhombRF", href: "#rhomb", transform: `translate(${2*L*x} 0) rotate(180) scale(1 -1)` }));
    
    var d0 = `M 0 0 L ${L*X} ${L*Y} L ${2*L*X} 0 L ${L*X} ${-L*Y} Z `
    var d = `M 0 0 Q ${L*X-t} ${L*Y} ${L*X} ${L*Y} Q ${L*X+r} ${L*Y} ${2*L*X} 0 Q ${L*X+r*XX} ${-L*Y+r*YY} ${L*X} ${-L*Y} Q ${L*X-t*XX} ${-L*Y+t*YY} 0 0 `;
    var da = `M ${L*X/3} ${-L*Y/3} A ${L/3} ${L/3} 0 0 1 ${L*X/3} ${L*Y/3} `;
    var g = defs.appendChild(svg_node("g", { id: "rhomb2" }));
    //g.appendChild(svg_node("path", { d: d0 }));
    g.appendChild(svg_node("path", { d }));
    g.appendChild(svg_node("path", { d: da, stroke: "green" }));
    defs.appendChild(svg_node("use", { id: "rhomb2R", href: "#rhomb2", transform: `translate(${2*L*X} 0) rotate(180)` }));
    

    var cut = document.getElementById("cut");
    var grid = document.getElementById("grid");
    
    // cut.appendChild(svg_node("use", { href: "#rhomb2R" }));
    cut.appendChild(svg_node("use", { href: "#rhomb2R", transform: `rotate(72)` }));
    cut.appendChild(svg_node("use", { href: "#rhomb2R", transform: `rotate(144)` }));
    cut.appendChild(svg_node("use", { href: "#rhomb2R", transform: `rotate(216)` }));
    cut.appendChild(svg_node("use", { href: "#rhomb2R", transform: `rotate(288)` }));
    
    cut.appendChild(svg_node("use", { href: "#rhombR", transform: `translate(${-L*y} ${L*x}) rotate(54)` }));
    cut.appendChild(svg_node("use", { href: "#rhomb", transform: `translate(${L*X} ${L*Y}) rotate(90)` }));
    cut.appendChild(svg_node("use", { href: "#rhomb", transform: `translate(${L*X} ${L*Y}) rotate(18)` }));
    cut.appendChild(svg_node("use", { href: "#rhombR", transform: `translate(${L*X} ${L*Y}) rotate(54)` }));
    cut.appendChild(svg_node("use", { href: "#rhombR", transform: `rotate(18)` }));
    cut.appendChild(svg_node("use", { href: "#rhomb", transform: `rotate(-18)` }));
    
    cut.appendChild(svg_node("use", { href: "#rhomb2R", transform: `translate(${L+2*L*X} 0) rotate(180)` }));
    cut.appendChild(svg_node("use", { href: "#rhomb2R", transform: `translate(${L+L*X} ${-L*Y}) rotate(216)` }));
    return 
    
    cut.appendChild(svg_node("use", { href: "#rhomb", transform: `rotate(18)` }));
    cut.appendChild(svg_node("use", { href: "#rhombR", transform: `rotate(-18)` }));
    return 
    
    cut.appendChild(svg_node("use", { href: "#rhomb2", transform: `translate(${4*L*X} 0) rotate(180)` }));
    cut.appendChild(svg_node("use", { href: "#rhomb2", transform: `translate(${4*L*X} 0) rotate(252)` }));
    cut.appendChild(svg_node("use", { href: "#rhomb2", transform: `translate(${4*L*X} 0) rotate(108)` }));
    
    cut.appendChild(svg_node("use", { href: "#rhomb", transform: `translate(${2*L*X} 0) rotate(54)` }));
    cut.appendChild(svg_node("use", { href: "#rhomb", transform: `translate(${2*L*X} 0) rotate(234)` }));
    cut.appendChild(svg_node("use", { href: "#rhomb", transform: `translate(${2*L*X} 0) rotate(90) translate(${-2*L*x} 0)` }));
    cut.appendChild(svg_node("use", { href: "#rhomb", transform: `translate(${2*L*X} 0) rotate(270) translate(${-2*L*x} 0)` }));

    cut.appendChild(svg_node("use", { href: "#rhomb", transform: `translate(${-1.3*L} ${1.2*L} ) rotate(18)` }));
    cut.appendChild(svg_node("use", { href: "#rhomb", transform: `translate(${-1.3*L} ${-1.2*L} ) rotate(-18)` }));
    cut.appendChild(svg_node("use", { href: "#rhomb", transform: `translate(${-1.4*L} ${-1.*L} ) rotate(90)` }));
    cut.appendChild(svg_node("use", { href: "#rhomb", transform: `translate(${3.65*L} ${-1.*L} ) rotate(90)` }));
    //grid.appendChild(svg_node("line", { x1: 0, x2: 0, y1: -dh, y2: dh }));
    
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

console.log();