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

    var p0 = L / ( 2*X + 2 - 2*Y/x*y);
    var l0 = 2 * p0 / X * Y;
    var dl = `M ${p0} ${-l0/2} l 0 ${l0} l ${l0*x} ${l0*y} l ${l0*Xx} ${-l0*Yy} l ${-l0*Xx} ${-l0*Yy} z `
        + `M ${p0+l0*x} ${l0/2+l0*y} l ${l0/2*Xx} ${l0/2*Yy} ` 
        + `M ${p0+l0*x} ${-l0/2-l0*y} l ${l0/2*Xx} ${-l0/2*Yy} ` 
        + `M ${p0+l0*x+l0*Xx} ${0} l ${l0*x} ${l0*y} ` 
        + `M ${p0+l0*x+l0*Xx} ${0} l ${l0*x} ${-l0*y} `     
    var dl1 = `M ${L*x} ${L*y-p0/X} l ${l0*X} ${l0*Y} ${l0*X} ${-l0*Y} `
        + `M ${L*x} ${L*y-p0/X} l ${-l0*X} ${l0*Y} ${-l0*X} ${-l0*Y} `
        + `M ${L*x} ${L*y-p0/X} l ${l0/2*XX} ${-l0/2*YY} `
        + `M ${L*x} ${L*y-p0/X} l ${-l0/2*XX} ${-l0/2*YY} `

    var d0 = `M 0 0 L ${L*x} ${L*y} L ${2*L*x} 0 L ${L*x} ${-L*y} Z `
    var d = `M 0 0 Q ${t*x} ${-t*y} ${L*x} ${L*y} Q ${2*L*x-t*Xx} ${t*Yy} ${2*L*x} 0 Q ${L*x+r*Xx} ${-L*y+r*Yy} ${L*x} ${-L*y} Q ${L*x-r*x} ${-L*y-r*y} 0 0 `;
    var da = `M ${3*L*x/4} ${3*L*y/4} A ${L/4} ${L/4} 0 0 1 ${5*L*x/4} ${5*L*y/4} `;
    var g = defs.appendChild(svg_node("g", { id: "rhombL" }));
    g.appendChild(svg_node("path", { d }));
    g.appendChild(svg_text_node());
    g.appendChild(svg_node("path", { d: da, stroke: "green" }));
    g.appendChild(svg_node("path", { d: dl1, stroke: "lightgrey" }));
    defs.appendChild(svg_text_node());
    defs.appendChild(svg_node("use", { id: "rhombR", "xlink:href": "#rhombL", transform: `translate(${2*L*x} 0) rotate(180)` }));
    defs.appendChild(svg_node("use", { id: "rhombT", "xlink:href": "#rhombL", transform: `translate(${-L*x} ${-L*y})` }));
    defs.appendChild(svg_node("use", { id: "rhombB", "xlink:href": "#rhombL", transform: `translate(${-L*x} ${L*y})` }));
    defs.appendChild(svg_text_node());
    
    var d0 = `M 0 0 L ${L*X} ${L*Y} L ${2*L*X} 0 L ${L*X} ${-L*Y} Z `
    var d = `M 0 0 Q ${L*X-t} ${L*Y} ${L*X} ${L*Y} Q ${L*X+r} ${L*Y} ${2*L*X} 0 Q ${L*X+r*XX} ${-L*Y+r*YY} ${L*X} ${-L*Y} Q ${L*X-t*XX} ${-L*Y+t*YY} 0 0 `;
    var da = `M ${L*X/4} ${-L*Y/4} A ${L/4} ${L/4} 0 0 1 ${L*X/4} ${L*Y/4} `;
    var g = defs.appendChild(svg_node("g", { id: "rhomb2L" }));
    //g.appendChild(svg_node("path", { d: d0 }));
    g.appendChild(svg_node("path", { d }));
    g.appendChild(svg_text_node());
    g.appendChild(svg_node("path", { d: da, stroke: "green" }));
    g.appendChild(svg_node("path", { d: dl, stroke: "lightgrey" }));
    defs.appendChild(svg_text_node());
    defs.appendChild(svg_node("use", { id: "rhomb2R", "xlink:href": "#rhomb2L", transform: `translate(${2*L*X} 0) rotate(180)` }));
    defs.appendChild(svg_node("use", { id: "rhomb2T", "xlink:href": "#rhomb2L", transform: `translate(${-L*X} ${-L*Y})` }));
    defs.appendChild(svg_node("use", { id: "rhomb2B", "xlink:href": "#rhomb2L", transform: `translate(${-L*X} ${L*Y})` }));
    defs.appendChild(svg_text_node());
        

    var cut = document.getElementById("cut");
    var grid = document.getElementById("grid");
    
    function draw_rhomb(parent, anchor, thick, from, alpha, color) {
        var O = parent[anchor];
        alpha += parent.alpha;

        var href = ( thick ? "#rhomb2" : "#rhomb" ) + from; // Left, Right, Top or Bottom

        var [ x0, y0 ] = O;
        cut.appendChild(svg_node("use", { "xlink:href": href, transform: `translate(${x0} ${y0}) rotate(${alpha})`, stroke: color || "black"}));
        
        // P diagonaly opposed to O, A and R are next to P in trigonometric order
        var c = Math.cos(alpha*d2r), s = Math.sin(alpha*d2r), f = ( u, v ) => [ x0+c*u-s*v, y0+s*u+c*v ];
        var du = L * (thick ? X : x );
        var dv = L * (thick ? Y : y );
        var P, Q, R;
        if (from=="L" || from=="R") {
            P = f( 2*du, 0 );
            Q = f( du, -dv );
            R = f( du,  dv );
        } else {
            if (from=="T") { dv = -dv; }
            P = f( 0, 2*dv );
            Q = f( du, dv );
            R = f( -du,  dv );
        } 
        return { P, Q, R, alpha };
    }

    function draw_penrose() {
        var A = { P: [ 0, 0 ], alpha: 0 };
        //var B = draw_rhomb(A, "P", 1, "L", 0);
        //var C = draw_rhomb(B, "P", 0, "L", -126);
        //return 

        for (var i=0; i<5; i++) {
            var B = draw_rhomb(A, "P", 1, "L", 72*(i+1));
            var C = draw_rhomb(B, "P", 0, "L", -(72+36+18));
            var _ = draw_rhomb(C, "R", 1, "L", 18);
            var _ = draw_rhomb(C, "R", 1, "L", 18+72);
            var F = draw_rhomb(C, "R", 1, "L", 18+72+72);
            var _ = draw_rhomb(F, "P", 0, "R", 18+36);
            var _ = draw_rhomb(F, "P", 0, "L", 18);
            var _ = draw_rhomb(F, "P", 0, "L", -(72+36+18));
            var J = draw_rhomb(F, "P", 0, "R", -(72+18));
            var K = draw_rhomb(J, "R", 1, "T", 234);
            var R = draw_rhomb(K, "R", 1, "L", -72, "blue");
            var L = draw_rhomb(K, "R", 1, "L", -144, "blue");
            var _ = draw_rhomb(L, "P", 0, "R", 108+18, "orange");
            var _ = draw_rhomb(L, "P", 0, "L", 90, "orange");
            var _ = draw_rhomb(L, "P", 0, "R", 54, "red");
            var _ = draw_rhomb(L, "P", 0, "L", -72-54, "green");
            var _ = draw_rhomb(L, "P", 0, "R", -72-18, "green");
            
            var S = draw_rhomb(R, "P", 1, "B", -36);
            var _ = draw_rhomb(S, "P", 2, "B", -72);
            var U = draw_rhomb(J, "R", 1, "B", -54);
            var V = draw_rhomb(U, "Q", 0, "R", 180-54);
            var _ = draw_rhomb(V, "P", 0, "R", -144, "red");
            var _ = draw_rhomb(V, "P", 0, "L", -144+36, "red");
            var _ = draw_rhomb(V, "P", 0, "R", -144+72, "red");
            var _ = draw_rhomb(V, "P", 0, "L", -144+108, "red");
            // var _ = draw_rhomb(W, "P", 0, "L", -144);
            var W = draw_rhomb(U, "Q", 1, "B", -36);
            var _ = draw_rhomb(W, "Q", 0, "R", 126);
            var _ = draw_rhomb(W, "Q", 0, "L", 90);
        }
    } 
    
    function draw_print() {
        for (var k=0; k<4; k++) {
            var x0 = 1.2*L*k, y0 = +0.2*L*k;
            for (var i=0; i<4; i++) {
                cut.appendChild(svg_node("use", { "xlink:href": "#rhombL", transform: `translate(${x0} ${y0-2*L*Y*i}) rotate(18)` }));
                cut.appendChild(svg_text_node());
                cut.appendChild(svg_node("use", { "xlink:href": "#rhombR", transform: `translate(${x0} ${y0-2*L*Y*i}) rotate(-18)` }));
                cut.appendChild(svg_text_node());
            }
        }

        for (var k=0; k<6; k++) {
            var x0 = 1.2*L*(k+4.2), y0 = 0.2*L*2.5 + (k%2)*L*0.6;
            for (var i=0; i<(4+(k%2)); i++) {
                cut.appendChild(svg_node("use", { "xlink:href": "#rhomb2L", transform: `translate(${x0} ${y0-2*L*Y*i})` }));
                cut.appendChild(svg_text_node());
            }
        }

    }

    if (1)
        draw_penrose();
    else 
        draw_print();

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
