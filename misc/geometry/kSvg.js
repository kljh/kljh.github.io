
var 
  // y-a-t'il interaction ?
  appui=false,
  // l'objet en cours de deplacement
  obj="",
  // les contraintes associes au deplacement ("translation" ou "rotation" ou nom de la contrainte)
  objcstr = "",
  // position initiale de l'objet 
  xo=0, yo=0,
  // position initiale du curseur
  xmo=0,ymo=0,
  // le doc svg, ses dimensions
  svgdoc, svgwidth, svgheight, 
  // le groupe svg racine, le groupe courant
  drawRoot, drawGroup, drawFrontGroup;
  // xml, redrawList = new Array();

var 
  // Reperes pour transformations 3D
  trRepere, trRepereInv, trProj, trCam,
  // angles (lacet, tanguage, roulis)
  head=0, pitch=0, roll=0;

var graph = {
    node_calculation_order : [], // implemntation detail : in which order do we calculate nodes in a brute force maneer
    nodes : {} // [id] node map. Each node contains : prec and succ (id arrays), formula (fct), value (any). Optoinal: rng_repr (rng or fct), html_repr (html or fct)
  }
/*
 
 Placement camera / scene
 M = trRepere * Mo
  = trRepere.R * Mo + trRepere.t
 inv:
 Mo = inv(trRepere.R) * (M - trRepere.t)
 
 Projection de M:x,y,z (sur P:px+qy+rz=t avec |n>|=|p,q,r|=1 )
 px+qy+rz=tm 
 Mp = M + (t-tm).n>
 inv:
 M = Mp - (t-tm).n>   (avec conservation de tm, distance du point au plan de proj)
 
 Projection de M sur plan focal
 do : dst camera origine
 df : dst focale
 dz = do-z
 u = x * df/dz
 v = y * df/dz
 inv (cas pt libre) :
 x = u * dz/df
 y = v * dz/df
 z = do-dz          (avec conservation de dz, distance du point au plan focal)
 inv (cas point de P:px+qy+rz=t) :
 x = k * u
 y = k * v
 dz = k * df => z = do - k * df 
 => k.(p.u+q.v-r.df) = t-r.do
 => k = (t-r.do) / (p.u+q.v-r.df)
 
*/

function get_tranform_values(obj) {
  var tr = obj.getAttribute("transform");
  if (tr.substr) {
    // tranform is a string
    var t = tr.replace("matrix(", "").replace(")", "");
    t = t.split(/ |,/);
    // t should be of size 6
    for (var i=0; i<6; i++)
      t[i] = parseFloat(t[i]);
    return t;
  } else {
    // transform is a SVG object
    throw new Error(argument.callee.name)
    var s = new String(tr);
    return [];
  }
}

function svginit(evt, id) {
  if ( typeof(evt) == "undefined" ) {
    // embedded SVG
    svgdoc = document;
    svgelnt = document.getElementById("svgEmbedId");
    svgwidth = svgelnt.width.baseVal.value;
    svgheight = svgelnt.height.baseVal.value;
  } else {
    if ( typeof(evt) == "string" ) {
      //alert("html");
      // Case we are called from within html
      svgdoc = document.embeds[evt].getSVGDocument()
    } else {
      //alert("svg");
      // Case we are called from within svg
      svgdoc = evt.getTarget ? evt.getTarget().getOwnerDocument() : document;
    }
    //alert(svgdoc);

    var svgroot = svgdoc.rootElement ? svgdoc.rootElement : svgdoc.getRootElement();
    svgwidth = svgroot.getAttribute("width");
    svgheight = svgroot.getAttribute("height");
    //alert("w x h : " + svgdoc.getRootElement() + " | " + svgwidth + " x " + svgheight );
  }
  
  drawRoot = svgdoc.getElementById("gId");
  drawGroup = svgdoc.getElementById("gBack");
  drawFrontGroup = svgdoc.getElementById("gFront");
  
  var elnt = svgdoc.getElementById('bckgrndId');
  if (elnt!=null) {
    elnt.setAttribute("width", svgwidth);
    elnt.setAttribute("height", svgheight);
  }

  return svgdoc;
}


function cmd_instruction(msg, timeout_sec) {
  var cmd = document.getElementById("cmd");
  if (!cmd)
    return ;

  if (msg)
    cmd.setAttribute("placeholder",msg);

  if (!msg || timeout_sec) 
    setTimeout(function() {
      cmd.setAttribute("placeholder","Type 'P' for point, 'L' for line, or 'C' for circle or Use icons.");      
    }, (timeout_sec||2)*1000);
}

var g_counter = 0; 
function user_create_unconstraint_point() {
  next_click_handler = user_create_unconstraint_point_click_handler;
  cmd_instruction("click anywhere to create a new point");

  function user_create_unconstraint_point_click_handler(evt) {
    var pt = Point( "P"+(g_counter++), evt.offsetX, evt.offsetY, true );
    cmd_instruction("added "+pt+" at "+evt.offsetX+","+evt.offsetY, 2);
  }
}
function user_create_intersect() {
  var state = {
    args_descs : [ "first path to interesect", "second path to interesect" ],
    args_types : [ "path", "path" ],
    args_ids : []
    };


  next_click_handler = user_create_intersect_click_handler;
  cmd_instruction("click on "+state.args_descs[state.args_ids.length]+".");
  function user_create_intersect_click_handler(evt) {
    var elnt = evt.target;
    if (!elnt.id)
      elnt = elnt.parentNode; 
    
    if (elnt.classList.contains("geom")) {
      if (elnt.classList.contains("geomPath")) 
        state.args_ids.push(elnt.id);
      else 
        console.log(arguments.callee.name+" : "+elnt.id+" is not a path (line or circle).");
    } else {
        console.log(arguments.callee.name+" : "+elnt.id+" is not a geometric object.");

    }

    if (state.args_ids.length<state.args_types.length) {
      // next item to select
      next_click_handler = user_create_intersect_click_handler;
      cmd_instruction("selected "+JSON.stringify(state.args_ids)+", click on "+state.args_descs[state.args_ids.length]+"."); 
    } else { 
      // all arguments selected

      var near_point = get_closest_point(evt);

      var pt = Intersect( "I"+(g_counter++), state.args_ids[0], state.args_ids[1], near_point.id);
      
      cmd_instruction("creating point at intersection "+JSON.stringify(state.args_ids)+" (near point "+near_point.id+").", 0);
    }
  }
}
function user_create_line() {
  next_click_handler = user_create_line_select_first_point_click_handler;
  cmd_instruction("click on first point.."); 

  function user_create_line_select_first_point_click_handler(evt1) {
    var first_point = get_closest_point(evt1);
    
    till_click_handler = user_create_line_select_second_point_move_handler;
    next_click_handler = user_create_line_select_second_point_click_handler;
    cmd_instruction("selected "+JSON.stringify(first_point.id)+", click on second point.."); 

    var interactive_line = svgdoc.getElementById("interactive_line");
    interactive_line.setAttribute("x1", first_point.x);
    interactive_line.setAttribute("y1", first_point.y);
    user_create_line_select_second_point_move_handler(evt1)
    function user_create_line_select_second_point_move_handler(evt2) {
      var second_point = get_closest_point(evt2);
      interactive_line.setAttribute("x2", (second_point.d<25 || second_point.d==0) ? second_point.x : second_point.m.x);
      interactive_line.setAttribute("y2", (second_point.d<25 || second_point.d==0) ? second_point.y : second_point.m.y);
    }
    function user_create_line_select_second_point_click_handler(evt2) {
      setTimeout(function() {
        interactive_line.setAttribute("x1", 5);
        interactive_line.setAttribute("y1", 5);
        interactive_line.setAttribute("x2", 10);
        interactive_line.setAttribute("y2", 10);
      }, 2000);

      var second_point = get_closest_point(evt2);
    
      var ln = Line( "L"+(g_counter++), first_point.id, second_point.id);
      
      cmd_instruction("added line "+ln+" ( "+first_point.id+" "+second_point.id+" )", 2); 
    }
  }
}
function user_create_circle() {
  next_click_handler = user_create_circle_select_first_point_click_handler;
  cmd_instruction("click on first point.."); 

  function user_create_circle_select_first_point_click_handler(evt1) {
    var first_point = get_closest_point(evt1);
    
    till_click_handler = user_create_circle_select_second_point_move_handler;
    next_click_handler = user_create_circle_select_second_point_click_handler;
    cmd_instruction("selected "+first_point.id+", click on second point.."); 

    var interactive_circle = svgdoc.getElementById("interactive_circle");
    interactive_circle.style = "stroke:darkblue; fill:lightblue; stroke-width:2;"
    interactive_circle.setAttribute("cx", first_point.x);
    interactive_circle.setAttribute("cy", first_point.y);
    user_create_circle_select_second_point_move_handler(evt1)
    function user_create_circle_select_second_point_move_handler(evt2) {
      var second_point = get_closest_point(evt2);
      var second_point = (second_point.d<25 || second_point.d==0) ? second_point : second_point.m;
      var r = distance_point(first_point, second_point);
      interactive_circle.setAttribute("r", r);
    }
    function user_create_circle_select_second_point_click_handler(evt2) {
      // transition: <property> <duration> <timing-function> <delay>;
      interactive_circle.style = "stroke:none; fill:lightblue; stroke-width:2; fill-opacity:0.0; transition: all 2s ease;"
      setTimeout(function() {
        interactive_circle.setAttribute("cx", 5);
        interactive_circle.setAttribute("cy", 5);
        interactive_circle.setAttribute("r", 2);
      }, 2000);

      var second_point = get_closest_point(evt2);
    
      var ln = Circle( "C"+(g_counter++), first_point.id, second_point.id);
      
      cmd_instruction("added circle C"+g_counter+" ( "+first_point.id+" "+second_point.id+" )", 2); 
    }
  }
}
function user_create_circle3() {
  next_click_handler = user_create_circle3_select_first_point_click_handler;
  cmd_instruction("click on first point to mesure radius."); 

  function user_create_circle3_select_first_point_click_handler(evt1) {
    var first_point = get_closest_point(evt1);
    
    till_click_handler = user_create_circle3_select_second_point_move_handler;
    next_click_handler = user_create_circle3_select_second_point_click_handler;
    cmd_instruction("selected "+first_point.id+", click on second point to mesure radius."); 

    var interactive_circle = svgdoc.getElementById("interactive_circle");
    interactive_circle.style = "stroke:darkblue; fill:lightblue; stroke-width:2;"
    user_create_circle3_select_second_point_move_handler(evt1)
    function user_create_circle3_select_second_point_move_handler(evt2) {
      var second_point = get_closest_point(evt2);
      var second_point = (second_point.d<25 || second_point.d==0) ? second_point : second_point.m;
      var r = distance_point(first_point, second_point);
      interactive_circle.setAttribute("cx", second_point.x);
      interactive_circle.setAttribute("cy", second_point.y);
      interactive_circle.setAttribute("r", r);
    }
    function user_create_circle3_select_second_point_click_handler(evt2) {
      // nex handler will use this variable
      var second_point = get_closest_point(evt2);
      var second_point = (second_point.d<25 || second_point.d==0) ? second_point : second_point.m;
      var radius = distance_point(first_point, second_point);
      interactive_circle.setAttribute("r", radius);
    
      till_click_handler = user_create_circle3_select_third_point_move_handler;
      next_click_handler = user_create_circle3_select_third_point_click_handler;
      cmd_instruction("selected "+second_point.id+", click on third point to select center position."); 

      function user_create_circle3_select_third_point_move_handler(evt3) {
        var third_point = get_closest_point(evt3);
        var third_point = (third_point.d<25 || third_point.d==0) ? third_point : third_point.m;
        interactive_circle.setAttribute("cx", third_point.x);
        interactive_circle.setAttribute("cy", third_point.y);
      }
      function user_create_circle3_select_third_point_click_handler(evt3) {
        // transition: <property> <duration> <timing-function> <delay>;
        interactive_circle.style = "stroke:none; fill:lightblue; stroke-width:2; fill-opacity:0.0; transition: all 2s ease;"
        setTimeout(function() {
          interactive_circle.setAttribute("cx", 5);
          interactive_circle.setAttribute("cy", 5);
          interactive_circle.setAttribute("r", 2);
        }, 2000);

        var third_point = get_closest_point(evt3);
        
        var ln = Circle( "C"+(g_counter++), third_point.id, first_point.id, second_point.id);
        
        cmd_instruction("added circle C"+g_counter+" ( C="+third_point.id+", r=["+first_point.id+","+second_point.id+"] )", 2); 
      }
    }
  }
}
function distance_point(P,Q) {
  var x = Q.x-P.x, y = Q.y-P.y;
  var d = Math.sqrt(x*x+y*y);  return d;
}

function evt_svg_coords(evt, svg_elnt) {
  var svg_bbox = svg_elnt.getBoundingClientRect();
  var svg_x = svg_bbox.left;
  var svg_y = svg_bbox.top;
  
  var target_bbox = evt.target.getBoundingClientRect();
  var target_x = target_bbox.left;
  var target_y = target_bbox.top;
  
  var xm = evt.offsetX + (target_x-svg_x);
  var ym = evt.offsetY + (target_y-svg_y);
  return { x: xm, y: ym };
}
function evt_svg_coords2(evt, svg_elnt) {
  var matrix = svg_elnt.getScreenCTM();

  var pt = svg_elnt.createSVGPoint();
  pt.x = evt.clientX;
  pt.y = evt.clientY;
  pt = pt.matrixTransform(matrix.inverse());
  return { x: pt.x, y: pt.y};
}

function get_closest_point(evt) {
  var closest_point, closest_distance = 99999;
  var all_points0 = svgdoc.getElementsByClassName("geomPoint"); // MDN
  var all_points1 = svgdoc.getElementsByName("geomPoint");
  var all_points2 = document.getElementsByTagName("g");
  var all_points3 = document.getElementsByTagNameNS("http://www.w3.org/2000/svg","g");
  var all_points = all_points2;

  var svg_elnt = document.getElementsByTagName("svg")[0];
  var pt = evt_svg_coords(evt, svg_elnt)
  var pt2 = evt_svg_coords2(evt, svg_elnt)

  var x2 = evt.clientX;
  var y2 = evt.clientY;
  
  var scroll_X  = window.scrollX // and window.scrollY

  var xm = pt.x, ym=pt.y;
  for (var ip=0; ip<all_points.length; ip++) {
    var p = all_points[ip];
    if (p.getAttribute("name")!="geomPoint")
      continue;
    var transfo = get_tranform_values(p);
    var xi = transfo[4];
    var yi = transfo[5];
    var d = Math.sqrt((xi-xm)*(xi-xm)+(yi-ym)*(yi-ym));
    if (!closest_point)
      closest_point = { id: p.id, x: xi, y: yi, m: { x: xm, y: ym }, d: d };
    if (d<closest_distance) {
      closest_point = { id: p.id, x: xi, y: yi, m: { x: xm, y: ym }, d: d };
      closest_distance = d;

      //console.log("  "+p.id+" "+xi+","+yi+" @ d="+d);
    }
  }
  //if (d>40)
  //  closest_point = { x: xm, y: ym, xm: xm, ym: ym, d: 0 };
  return closest_point;
}


var next_click_handler; // click handler for next click only
var till_click_handler; // move handler till next click
function cliquer(evt) {
  var target = evt.target || evt.getTarget();  // new syntax || old syntax
  var target_id =  target.getAttribute("id");
  var target_class = target.getAttribute("class");
  if (target_class=="icon") {
    if (target_id=="iconPoint")
      user_create_unconstraint_point();
    else if (target_id=="iconIntersect")
      user_create_intersect();
    else if (target_id=="iconLine")
      user_create_line();
    else if (target_id=="iconCircle")
      user_create_circle();
    else if (target_id=="iconCircle3")
      user_create_circle3();
    else
      throw new Error("unhandled icon "+target_id);
    return;
  }
  if (next_click_handler) {
    var tmp = next_click_handler;
    till_click_handler = undefined;
    next_click_handler = undefined;
    tmp(evt);
  }

  movable = target.getAttribute("movable");
  gmovable = target.parentNode.getAttribute("movable");
  
  //if (evt.ctrlKey || evt.metaKey) { alert("ctrl"); }
  
  if ((movable=="rxy")||(gmovable=="rxy")||(movable=="cstr")||(gmovable=="cstr")) {
  	
  //if ((movable!=null)||(gmovable!=null)) {
    if ((movable=="rxy")||(movable=="cstr")) 
      obj = target;
    else
      obj = target.parentNode;

    if ((movable=="cstr")||(gmovable=="cstr")) 
      objcstr = obj.getAttribute("movecstr");
    else if (! evt.ctrlKey || evt.metaKey) 
      objcstr = "translation";
    else 
      objcstr = "rotation";
    
    appui=true;
    xmo = evt.clientX || evt.getClientX();   // new syntax || old syntax
    ymo = evt.clientY || evt.getClientY();
    
    
    transfo=get_tranform_values(obj);
    xo = transfo[4];
    yo = transfo[5];
  }
  
  return false;
}

function bouger(evt) {
  if (till_click_handler) {
    till_click_handler(evt);
  }
  else
  if (appui==true) {
    xm = evt.clientX || evt.getClientX();   // new syntax || old syntax
    ym = evt.clientY || evt.getClientY();

    // translation
    newx = xm+xo-xmo;
    newy = ym+yo-ymo;
        
    // rotation
    var vmo = { x:xmo-xo, y:ymo-yo };
    var no = Math.sqrt(vmo.x*vmo.x + vmo.y*vmo.y)
    vmo = { x:vmo.x/no, y:vmo.y/no }
    
    var vm = { x:xm-xo, y:ym-yo }
    var n = Math.sqrt(vm.x*vm.x + vm.y*vm.y)
    vm = { x:vm.x/n, y:vm.y/n }
    
    angl = Math.acos(vmo.x*vm.x + vmo.y*vm.y)
    sign = vmo.x*vm.y - vmo.y*vm.x
    sign = sign>0 ? 1 : -1
    
    if (objcstr=="translation") {
      graph.nodes[obj.id].val.x = newx;
      graph.nodes[obj.id].val.y = newy;

      UpdateTransfo(obj, newx, newy);
    } else if (objcstr=="rotation") {
      UpdateTransfoRot(obj, sign * angl);
      /*kt = Texte("handlekeypressTxt", 10, 10, "angl " 
        + vmo.x + " " + vmo.y + " " + no + " - "  
        + vm.x + " " + vm.y + " " + n + " - "  
        + angl + " " + sign + " " );*/
    } else {
      UpdatePointCstr(obj.id, newx, newy);
    }

    redraw();
  } else {
  }
}

function lacher(evt) {
  appui=false
  redraw();
  //graphwiz_redraw();
}

function redraw() {
  graph_recalc_naive(graph.nodes);
  graph_apply_updates(graph.nodes);
  graphtxt_redraw();
}
function graph_apply_updates(nodes) {
  for (var node_id in nodes) {
    var node = nodes[node_id];
    if (!node.val||!node.val.type) continue;

    var elnt = svgdoc.getElementById(node_id);
    switch (node.val.type) {
      case "point":
        UpdateTransfo(elnt, node.val.x, node.val.y);
        break;
      case "line":
        UpdateGraphLine(node_id, node.val);
        break;
      case "circle":
        UpdateGraphCircle(node_id, node.val);
        break;
      case "text":
        UpdateGraphText(node_id, node.val.txt);
        break;
      default: 
        console.log()
    }
  }
}

function UpdateTransfo(elnt, newx, newy) {
  transfo = get_tranform_values(elnt);
  transfo[4] = newx;
  transfo[5] = newy;
  transfo = "matrix(" + transfo.join(" ") + ")";
  //logText("m " + xm + " " + ym + " mo " + xo + " " + yo + " mom " + xmo + " " + ymo + " new " + newx + " " + newy);
  elnt.setAttribute("transform",transfo);
}

function UpdateTransfoRot(elnt, newr) {
  transfo=get_tranform_values(elnt);
  var c = Math.cos(newr), s = Math.sin(newr)
  transfo[0] = c;
  transfo[1] = s;
  transfo[2] = -s;
  transfo[3] = c;
  transfo = "matrix(" + transfo.join(" ") + ")";
  //logText("m " + xm + " " + ym + " mo " + xo + " " + yo + " mom " + xmo + " " + ymo + " new " + newx + " " + newy);
  elnt.setAttribute("transform",transfo)
}

function isdefined( variable ) {
    return ( typeof(variable) == "undefined" ) ? false : true;
}

function isdefinedAttr( elnt, attr ) {
  return elnt.hasAttribute(attr);
  //return ( typeof(elnt.getAttribute(attr)) == "undefined" ) ? false : true;
}

function CheckGraphElementDoNotExist( id ) {
  if (graph.nodes[id])
    throw new Error("Graph node id already exist '" + id + "'.");

  var elnt = svgdoc.getElementById(id);
  if (elnt!=null)
    throw new Error("Element already exist '" + id + "'.");
}

// Accept a second optionnal arg (who is asking the check)
function CheckGraphPoint( id ) {
  var elnt = svgdoc.getElementById(id);
  var forId = "";
  if (CheckGraphPoint.arguments.length>1) 
    forId = " requested by '" + CheckGraphPoint.arguments[1] + "' ";
  
  if (elnt==null)
    throw new Error("Element do not exist '" + id + "'" + forId + ".");
  
  transfo=get_tranform_values(elnt);
  var xold=transfo[4];
  var yold=transfo[5];
  var alpha = 0;
  
  /*
  // SVGMatrix.getCTM()
  // Returns the transformation matrix from current user units (i.e., after application of the ??? attribute, if any) to the viewport coordinate system for the nearestViewportElement.
  var mtx = elnt.getCTM();
  var xo = mtx.e;
  var yo = mtx.f;
  var alpha = Math.acos( mtx.a ) //(mtx.b>0?1:-1) * 
  if (mtx.b<0) alpha = -alpha;

  // Math.round() / Math.floor() / Math.ceil()
  if ((Math.floor(xo)!=xold)||(Math.floor(yo)!=yold))
    ; //alert ( "CheckGraphPoint '" + id + "' " + xold + " " + yold + " " + xo + " " + yo + "    aplha " + alpha + " " + mtx.a + " " + mtx.b);
  */
  
  return { x:xold, y:yold, alpha:alpha }
}
function UpdateGraphPoint( id, val ) {
    var node = graph.nodes[id]
    if (!node || !node.val) 
      console.error(id+" ill defined");
    if (node.val==undefined) 
      console.warn(id+" no val");
    if (val.x) val.x = Math.round(val.x*1000)/1000; 
    if (val.y) val.y = Math.round(val.y*1000)/1000; 
    node.val = val;
    
    var elnt=svgdoc.getElementById(id);
    UpdateTransfo( elnt, val.x, val.y );
}

function line_equation(ln) {
  // line tangent vector coords : (u,v)
  var u = ln.x2 - ln.x1;
  var v = ln.y2 - ln.y1;
  var n = Math.sqrt(u*u+v*v);
  if (n!=0) {
    u /= n;
    v /= n;
  }

  // line normal vector coords : (a,b)
  var a = -v
  var b = u;
  var d = a*ln.x1+b*ln.y1;
  var c = -d;

  // line equation : a.x + b.y + c = 0
  return { a: a, b: b, c: c };
  
}
function CheckGraphLine( id ) {
  var elnt = svgdoc.getElementById(id);
  if (elnt==null)  throw new Error("Element do not exist '" + id + "'.");
  var x1 = parseFloat(elnt.getAttribute("x1"));  var y1 = parseFloat(elnt.getAttribute("y1"));
  var x2 = parseFloat(elnt.getAttribute("x2"));  var y2 = parseFloat(elnt.getAttribute("y2"));

  // Eq p.x+q.y=d with d=1
  var res = SolveAxEqB( 
    x1, y1,  1,
    x2, y2,  1);
  var n = Math.sqrt(res.x*res.x+res.y*res.y);
  
  // Eq p.x+q.y=d
  return { type: "line", p:res.x/n, q:res.y/n, d:1/n, x1:x1, y1:y1, x2:x2, y2:y2, A: { x:x1, y:y1 }, B: { x:x2, y:y2 } };
}
function UpdateGraphLine( id, val ) {
  var elnt = svgdoc.getElementById(id);
  elnt.setAttribute("x1", val.x1);
  elnt.setAttribute("y1", val.y1);
  elnt.setAttribute("x2", val.x2);
  elnt.setAttribute("y2", val.y2);
}
  
function CheckGraphCircle( id ) {
  var elnt = svgdoc.getElementById(id);
  var circle = elnt.firstChild ;
  return {
    type: "circle",
    cx: parseFloat(circle.getAttribute("cx")),
    cy: parseFloat(circle.getAttribute("cy")),
    r:  parseFloat(circle.getAttribute("r")) };
}
function UpdateGraphCircle(id, val) {
  var elnt = svgdoc.getElementById(id);
  var circle = elnt.firstChild ;
  circle.setAttribute("cx", val.cx | val.x);
  circle.setAttribute("cy", val.cy | val.y);
  circle.setAttribute("r", val.r);
  var circle = circle.nextSibling;
  circle.setAttribute("cx", val.cx | val.x);
  circle.setAttribute("cy", val.cy | val.y);
  circle.setAttribute("r", val.r);
}

function CheckGraphPath( id ) {
  var elnt = svgdoc.getElementById(id);
  if (elnt.classList.contains("geomLine"))
    return CheckGraphLine( id );
  else 
    return CheckGraphCircle( id );
}

function UpdateGraphText(id, txt) {
  var node=svgdoc.getElementById(id);
  
  var nodeA=svgdoc.createElementNS("http://www.w3.org/2000/svg","a");
  nodeA.setAttribute("xlink:href","javascript:return false;"); 
  var nodeTxt=svgdoc.createTextNode(txt);
  nodeA.appendChild(nodeTxt);

  var oldNodeA=node.childNodes.item(0);
  node.replaceChild(nodeA, oldNodeA);
  //node.data = nodeA
  // try node.firstChild.data = "..."
  // try node.getFirstChild().setData("...")
  
  //node.appendChild(nodeA);
}


// -----------------------------------------------------------------------------------------------------
// DrawXyz functions 



function DrawPoint(id, xo, yo, type, options) {
  var opts = options || {};
  
  graph.nodes[id] = { prec: [], succ: [], val: { type: "point", x: xo, y: yo }, meta: { type: type, opts: options }};

  var node=svgdoc.createElementNS("http://www.w3.org/2000/svg","g");
  node.setAttribute("id",id);
  node.setAttribute("name","geomPoint")
  node.setAttribute("class", "geom geomPath geomPoint");
  node.setAttribute("transform","matrix(1 0 0 1 "+xo+" "+yo+")");
  
  var size = 2
  if (type=="movable") {
    node.setAttribute("movable","rxy");
    node.setAttribute("style","stroke:red;stroke-width:1; cursor: move;");
    // cursor shapes : hand, grab, grabbing.   https://developer.mozilla.org/en-US/docs/Web/CSS/cursor?redirectlocale=en-US&redirectslug=CSS%2Fcursor
    size = 5
  } else if (type=="cstr") {
    node.setAttribute("movable","cstr");
    node.setAttribute("style","stroke:orange;stroke-width:1; cursor: grab;");
    size = 5
  } else {
    node.setAttribute("style","stroke:black;stroke-width:1");
  }
  if (opts.style) {
    node.setAttribute("style",opts.style);
  }

  if (opts.symbol) {
    var node2=svgdoc.createElementNS("http://www.w3.org/2000/svg","use");
    //node2.setAttribute("id",);
    node2.setAttributeNS('http://www.w3.org/1999/xlink', "href", "#"+opts.symbol);
    node2.setAttribute("x",0); 
    node2.setAttribute("y",0);
    node.appendChild(node2);

  } else {
    var node2=svgdoc.createElementNS("http://www.w3.org/2000/svg","line");
    node2.setAttribute("x1",-size); node2.setAttribute("y1",-size);
    node2.setAttribute("x2",+size); node2.setAttribute("y2",+size);
    node.appendChild(node2);
    
    node2=svgdoc.createElementNS("http://www.w3.org/2000/svg","line");
    node2.setAttribute("x1",-size); node2.setAttribute("y1",+size);
    node2.setAttribute("x2",+size); node2.setAttribute("y2",-size);
    node.appendChild(node2);
  }

  if (!opts.nolabel && type!="noname") {
    // Draw label
    DrawText(id+"txt", ".5em", "1em", id, node);
  }
  
  if ((type=="movable")||(type=="cstr")) {
    // invisible element to extend the group to capture pointer events)
    node2=svgdoc.createElementNS("http://www.w3.org/2000/svg","ellipse");
    node2.setAttribute("cx","0"); node2.setAttribute("cy","0");
    node2.setAttribute("rx",3*size); node2.setAttribute("ry",3*size);
    node2.setAttribute("style", "stroke:none; fill:none; pointer-events:all;");
    node.appendChild(node2);
  } 
  
  var g = (type=="movable"||type=="cstr") ? drawFrontGroup : drawGroup;
  g.appendChild(node);
  return node;
}

function DrawLine(id, x1, y1, x2, y2, type, options) {
  var opts = options || {};
  
  graph.nodes[id] = { prec: [], succ: [], val: { type: "line", x1: x1, y1: y1, x2: x2, y2: y2}, meta: { type: type, opts: options }};
  
  var node=svgdoc.createElementNS("http://www.w3.org/2000/svg","line");
  //var node = document.createElementNS("http://www.w3.org/2000/svg", "line");
  node.setAttribute("id",id);  
  node.setAttribute("class", "geom geomPath geomLine");
  node.setAttribute("x1",x1); node.setAttribute("y1",y1);
  node.setAttribute("x2",x2); node.setAttribute("y2",y2);
  
  if (type=="seg") 
    node.setAttribute("style", opts.style || "stroke:darkgrey; stroke-width:1;"); // stroke-dasharray:5,5;
  else 
    node.setAttribute("style", opts.style || "stroke:lightgrey; stroke-width:1;");
  
  
  // Export
  drawGroup.appendChild(node);
  return node;
}

function DrawCircle(id, x, y, r) {
  graph.nodes[id] = { prec: [], succ: [], val: { type: "circle", cx: x, cy: y, r: r }};
  

  var node=svgdoc.createElementNS("http://www.w3.org/2000/svg","g");
  node.setAttribute("id",id);
  node.setAttribute("class", "geom geomPath geomCircle");
  //node.setAttribute("transform","matrix(1 0 0 1 "+x+" "+y+")");
  //node.setAttribute("style","stroke-width:5; stroke:none; fill:none; pointer-events:all;");
  
  // visible
  var node2=svgdoc.createElementNS("http://www.w3.org/2000/svg","circle");
  node2.setAttribute("cx",x); 
  node2.setAttribute("cy",y);
  node2.setAttribute("r",r);
  node2.setAttribute("style","stroke-width:1; stroke:lightblue; fill:none;"); 
  node.appendChild(node2);
  
  // invisible
  var node2=svgdoc.createElementNS("http://www.w3.org/2000/svg","circle");
  node2.setAttribute("cx",x); 
  node2.setAttribute("cy",y);
  node2.setAttribute("r",r);
  node2.setAttribute("style","stroke-width:5; stroke-opacity:0.1; stroke:none; fill:none; pointer-events:stroke;");
  node.appendChild(node2);

  // mouseenter, mouseleave (element), mouseout (element or one of its children),
  // mousemove (over element), mouseover (over element or one of its children), 
  // mousedown, mouseup, click, dblclick, contextmenu
  node.addEventListener("mouseover", function( event ) {   
    // highlight the mouseover target
    
    if (appui)
      return; // no highlighting while dragiing (because we are dragging point that are too close from too many highlitable elements;)

    var el = event.target, elc;
    if (el.parentNode.classList.contains("geomCircle"))
      elc = el.parentNode.firstChild
    var stroke_color = elc.style.stroke;
    var stroke_width = elc.style.strokeWidth;
    if (elc.style.stroke=="orange") return;
    //el.style.stroke = "orange";
    elc.style.stroke = "orange";
    elc.style.stroke = 3;
    //el.setAttribute("stroke","orange");
    // reset the color after a short delay
    setTimeout(function() {
      //el.style.stroke = stroke_color;
      elc.style.stroke = stroke_color;
      elc.style.strokeWidth = stroke_width;
      //el.setAttribute("stroke",stroke_color);
    }, 1000);
  }, false);
  
  drawGroup.appendChild(node);
  return node;
}

function DrawText(id, xo, yo, txt, parentGroup) {
    
  var node=svgdoc.createElementNS("http://www.w3.org/2000/svg","text");
  node.setAttribute("id",id);  
  //node.setAttribute("transform"," translate("+xo+","+yo+") rotate(-90) ");  
  node.setAttribute("x",xo); node.setAttribute("y",yo);
  node.setAttribute("fill","black"); 
  node.setAttribute("font-size","10");
  
  var nodeA=svgdoc.createElementNS("http://www.w3.org/2000/svg","a");
  nodeA.setAttribute("xlink:href","javascript:return false;"); 
  var nodeTxt=svgdoc.createTextNode(txt);
  nodeA.appendChild(nodeTxt);
  
  node.appendChild(nodeA);
  
  var g = parentGroup || drawGroup;
  g.appendChild(node);
  return node;
  
}

function Point( id, xo, yo, bActive ) {

  // Check if already exist
  CheckGraphElementDoNotExist( id )
  
  // Add to the structure Xml
  //...
  
  if (bActive)
    DrawPoint(id, xo, yo, "movable" );
  else 
    DrawPoint(id, xo, yo, "noname" );
  return id;
}

function intersect_lines(ln1, ln2) {
  var eq1 = line_equation(ln1);
  var eq2 = line_equation(ln2);

  var res = SolveAxEqB( 
    eq1.a, eq1.b,  -eq1.c,
    eq2.a, eq2.b,  -eq2.c);

  if (isNaN(res.x)||isNaN(res.x)) {
    info_msg(arguments.callee.name+": empty intersect.\n "+JSON.stringify(ln1)+"\n "+JSON.stringify(ln2)+"\n => "+JSON.stringify(res));
    return;    
  }

  res.type = "point";
  return res;
}
function intersect_circles(p1, p2, np) {
  function sq(x) { return x*x; }
  var xb = p2.cx-p1.cx, yb = p2.cy-p1.cy, rb=p2.r, ra=p1.r;
  var ab = Math.sqrt(sq(xb)+sq(yb));
  
  var empty_intersect = 
    (ab > (ra+rb)) || // disjoints
    (rb > (ab+ra)) || // circle A inside B
    (ra > (ab+rb)); // circle B inside A
  if (empty_intersect) {
    info_msg(arguments.callee.name+": empty intersect.\n "+JSON.stringify(p1)+"\n "+JSON.stringify(p2));
    return;
  }

  var A = 2*xb, B = 2*yb, C = xb*xb+yb*yb - sq(rb) + sq(ra);
  var D = sq(2*A*C) - 4*(A*A+B*B)*(C*C-sq(B*ra));
  if (D<0) {
    info_msg(arguments.callee.name+": negative determinant.\n "+JSON.stringify(p1)+"\n "+JSON.stringify(p2));
    return undefined;
  }

  var P = { type: "point" }, Q = { type: "point" };
  P.x = (2*A*C-Math.sqrt(D))/(2*(A*A+B*B));
  Q.x = (2*A*C+Math.sqrt(D))/(2*(A*A+B*B));
  P.y = (B!=0) ? ((C-A*P.x)/B) :   Math.sqrt(sq(rb)-sq((2*C-A*A)/(2*A))); 
  Q.y = (B!=0) ? ((C-A*Q.x)/B) : - Math.sqrt(sq(rb)-sq((2*C-A*A)/(2*A))); 

  P.x += p1.cx;
  Q.x += p1.cx;
  P.y += p1.cy;
  Q.y += p1.cy;
  
  if (!np) 
    return [ P, Q ];

  var PD = distance_point(np,P);
  var QD = distance_point(np,Q);
  return (PD<QD) ? P : Q;
} 
function intersect_circle_line(circle, line, np) {
  /*
    Solving after coordinates substitution centered on C
    p.x + q.y = d
    x^2 + y^2 = r^2 

    p^2.x^2 = (d-q.y)^2
    p^2.x^2 = p^2.r^2 - p^2.y^2

    (d-q.y)^2 - p^2.r^2 + p^2.y^2 = 0

    (q^2+p^2).y^2 - 2*d*q.y + (d^2-p^2.r^2) = 0
    solve 2nd degree polynomial to find y
    
    use line equation to find x
    - if p!=0 then x = (d-qy)/p
    - if p==0 then y = d (line equation) and x^2 = (r^2 - d^2)
  */

  var line_eq = line_equation(line);
  
  var p = line_eq.a;
  var q = line_eq.b;
  var d = -line_eq.c - ( p*circle.cx + q*circle.cy); // after coords substitution
  var r = circle.r;

  var a = q*q+p*p;
  var b = -2*d*q;
  var c = (d*d-p*p*r*r);
  var D = b*b - 4*a*c;

  if (D<0) {
    info_msg(arguments.callee.name+": negative determinant.\n "+JSON.stringify(circle)+"\n "+JSON.stringify(line));
    return undefined;
  }
  var y1 = (-b-Math.sqrt(D))/(2*a);
  var y2 = (-b+Math.sqrt(D))/(2*a);

  var x1 = p!=0 ? (d-q*y1)/p : -Math.sqrt(r*r-d*d);
  var x2 = p!=0 ? (d-q*y2)/p : -Math.sqrt(r*r-d*d);

  // back to coordinates
  var res = [ { type: "point", x: x1+circle.cx, y: y1+circle.cy }, { type: "point", x: x2+circle.cx, y: y2+circle.cy } ];

  if (!np) 
    return res;

  var d0 = distance_point(np,res[0]);
  var d1 = distance_point(np,res[1]);
  res = (d0<d1) ? res[0] : res[1]
  return res;
} 

function intersect_paths(path1, path2, near_point) {
  if (path1.type=="circle" && path2.type=="circle") {
    return intersect_circles(path1, path2, near_point);
  } else if (path1.type=="line" && path2.type=="line") {
    return intersect_lines(path1, path2);
  } else if (path1.type=="circle" && path2.type=="line") {
    return intersect_circle_line(path1, path2, near_point);
  } else if (path1.type=="line" && path2.type=="circle") {
    return intersect_circle_line(path2, path1, near_point);
  } else {
    throw new Error(arguments.callee.name+": unhandled path types. "+path1.type+" "+path2.type);
  }
}

/// Intersect: finds intersection between path1 and path2 (if multiple intersects, taking solution closest to near_point) ...
function Intersect( id, path1, path2, near_point ) {
  // Check
  var p1 = CheckGraphPath( path1 );
  var p2 = CheckGraphPath( path2 );
  var np = CheckGraphPoint( near_point );
  
  var res = intersect_paths(p1, p2, np);
  if (!res) {
    console.warn("intersect "+path1+" "+path2+" empty: skip creation/update");
    return;
  }

  // Draw
  DrawPoint(id, res.x, res.y, "dot" );
  // add 
  graph.nodes[id].prec = [ path1, path2, near_point ];;
  graph.nodes[id].fct = intersect_paths;
  return id;
}

function UpdatePointCstr(id,newx,newy) {
  var node = graph.nodes[id];
  var prec = graph.nodes[node.prec[0]];
  
  var min = node.meta.min;
  var max = node.meta.max;
  var pt  = node.val;
  var new_pt = { x: newx, y: newy };
  var cstr_path = prec.val;

  // project on the line
  var proj = point_proj(new_pt, cstr_path);
  newx = proj.x;
  newy = proj.y;
  
  function sq(x) { return x*x; }
  switch (cstr_path.type) {
    case "line":
      var ln = cstr_path;
      var D = sq(ln.x2-ln.x1) + sq(ln.y2-ln.y1);
      var d = (newx-ln.x1)*(ln.x2-ln.x1) + (newy-ln.y1)*(ln.y2-ln.y1);
      var k = Math.min( Math.max( 0, d/D ), 1);
      // modify value 
      pt.val = (1-k)*min + k*max;
      break;
    default:
      throw new Error(arguments.callee.name+": unhandled contraint type. "+cstr.val.type);
  }
}


function point_cstr_refresh(cstr) {
  var val = this.val.val
  var min = this.meta.min;
  var max = this.meta.max;
  var pct = (val-min)/(max-min);
  
  var x, y;
  switch (cstr.type) {
    case "line":
      x = cstr.x1 + pct * (cstr.x2-cstr.x1);
      y = cstr.y1 + pct * (cstr.y2-cstr.y1);
      break;
    case "circle":
      debugger; // check angle radians vs degrees
      x = cstr.cx + cstr.r * Math.cos( 360*k );
      y = cstr.cy + cstr.r * Math.sin( 360*k );
      break;
    default:
      throw new Error(arguments.callee.name+": unhandled contraint type. "+cstr.val.type);
  }

  // modify coordinates in place
  this.val.x = x;
  this.val.y = y;
  return this.val;
}
function PointCstr(id, cstr, val, min, max, options) {
  // Check if already exist
  CheckGraphElementDoNotExist( id )
  var cstr_path = CheckGraphPath(cstr);
  
  var pt = DrawPoint(id, 10, 10, "cstr", options);
  graph.nodes[id].prec = [ cstr ];
  graph.nodes[id].fct = point_cstr_refresh;
  graph.nodes[id].val = { type: "point", x:0, y:10, val: val };
  graph.nodes[id].meta = { type: "point_cstr", min: min, max: max, opts: options };
  return id;
}

function point_iso(opt_pts) {
  var pts = arguments;
  var xo=0, yo=0;
  for (var i=0; i<pts.length; i++) {
    xo += pts[i].x;
    yo += pts[i].y;
  }
  xo /= pts.length;
  yo /= pts.length;
  return { type: "point", x: xo, y: yo }
}

// function PointIso( id, ... ) {
function PointIso( id ) {

  // Check
  var args = arguments
  var prec = new Array();
  var pts = new Array();
  for (var i=1; i<arguments.length; i++) {
    var pt = CheckGraphPoint(args[i]);
    prec.push( arguments[i] ); 
    pts.push( pt );
  }
  var res = point_iso.apply(this, pts);
  
  // Draw
  DrawPoint(id, res.x, res.y, "dot" );
  // Add redraw info
  graph.nodes[id].prec = prec;
  graph.nodes[id].fct = point_iso;
  
  return id;
}

function point_proj(pt, ln) {
  var line_eq = line_equation(ln);
  var dst = line_eq.a*pt.x + line_eq.b*pt.y + line_eq.c;
  
  var x = pt.x - line_eq.a*dst,
    y = pt.y - line_eq.b*dst;

  if (isNaN(x))
    debugger;
  
  return { type: "point", x: x, y: y }
}

function PointProj( id, p, d ) {
  // Check
  var pt = CheckGraphPoint( p );
  var ln = CheckGraphLine( d );
  var res = point_proj(pt, ln);

  // Draw
  DrawPoint(id, res.x, res.y, "dot" );
  // Add redraw info
  graph.nodes[id].prec = [ p, d ];
  graph.nodes[id].fct = point_proj;

  return id;
}

/// PointOrtho (H)
/// AH.BC=0, BH.AC=0, CH.AB=0
/// OH.BC=OA.BC, OH.AC=OB.AC, ...
function point_ortho_center(a,b,c) {
  var bc = { x:c.x-b.x, y:c.y-b.y }
  var ac = { x:c.x-a.x, y:c.y-a.y }
  var oabc = a.x * bc.x + a.y*bc.y
  var obac = b.x * ac.x + b.y*ac.y
  var res = SolveAxEqB( 
    bc.x, bc.y,   oabc,
    ac.x, ac.y,   obac);
  return { type: "point", x: res.x, y: res.y };
}
function PointOrtho( id, p1, p2, p3 ) {
  // Check
  var a = CheckGraphPoint( p1 );
  var b = CheckGraphPoint( p2 );
  var c = CheckGraphPoint( p3 );
  var res = point_ortho_center(a,b,c);
  
  // Draw
  DrawPoint(id, res.x, res.y, "dot" );
  // Add redraw info
  graph.nodes[id].prec = [ p1, p2, p3 ];
  graph.nodes[id].fct = point_ortho_center;

  return id;
}

/// PointCirc (X)
/// Ma, Mb, Mc milieux des cotes opposes aux sommets A, B, C 
/// MaX.BC=0, MbX.AC=0, McX.AB=0
/// OX.BC=OMa.BC, OX.AC=OMb.AC, ...
function point_circ(a,b,c) {
  var bc = { x:c.x-b.x, y:c.y-b.y }
  var ac = { x:c.x-a.x, y:c.y-a.y }
  var ma = { x:(c.x+b.x)/2, y:(c.y+b.y)/2 }
  var mb = { x:(c.x+a.x)/2, y:(c.y+a.y)/2 }
  var omabc = ma.x * bc.x + ma.y*bc.y
  var ombac = mb.x * ac.x + mb.y*ac.y
  var res = SolveAxEqB( 
    bc.x, bc.y,   omabc,
    ac.x, ac.y,   ombac);
  return { type: "point", x: res.x, y: res.y };
}
function PointCirc( id, p1, p2, p3 ) {
  // Check
  var a = CheckGraphPoint( p1 );
  var b = CheckGraphPoint( p2 );
  var c = CheckGraphPoint( p3 );
  var res = point_circ(a,b,c);


  // Draw
  DrawPoint(id, res.x, res.y, "dot" );
  // Add redraw info
  graph.nodes[id].prec = [ p1, p2, p3 ];
  graph.nodes[id].fct = point_circ;

  return id;
}

/// PointInscr (I)
/// Nab, Mac, Mbc vecteurs normalises 
/// nAB.AI = nAC.AI, nBA.BI = nBC.BI, nCA.CI = nCB.CI
/// (nAB-nAC).OI = (nAB-nAC).OA, (nBA-nBC).OI = (nBA-nBC).OB, ...
function point_inscr(a,b,c) {
  var ab = { x:b.x-a.x, y:b.y-a.y };
  var ac = { x:c.x-a.x, y:c.y-a.y };
  var bc = { x:c.x-b.x, y:c.y-b.y };
  var n; 
  n = Math.sqrt(ab.x*ab.x+ab.y*ab.y), ab = { x:ab.x/n, y:ab.y/n };
  n = Math.sqrt(ac.x*ac.x+ac.y*ac.y), ac = { x:ac.x/n, y:ac.y/n };
  n = Math.sqrt(bc.x*bc.x+bc.y*bc.y), bc = { x:bc.x/n, y:bc.y/n };
  var abc = { x:ac.x-ab.x, y:ac.y-ab.y };
  var bac = { x:-ab.x-bc.x, y:-ab.y-bc.y };
  
  var res = SolveAxEqB( 
    abc.x, abc.y,   abc.x*a.x+abc.y*a.y,
    bac.x, bac.y,   bac.x*b.x+bac.y*b.y);
  return { type: "point", x: res.x, y: res.y };    
}
function PointInscr( id, p1, p2, p3 ) {
  // Check
  var a = CheckGraphPoint( p1 );
  var b = CheckGraphPoint( p2 );
  var c = CheckGraphPoint( p3 );
  var res = point_inscr(a,b,c);

  // Draw
  DrawPoint(id, res.x, res.y, "dot" );
  // Add redraw info
  graph.nodes[id].prec = [ p1, p2, p3 ];
  graph.nodes[id].fct = point_inscr;
  return id;
}

/// PointXInscr (Xa) : Pour le sommet A, centre du cercle qui tangente [AB), [AC) et [BC].
/// Nab, Mac, Mbc vecteurs normalises 
/// nAB.BI = nBC.BI, nAC.CI = nCB.CI.
/// (nAB-nBC).OI = (nAB-nBC).OB, (nAC+nBC).OI = (nAC+nBC).OC, ...
function point_xinscr(a,b,c) {
  var ab = { x:b.x-a.x, y:b.y-a.y };
  var ac = { x:c.x-a.x, y:c.y-a.y };
  var bc = { x:c.x-b.x, y:c.y-b.y };
  var n;
  n = Math.sqrt(ab.x*ab.x+ab.y*ab.y), ab = { x:ab.x/n, y:ab.y/n };
  n = Math.sqrt(ac.x*ac.x+ac.y*ac.y), ac = { x:ac.x/n, y:ac.y/n };
  n = Math.sqrt(bc.x*bc.x+bc.y*bc.y), bc = { x:bc.x/n, y:bc.y/n };
  var bac = { x:ab.x-bc.x, y:ab.y-bc.y };
  var cab = { x:ac.x+bc.x, y:ac.y+bc.y };
  
  var res = SolveAxEqB( 
    bac.x, bac.y,   bac.x*b.x+bac.y*b.y,
    cab.x, cab.y,   cab.x*c.x+cab.y*c.y);
  if (isNaN(res.x))
    debugger;

  return { type: "point", x: res.x, y: res.y }; 
}
function PointXInscr( id, p1, p2, p3 ) {
  // Check
  var a = CheckGraphPoint( p1 );
  var b = CheckGraphPoint( p2 );
  var c = CheckGraphPoint( p3 );
  var res = point_xinscr(a,b,c);
  
  // Draw
  DrawPoint(id, res.x, res.y, "dot" );
  // Add redraw info
  graph.nodes[id].prec = [ p1, p2, p3 ];
  graph.nodes[id].fct = point_xinscr;

  return id;
}

function center_radius_circle(c, m, n) {
  // either given p2 on the edge of the circle => radius = distance(p1,p2)
  // or given segment [p2,p3] as a mesure of radius
  var r = distance_point(m, n || c);
  return { type: "circle", cx: c.x, cy: c.y, r: r }; 
}
function Circle( id, p1, p2, p3 ) {

  // Check
  var c = CheckGraphPoint( p1 );
  var m = CheckGraphPoint( p2 );
  var n = p3 ? CheckGraphPoint( p3 ) : undefined;
  var res = center_radius_circle(c, m, n);

  // Draw
  DrawCircle(id, res.cx, res.cy, res.r);
  // Add redraw info
  graph.nodes[id].prec = p3 ? [ p1, p2, p3 ] : [ p1, p2 ];
  graph.nodes[id].fct = center_radius_circle;
  return id;
}

function two_points_segment(pt1, pt2) {
  return { type: "line", x1: pt1.x, y1: pt1.y, x2: pt2.x, y2: pt2.y };
}
function Seg( id, p1, p2, opts) {

  // Check
  var pt1 = CheckGraphPoint( p1, id );
  var pt2 = CheckGraphPoint( p2, id );
  var res = two_points_segment(pt1, pt2);

  // Draw
  DrawLine(id, pt1.x, pt1.y, pt2.x, pt2.y, "seg", opts);

  graph.nodes[id].prec = [ p1, p2 ];
  graph.nodes[id].fct  = two_points_segment;
  graph.nodes[id].meta = { type: "seg", opts: opts };
  return id;
}

function two_points_line(pto1, pto2) {
  var extend = 2;
  var pt12 = { x:pto2.x-pto1.x, y:pto2.y-pto1.y };
  var pt1 = { x:pto1.x-extend*pt12.x, y:pto1.y-extend*pt12.y };
  var pt2 = { x:pto2.x+extend*pt12.x, y:pto2.y+extend*pt12.y };
  return { type: "line", x1: pt1.x, y1: pt1.y, x2: pt2.x, y2: pt2.y };
}
function Line( id, p1, p2, opts) {

  // Check
  var pto1 = CheckGraphPoint( p1 );
  var pto2 = CheckGraphPoint( p2 );
  var res = two_points_line(pto1, pto2);

  // Draw
  DrawLine(id, res.x1, res.y1, res.x2, res.y2, "line", opts);

  graph.nodes[id].prec = [ p1, p2 ];
  graph.nodes[id].fct  = two_points_line;
  graph.nodes[id].meta = { type: "line", opts: opts };
  return id;
}

function graph_text_update(src_val) {
  // alternative method to find the source
  var src_id_alt_method = this.prec[0];
  var src_val_alt_method =  src_id_alt_method.val;

  var txt = src_val.val;
  return { type: "text", txt: txt };
}
function Texte(id, xo, yo, txt, src) { 
  var node;
  
  // Draw
  node = DrawText(id, xo, yo, txt);

  graph.nodes[id] = {}
  //graph.nodes[id].val = graph_text_update(""+txt);
  graph.nodes[id].prec = src ? [ src ] : [];
  graph.nodes[id].fct = graph_text_update;
  graph.nodes[id].val = { type: "text", txt: "txt" };

  return id;
}

function SvgSetVisible(src) {
  bVisible = src.checked;
  
  var args = arguments; 
  for (var i=1; i<args.length; i++) {
    var elnt = svgdoc.getElementById(args[i]);
    //alert("display before " + args[i] + " " +  node.getAttribute("style")+ " " + node.style.visible );
    if (bVisible) {
      //elnt.getStyle().setProperty("visibility", "visible");
      elnt.getStyle().setProperty("display", "inline ");
    } else {
      //elnt.getStyle().setProperty("visibility", "hidden");
      elnt.getStyle().setProperty("display", "none");
    }
  }
}

function SolveAxEqB(a11, a12, b1, a21, a22, b2 ) {
  var det = a11*a22 - a21*a12;
  var inva11 = a22/det, inva22 = a11/det,
    inva12 = -a12/det, inva21 = -a21/det;
  var xo = inva11*b1 + inva12*b2,
    yo = inva21*b1 + inva22*b2;
   return { x:xo, y:yo };
}


function info_msg(msg) {
  if (typeof console != "undefined")
    console.log(msg);
  else 
    print(msg);
}

