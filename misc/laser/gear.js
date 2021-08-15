'use strict';

const TwoPi = 2*Math.PI;
const deg = TwoPi / 360.;
const rad = 1/deg;

const namespaces = {
    xlink: "http://www.w3.org/1999/xlink"
};

function init() {
    UpdateGears();

    var iStep = 0;
    var alphaA = 0;
    var alphaB = 0;
    var xRack = 0;
           
    function animation_step() {
        var inputs = get_inputs();
        var nA = inputs.g1t;
        var nB = inputs.g2t;
        
        var teethPct = 1/100; 
        var dalphaA = teethPct * 360 / nA;
        var dalphaB = teethPct * 360 / nB;
        var dxRack  = teethPct * inputs.toothspace;

        if (inputs.animate) {
            rotateZ("rotA", alphaA);
            rotateZ("rotB", alphaB);
            translateXY("rack", 0, xRack);
            
            alphaA = (alphaA + dalphaA) % 360;
            alphaB = (alphaB - dalphaB + 360) % 360;
            xRack  = (xRack  + dxRack) % inputs.toothspace;
        } 
        setTimeout(animation_step, inputs.animate ? 50 : 500);
    }
    animation_step(); 
}

function UpdateGears() {
    var inputs = get_inputs();
    var pa = inputs.contangle * deg; // pressure angle
    var nA = inputs.g1t, nB = inputs.g2t;

    // pitch diameter (mm)
    var RA = (inputs.toothspace * nA) / TwoPi;
    var RB = (inputs.toothspace * nB) / TwoPi;
    // base diameter (mm)
    var rA = RA * Math.cos(pa);
    var rB = RB * Math.cos(pa);
    
    var alpha0 = Math.tan(pa) - pa;

    var svg_elnt = document.getElementById("gearview");
    if (!inputs.zoom) {
        var wA = 2 * RA * ( 1 + 2.2/nA )
        var wB = 2 * RB * ( 1 + 2.1/nB )
        var w = inputs.twogears ? wA+wB : wA;
        var h = inputs.twogears ? Math.max(wA, wB) : wA;
        svg_elnt.setAttribute("viewBox", `${-wA} ${-h/2} ${w} ${h}`);
    } else {
        var d = 1.5 * inputs.toothspace;
        svg_elnt.setAttribute("viewBox", `${-d/2} ${-d/2} ${d} ${d}`);
    }

    var defs = document.getElementById("svg-defs");
    defs.innerHTML = "";
        
    
    function draw_gear(id, r, N, pa, alpha0) {
        var R = r / Math.cos(pa);
    
        var { path, alphaPitch } = involute(r, N, pa, !inputs.tipclear);
        var d = svg_path(path);
        defs.appendChild(svg_node("path", { id: id+"involute", d }));

        var path2 = tip_clearance(r, N, pa);
        var d2 = svg_path(path2);
        defs.appendChild(svg_node("path", { id: id+"clearance", d: d2 }));

        var elnt = document.getElementById(id);
        elnt.innerHTML = "";
        if (inputs.cline)
            elnt.appendChild(svg_node("circle", { cx: 0, cy: 0, r, class: "construct cline" }));
        if (inputs.pdia) 
            elnt.appendChild(svg_node("circle", { cx: 0, cy: 0, r: R, class: "construct pdia" }));
        elnt.appendChild(svg_node("circle", { cx: 0, cy: 0, r: inputs.shafthole / 2, class: "shaft" }));
        for (var i=0; i<N; i++) {
            var transform = "rotate("+(360*(i-0.25)/N - alphaPitch * rad + alpha0)+")";
            //elnt.appendChild(svg_node("path", { transform, d }));
            elnt.appendChild(svg_node("use", { "xlink:href": "#"+ id+"involute", transform }));
            var transform = "scale(1,-1) rotate("+(360*(i-0.25)/N - alphaPitch * rad - alpha0)+")";
            //elnt.appendChild(svg_node("path", { transform, d }));
            elnt.appendChild(svg_node("use", { "xlink:href": "#"+ id+"involute", transform }));
     
            if (inputs.tipclear) {
                var transform = "rotate("+(360*(i+0.5)/N)+")";
                elnt.appendChild(svg_node("use", { "xlink:href": "#"+ id+"clearance", transform }));
            }
        }
    }

    function draw_rack(id, pitch, pa) {
        // pitch = distance between teeth
        // module = height of teeth above and below pitch line
        var module = pitch / Math.PI;  
        var dx = Math.sin(pa) * module;

        var elnt = document.getElementById(id);
        var path = [ 
            [ -module, pitch/2 ], 
            [ -module, pitch/4+dx ], 
            [ +module, pitch/4-dx ],
            [ +module*1.15, (pitch/4-dx)/2 ] ];
        path = path.concat(path.map(coords => [ coords[0], -coords[1] ]).reverse())
        var d = svg_path(path);
        
        defs.appendChild(svg_node("path", { id: "def-"+id, d }));
        for (var i=-3; i<=3; i++) {
            var transform = "translate(0, "+(i*pitch)+")";
            
            elnt.appendChild(svg_node("use", { "xlink:href": "#def-"+ id, transform }));
        }

    }

    draw_gear("rotA", rA, nA, pa, 0);
    if (inputs.twogears)
        draw_gear("rotB", rB, nB, pa, 180*(1+1/nB));
    else 
        document.getElementById("rotB").innerHTML = "";
    if (inputs.rack)
        draw_rack("rack", inputs.toothspace, pa);
    translateXY("A", -RA);
    translateXY("B", +RB);
        
    // construction elements    
    var x1 = -RA + rA * Math.cos(pa);
    var y1 = rA * Math.sin(pa);
    var x2 = RB - rB * Math.cos(pa);
    var y2 = - rB * Math.sin(pa);

    var elnt = document.getElementById("construct");
    elnt.innerHTML = "";
    if (inputs.crosshair) {
        elnt.appendChild(svg_node("line", { x1: -RA, y1: -0.4*rA, x2: -RA, y2: 0.4*rA, class: "construct" }));
        elnt.appendChild(svg_node("line", { x1: -1.4*RA, y1: 0, x2: -0.6*RA, y2: 0.0, class: "construct" }));
    }
    if (inputs.crosshair && inputs.twogears) {
        elnt.appendChild(svg_node("line", { x1: +RB, y1: -0.4*rB, x2: +RB, y2: 0.4*rB, class: "construct" }));
        elnt.appendChild(svg_node("line", { x1: +0.6*RB, y1: 0, x2: +1.4*RB, y2: 0.0, class: "construct" }));
    }
    if (inputs.cline) {
        elnt.appendChild(svg_node("line", { x1, y1, x2, y2, class: "construct" }));
        elnt.appendChild(svg_node("line", { x1, y1: -y1, x2, y2: -y2, class: "construct" }));
    }
    
     download_link();
}


function involute(r, N, pa, basic_tip_clearance) {
    var R = r / Math.cos(pa);
    var dR = TwoPi*R/N / Math.PI;

    function t_to_xy(t) {
        var x = r * ( Math.cos(t) + t * Math.sin(t) );
        var y = r * ( Math.sin(t) - t * Math.cos(t) );
        return [ x, y ];   
    }

    function t_to_r(t) {
        var [ x, y ] = t_to_xy(t);
        return Math.sqrt(x*x + y*y);   
    }
    function t_to_alpha(t) {
        var [ x, y ] = t_to_xy(t);
        return Math.atan(y/x);   
    }

    var tPitch = bisect_solve_1d(t => t_to_r(t) - R, 0, 3.2);
    var tToTip = bisect_solve_1d(t => t_to_r(t) - (R+dR), 0, 3.2);
    var alphaPitch = t_to_alpha(tPitch);
        
    var path = [];
    var dt = TwoPi/N / 50;
    for (var t=0; ; t+=dt) {
        var x = r * ( Math.cos(t) + t * Math.sin(t) );
        var y = r * ( Math.sin(t) - t * Math.cos(t) );
        path.push([x, y]);
        if ( x*x + y*y > (R+dR)*(R+dR))
            break;
    }

    var Rbase = Math.max(R-1.15*dR, 0);
    var tip_clearance = t
    path = [].concat(
        basic_tip_clearance ? [
        [ Rbase * Math.cos(-TwoPi/N/4 + alphaPitch), Rbase * Math.sin(-TwoPi/N/4 + alphaPitch) ],
        [ Rbase * Math.cos(-TwoPi/N/16),             Rbase * Math.sin(-TwoPi/N/16) ],
        [ (R-dR), 0 ] ] : [],
        path, 
        [
        [ (R+dR) * Math.cos(TwoPi/N/4 + alphaPitch), (R+dR) * Math.sin(TwoPi/N/4 + alphaPitch) ],
        ] );

    // console.log("alphaPitch", alphaPitch, "(rad)");
    // console.log("alphaPitch", alphaPitch * rad, "(deg)");

    return { path, alphaPitch };    
}

function tip_clearance(r, N, pa) {
    var R = r / Math.cos(pa);
    var pitch = R * TwoPi / N;
    var module = pitch / Math.PI * 1.02;  

    var path = [];    
    var alpha = 0; 
    var da = TwoPi / N / 25, 
        dy = pitch / 25;
    var x = R - module, 
        y = pitch/4 - Math.sin(pa) * module;

    for (var i=0; ; i++) {
        // switch to polar coords
        var d = Math.sqrt(x*x + y*y);
        var a = Math.atan(y/x);
        // polar coords relative to the gear referential 
        a = a - alpha
        // back tp cartesian coords, still relative to the gear referential  
        var x_G = d * Math.cos(a), 
            y_G = d * Math.sin(a);
        path.push([ x_G, y_G ]);
        
        if (d > R + module/6)
            break;
        alpha += da;
        y += dy;
    }

    path = path.map(coords => [ coords[0], -coords[1] ]).reverse().concat(path);
    return path;
}

function download_link() {
    // Download link
    var svg_elnt = document.getElementById("gearview");
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

function bisect_solve_1d(fx, x0, x1) {
    var y0 = fx(x0);
    var y1 = fx(x1);

    if (y0*y1>0) throw new Error("no bracketing");
    for (var i=0; i<25; i++) {
        var x = (x0+x1)/2;
        var y = fx(x);
        //console.log("bisect_solve_1d", x, y)
        
        if (y*y1>0) {
            x1 = x; y1 = y;
        } else {
            x0 = x; y0 = y;
        }
        if (Math.abs(x1-x0)<1e-7)
            return x;   
    }
    throw new Error("bisect_solve_1d hasn't converged");
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
        var tmp = k.split(":");
        if (tmp.length==2)
            ns = namespaces[tmp[0]]; 
        el.setAttributeNS(ns, name, attrs[k]);
    }
    return el;
}
