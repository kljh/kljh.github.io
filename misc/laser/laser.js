'use strict';

const TwoPi = 2*Math.PI;
const d2r = TwoPi / 360.;
const r2d = 1/d2r;

const namespaces = {
    xlink: "http://www.w3.org/1999/xlink"
};

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

function download_link(svg_id) {
    // Download link
    var svg_elnt = document.getElementById(svg_ || "svg_elnt");
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
            ns = namespaces[tmp[0]]; 
        el.setAttributeNS(ns, name, attrs[k]);
    }
    return el;
}
