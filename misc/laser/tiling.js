'use strict';

const TwoPi = 2*Math.PI;
const d2r = TwoPi / 360.;
const r2d = 1/d2r;

const namespaces = {
    xlink: "http://www.w3.org/1999/xlink"
};

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
        r = 0.3 * L;
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
    g.appendChild(svg_text_node());
    g.appendChild(svg_node("path", { d: da, stroke: "green" }));
    defs.appendChild(svg_text_node());
    defs.appendChild(svg_node("use", { id: "rhombR", "xlink:href": "#rhomb", transform: `translate(${2*L*x} 0) rotate(180)` }));
    defs.appendChild(svg_text_node());
    
    var d0 = `M 0 0 L ${L*X} ${L*Y} L ${2*L*X} 0 L ${L*X} ${-L*Y} Z `
    var d = `M 0 0 Q ${L*X-t} ${L*Y} ${L*X} ${L*Y} Q ${L*X+r} ${L*Y} ${2*L*X} 0 Q ${L*X+r*XX} ${-L*Y+r*YY} ${L*X} ${-L*Y} Q ${L*X-t*XX} ${-L*Y+t*YY} 0 0 `;
    var da = `M ${L*X/3} ${-L*Y/3} A ${L/3} ${L/3} 0 0 1 ${L*X/3} ${L*Y/3} `;
    var g = defs.appendChild(svg_node("g", { id: "rhomb2" }));
    //g.appendChild(svg_node("path", { d: d0 }));
    g.appendChild(svg_node("path", { d }));
    g.appendChild(svg_text_node());
    g.appendChild(svg_node("path", { d: da, stroke: "green" }));
    defs.appendChild(svg_text_node());
    defs.appendChild(svg_node("use", { id: "rhomb2R", "xlink:href": "#rhomb2", transform: `translate(${2*L*X} 0) rotate(180)` }));
    defs.appendChild(svg_text_node());
        

    var cut = document.getElementById("cut");
    var grid = document.getElementById("grid");
    
    function draw_penrose() {
        // cut.appendChild(svg_node("use", { href: "#rhomb2R" }));
        cut.appendChild(svg_node("use", { href: "#rhomb2R", transform: `rotate(72)`, stroke: "blue", fill:"purple" }));
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
        cut.appendChild(svg_node("use", { href: "#rhomb2R", transform: `translate(${L+L*X} ${-L*Y}) rotate(216)`,  }));
    } 
    
    function draw_print() {
        for (var k=0; k<4; k++) {
            var x0 = 1.2*L*k, y0 = +0.2*L*k;
            for (var i=0; i<4; i++) {
                cut.appendChild(svg_node("use", { "xlink:href": "#rhomb", transform: `translate(${x0} ${y0-2*L*Y*i}) rotate(18)`, stroke: "blue" }));
                cut.appendChild(svg_text_node());
                cut.appendChild(svg_node("use", { "xlink:href": "#rhombR", transform: `translate(${x0} ${y0-2*L*Y*i}) rotate(-18)`, stroke: "black" }));
                cut.appendChild(svg_text_node());
            }
        }

        for (var k=0; k<6; k++) {
            var x0 = 1.2*L*(k+4.2), y0 = 0.2*L*2.5 + (k%2)*L*0.6;
            for (var i=0; i<(4+(k%2)); i++) {
                cut.appendChild(svg_node("use", { "xlink:href": "#rhomb2", transform: `translate(${x0} ${y0-2*L*Y*i})` }));
                cut.appendChild(svg_text_node());
            }
        }

    }

    //draw_penrose();
    draw_print();

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
        if (tmp.length==2) {
            ns = namespaces[tmp[0]]; 
        }
        el.setAttributeNS(ns, name, attrs[k]);
    }
    return el;
}

function svg_text_node(txt) {
    var el = document.createTextNode(txt || "\n");
    return el;
}

console.log();