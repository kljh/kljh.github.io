'use strict';

const TwoPi = 2*Math.PI;
const d2r = TwoPi / 360.;
const r2d = 1/d2r;

function init() {
    if (localStorage["model"])
        document.getElementById("model").value = localStorage["model"];

    draw();
}

function draw() {
    var prms = get_inputs();
    localStorage["model"] = prms.model;

    var cut = document.getElementById("cut");
    cut.textContent = "";

    var arc_models = new Set([ "gray_code", "binary_code", "random_balance" ]);
    if (prms.model == "iso_grid") {
        draw_iso_grid();
    } else if (prms.model == "iso_tri") {
        draw_iso_tri();
    } else if (prms.model == "iso_tri_flip") {
        draw_iso_tri(true);
    } else if (arc_models.has(prms.model)) {

        var arcs;
        switch (prms.model) {
            case "gray_code":
                arcs = gray_code_arcs(); break;
            case "binary_code":
                arcs = binary_code_arcs(); break;
            case "random_balance":
                arcs = random_balance_arcs(); break;
            default:
                throw new Error("logic error");
        }
        draw_arcs(cut, arcs);

        cut.appendChild(svg_node("circle", { cx: 0, cy: 0, r: 45 }));
    } else if (prms.model.startsWith("dividing_plate")) {

        var nb_holes_choices = [
            [ 11, 12, 13, 14, 15, 16, 17 ],
            [ 12, 14, 16, 18, 20, 22, 24 ],
            [ 12, 15, 18, 21, 24, 27, 30 ],
            [ 12, 16, 20, 24, 28, 32, 36 ],
            [  5, 10, 15, 20, 25, 30, 35 ],
            [  7,  5, 13, 11, 17, 23, 19 ]];

        var k = Array.from(prms.model).pop() * 1 - 1;
        var nb_holes = nb_holes_choices[k];
        dividing_plate(cut, nb_holes);

        cut.appendChild(svg_node("circle", { cx: 0, cy: 0, r: 45 }));    
    }

    download_link();
}

function draw_iso_grid() {
    var dx = 5;
    var dh = dx * Math.sqrt(3)/2;
    
    var grid = document.getElementById("grid");
    
    function hex(n) {
        var nn = 2*n;
        grid.appendChild(svg_node("line", { x1: -nn*dx, y1:   0*dh, x2:  -n*dx,  y2: -nn*dh }));
        grid.appendChild(svg_node("line", { x1:  -n*dx, y1: -nn*dh, x2:   n*dx,  y2: -nn*dh }));
        grid.appendChild(svg_node("line", { x1:   n*dx, y1: -nn*dh, x2:  nn*dx,  y2:   0*dh }));
        grid.appendChild(svg_node("line", { x1:   n*dx, y1:  nn*dh, x2:  nn*dx,  y2:   0*dh }));
        grid.appendChild(svg_node("line", { x1:  -n*dx, y1:  nn*dh, x2:   n*dx,  y2:  nn*dh }));
        grid.appendChild(svg_node("line", { x1: -nn*dx, y1:   0*dh, x2:  -n*dx,  y2: nn*dh }));
    }
    
    hex(4.1);
    hex(4.6);

    grid.appendChild(svg_node("circle", { cx: 0, cy: 0, r: 40 }));
    grid.appendChild(svg_node("circle", { cx: 0, cy: 0, r: 45 }));
    
    function hex_grid() {
        var n = 15;
        for (var j=-n; j<n; j++) {
            var x0 = ( j % 2 ) / 2 * dx;
            var y = j * dh;
            for (var i=-n; i<n; i++)  {
                grid.appendChild(svg_node("line", { x1: x0+i*dx, x2: x0+(i+1)*dx, y1: y, y2: y }));
                grid.appendChild(svg_node("line", { x1: x0+i*dx, x2: x0+(i+0.5)*dx, y1: y, y2: y+dh }));
                grid.appendChild(svg_node("line", { x1: x0+i*dx, x2: x0+(i+0.5)*dx, y1: y, y2: y-dh }));
            }
        }
    }
    hex_grid();
    
}

function draw_iso_tri(flip) {
    var dx = 5;
    var dh = dx * Math.sqrt(3)/2;
    var dX = 3 * dx, dH = 3 * dh;

    var defs = document.getElementById("svg-defs");
    var cut = document.getElementById("cut");

    var g = defs.appendChild(svg_node("g", { id: "hline"}));
    g.appendChild(svg_node("line", { x1: -3*dX, x2: 3*dX, y1: 0, y2: 0 }));
    g.appendChild(svg_node("line", { x1: -2.5*dX, x2: 2.5*dX, y1: dH, y2: dH }));
    g.appendChild(svg_node("line", { x1: -2.5*dX, x2: 2.5*dX, y1: -dH, y2: -dH }));
    g.appendChild(svg_node("line", { x1: -2*dX, x2: 2*dX, y1: 2*dH, y2: 2*dH }));
    g.appendChild(svg_node("line", { x1: -2*dX, x2: 2*dX, y1: -2*dH, y2: -2*dH }));
    g.appendChild(svg_node("line", { x1: -1.5*dX, x2: 1.5*dX, y1: 3*dH, y2: 3*dH }));
    g.appendChild(svg_node("line", { x1: -1.5*dX, x2: 1.5*dX, y1: -3*dH, y2: -3*dH }));
    
    cut.appendChild(svg_node("use", { href: "#hline" }));
    cut.appendChild(svg_node("use", { href: "#hline", transform: "rotate(60)" }));
    cut.appendChild(svg_node("use", { href: "#hline", transform: "rotate(120)" }));

    var g = defs.appendChild(svg_node("g", { id: "tri"}));
    g.appendChild(svg_node("line", { x1: 1.5*dx, x2: 0.5*dx, y1: dh, y2: dh }));
    g.appendChild(svg_node("line", { x1: 1.5*dx, x2: 2*dx, y1: dh, y2: 0 }));
    g.appendChild(svg_node("line", { x1: 1.5*dx, x2: 2*dx, y1: dh, y2: 2*dh }));

    var g = defs.appendChild(svg_node("g", { id: "tris"}));
    for (var i=0, x0=-3*dX, y0=0; i<6; i++) {
        g.appendChild(svg_node("use", { href: "#tri", transform: `translate(${x0+i*dX} ${y0})` }));
    }
    for (var i=0, x0=-2.5*dX, y0=dH; i<5; i++) {
        g.appendChild(svg_node("use", { href: "#tri", transform: `translate(${x0+i*dX} ${-y0})` }));
        g.appendChild(svg_node("use", { href: "#tri", transform: `translate(${x0+i*dX} ${y0})` }));
    }
    for (var i=0, x0=-2*dX, y0=2*dH; i<4; i++) {
        g.appendChild(svg_node("use", { href: "#tri", transform: `translate(${x0+i*dX} ${-y0})` }));
        g.appendChild(svg_node("use", { href: "#tri", transform: `translate(${x0+i*dX} ${y0})` }));
    }
    for (var i=0, x0=-1.5*dX, y0=3*dH; i<3; i++) {
        g.appendChild(svg_node("use", { href: "#tri", transform: `translate(${x0+i*dX} ${-y0})` }));
    }

    var transform = flip ? "scale(1 -1)" : "rotate(180)";
    cut.appendChild(svg_node("use", { href: "#tris" }));
    cut.appendChild(svg_node("use", { href: "#tris", transform }));
    
}

function gray_encode(x) { return gray_codec(x, true); }
function gray_decode(x) { return gray_codec(x, false); }
function gray_codec(x, bEncode) {
    var n = Math.ceil(Math.log2(x+1)); // max: 31
    var y = 0;
    var inv = false;
    for (var i=n; i<=0; i--) {
        var mask = 1 << i;
        var xi = x & mask;
        var yi = inv ? xi ^ mask : xi;
        y = y | yi;
        if (bEncode) {
            if (xi) inv = !inv;
        else 
            if (yi) inv = !inv;
        }
    }
}

function gray_code_arcs() {
    var arcs = [];
    var r = 6, dr = 5;
    for (var k=0; k<8; k++, r+=dr) {
        var n = k==0 ? 1 : 1 << (k-1);
        var a0 = k==0 ? 0 :  - Math.PI / (2*n)
        var da = Math.PI / n;
        for (var i=0; i<n; i++) 
            arcs.push({ r, a1: a0 + (2*i+1)*da, a2: a0 + (2*i+2)*da });
    } 
    return arcs;
}

function binary_code_arcs() {
    var arcs = [];
    var r = 12, dr = 5;
    for (var k=0; k<7; k++, r+=dr) {
        var n = 1 << k;
        var da = Math.PI / n;
        for (var i=0; i<n; i++) 
            arcs.push({ r, a1: (2*i+1)*da, a2: (2*i+2)*da });
    } 
    return arcs;
}

function random_balance_arcs() {
    var arcs = [];
    var arc_avg_len = 10;
    var rmax = 40;
    for (var r=10; r<rmax; r+=5) {
        var nb = Math.ceil(TwoPi*r/(2*arc_avg_len));
        var aa = Array(2*nb).fill(null).map(_ => TwoPi * Math.random());
        aa.sort();
        for (var i=0; i<nb; i++)
            arcs.push({ r, a1: aa[2*i], a2: aa[2*i+1] });
    }

    // balance the disc
    var Tx = 0, Ty = 0;
    for (var arc of arcs) {
        // each the arc is equivalent to mass point located at polar coordinate (d, alpha)
        // d = Int_{-demia}^{demia} r.cos(t).r.dt = 2.r^2.sin(demia)
        var alpha = ( arc.a1 + arc.a2 ) / 2;
        var demia = ( arc.a2 - arc.a1 ) / 2;
        var d = arc.r*arc.r * 2 * Math.sin(demia);
        // this cause torque around e_j and e_i axis
        Tx += d * Math.cos(alpha);
        Ty += d * Math.sin(alpha);
    }
    // these can be compensated with a weight at (D, ALPHA)
    var D = Math.sqrt(Tx*Tx+Ty*Ty);
    var ALPHA = Math.acos(Tx/D) * Math.sign(Ty) + Math.PI;
    var DEMIA = Math.asin( D / (2*rmax*rmax) );
    arcs.push({ r: rmax, a1: ALPHA-DEMIA, a2: ALPHA+DEMIA });

    return arcs;
}

function draw_arcs(g, arcs) {
    var dr = 0.7;
    for (var arc of arcs) {
        var { r, a1, a2 } = arc; 
        var da = dr / r;
        var r0 = r - dr, r1 = r + dr;
        var c1 = Math.cos(a1+da), s1 = Math.sin(a1+da), c2 = Math.cos(a2-da), s2 = Math.sin(a2-da);
        if (Math.abs(a2-a1)<2*da) continue;
        var large = Math.abs(a2-a1) > Math.PI;
        // A rx ry x-axis-rotation large-arc-flag sweep-flag x y
        // var d = `M ${r*c1)} ${r*s1)} A ${r} ${r} 0 ${large?1:0} 1 ${r*c2} ${r*s2}`;
        var d = `M ${r1*c1} ${r1*s1} A ${r1} ${r1} 0 ${large?1:0} 1 ${r1*c2} ${r1*s2} A ${dr} ${dr} 0 0 1 ${r0*c2} ${r0*s2} A ${r0} ${r0} 0 ${large?1:0} 0 ${r0*c1} ${r0*s1} A ${dr} ${dr} 0 0 1 ${r1*c1} ${r1*s1}`;
        g.appendChild(svg_node("path", { d }));
    }

    var r = 40;
    var path_elnt = svg_node("path", { id: "myTextPath0", d: `M ${-r} 0 A ${r} ${r} 0 0 1 ${r} 0` });
    //var text_elnt = svg_node("text", {}); text_elnt.textContent = "Engineering Series"
    var tpth_elnt = svg_node("textPath", { "href": "#myTextPath0"}); tpth_elnt.textContent = "Engineering Series"
    var text_elnt = svg_node("text", {}); text_elnt.appendChild(tpth_elnt);
    // g.appendChild(path_elnt);
    // g.appendChild(text_elnt);

}

function dividing_plate(g, nb_holes) {
    for (var i=0; i<nb_holes.length; i++) {
        var n = nb_holes[i] 
        var R = 5*i + 10;
        var r = 1.5;
        for (var j=0; j<n; j++) {
            var a = TwoPi*j/n;
            var cx = R * Math.cos(a), cy = R * Math.sin(a); 
            g.appendChild(svg_node("circle", { cx, cy, r }));
        }
    }
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
    var elnts2 = document.getElementsByTagName("select");
    var elnts = [].concat(Array.from(elnts), Array.from(elnts2));
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
