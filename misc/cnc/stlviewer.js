function STLViewerEnable(classname, prms) {
    var canvases = document.getElementsByTagName("canvas");
    for (var canvas of canvases)
        canvas.remove();

    var models = document.getElementsByClassName(classname);
    for (var i = 0; i < models.length; i++) {
        STLViewer(models[i], models[i].getAttribute("data-src"), prms)
        .then(res => console.log("STLViewer loaded.", res || ""))
        .catch(err => console.log("STLViewer error.", err));
    }
}

async function STLViewer(elem, model, prms) {

    if (!WEBGL.isWebGLAvailable()) {
        elem.appendChild(WEBGL.getWebGLErrorMessage());
        return;
    }

    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    var camera = new THREE.PerspectiveCamera(50, elem.clientWidth / elem.clientHeight, 1, 1000);

    renderer.setSize(elem.clientWidth, elem.clientHeight);
    elem.appendChild(renderer.domElement);

    window.addEventListener('resize', function () {
        renderer.setSize(elem.clientWidth, elem.clientHeight);
        camera.aspect = elem.clientWidth / elem.clientHeight;
        camera.updateProjectionMatrix();
    }, false);

    var controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.rotateSpeed = 0.05;
    controls.dampingFactor = 0.1;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.75;

    var scene = new THREE.Scene();

    scene.add(new THREE.HemisphereLight(0xffffff, 0x080820, 1.5));

    var { geometry, mesh } = await LoadStlModel(model);
    // scene.add(mesh);

    var meshes = await LoadLineModel(model, prms);
    for (var mesh_name in meshes)
        scene.add(meshes[mesh_name]);

    // Compute the middle
    var middle = new THREE.Vector3();
    geometry.computeBoundingBox();
    geometry.boundingBox.getCenter(middle);

    // Center it
    mesh.geometry.applyMatrix(new THREE.Matrix4().makeTranslation( -middle.x, -middle.y, -middle.z ) );

    // Rotate, if desired
    //if(elem.getAttribute("data-rotate") == "x")
    //    mesh.rotation.x = -Math.PI/2
        mesh.rotation.x = -Math.PI/2;

    // Pull the camera away as needed
    var largestDimension = Math.max(
        geometry.boundingBox.max.x - geometry.boundingBox.min.x,
        geometry.boundingBox.max.y - geometry.boundingBox.min.y,
        geometry.boundingBox.max.z - geometry.boundingBox.min.z)
    camera.position.z = largestDimension * elem.getAttribute("data-zdistance");


    var animate = function () {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }; animate();

}

function LoadStlModel(model) {
    return new Promise((resolve, reject) => {
        (new THREE.STLLoader()).load(model, function (geometry) {
            var material = new THREE.MeshPhongMaterial({ color: 0xff5533, specular: 100, shininess: 100 });

            var mesh = new THREE.Mesh( geometry, material );
            // resolve({ geometry, mesh });

            var wireframe_geometry = new THREE.WireframeGeometry( geometry );
            var wireframe_mesh= new THREE.LineSegments( wireframe_geometry );
            resolve({ geometry: wireframe_geometry, mesh: wireframe_mesh });

        });
    });
}

// Unconnected line : N segments = 2*N points
// Connected Lines : N segments = N+1 points

function TriangleMesh(indexed_geom) {
    var idx = [].concat(...indexed_geom.faces);

    var geometry = new THREE.BufferGeometry();
    var use_indices = false;
    if (use_indices) {
        // vertices are shared (but so are normals!)
        var pts = indexed_geom.vertices.map(v => new THREE.Vector3(...v));
        geometry = geometry.setFromPoints(pts);
        geometry.setIndex(idx);
    } else {
        var pts = idx.map(i => new THREE.Vector3(...indexed_geom.vertices[i]));
        geometry = geometry.setFromPoints(pts);
    }
    geometry.computeVertexNormals();
    // geometry.computeFaceNormals();

    var material = new THREE.MeshPhongMaterial({ color: 0xff5533, specular: 100, shininess: 100 });
    var mesh = new THREE.Mesh( geometry, material );
    return { geometry, mesh };
}

function ConnectedLineMesh(vertices, line_pts_idx, prms ) {
    var geometry = new THREE.BufferGeometry();
    // var pts_coords = vertices.map(v => new THREE.Vector3(...v));
    var pts_coords = vertices.map(v => new THREE.Vector3( prms.x0 || v[0], prms.y0 || v[1], prms.z0 || v[2]));
    geometry = geometry.setFromPoints(pts_coords);
    geometry.setIndex(line_pts_idx);

    var material = new THREE.LineBasicMaterial( { color: 0x0000ff, linewidth: 2 } );
    var mesh = new THREE.Line( geometry, material );
    return mesh;
}

function NonConnectedLineMesh(geom, coords_projection) {
    var segments = geom.edges.filter(edges => edges.length==2);

    var points = [];
    for (var segment of segments) {
        var A = geom.vertices[segment[0]];
        var B = geom.vertices[segment[1]];
        points.push(coords_projection(A));
        points.push(coords_projection(B));
    }
    var geometry = new THREE.BufferGeometry().setFromPoints(points);

    var mesh = new THREE.LineSegments( geometry );
    return mesh;
}

async function LoadLineModel(model, prms) {
    var alt_model = model.replace(".stl", ".off");
    var text = await fetch(alt_model).then(data => data.text());
    //var text = await data.text();
    var geom = parse_off_file(text);

    var meshes = {};

    // Step 1 : load full mesh

    var triangles = TriangleMesh(geom);
    meshes["triangles"] = triangles.mesh;

    triangles.geometry.computeBoundingBox();
    var bbox = triangles.geometry.boundingBox;

    // Step 2 : calculate creases

    var creases = list_crease_edges(geom, prms.crease_angle_threshold);
    var crease_meshes = creases.map(crease => ConnectedLineMesh(geom.vertices, crease, {}));
    var crease_group = new THREE.Group();
    for (var mesh of crease_meshes)
        crease_group.add(mesh);
    meshes["creases"] = crease_group;

    // Step 3 : projections

    function project_to_base_plane(vDir, base_plane) {
        // project to z=0 plane
        var proj_to_base_plane =
            ( P ) => [
                (1-vDir[0]) * P[0] + base_plane.x0,
                (1-vDir[1]) * P[1] + base_plane.y0,
                (1-vDir[2]) * P[2] + base_plane.z0 ];

        // GL coords: x=left_to_right, y=top_to_botton, z=normal to screen
        var model_to_gl_coordinates =
            P => P; // [ P[0], P[2], -P[1] ];

        // coords : JS to ThreeJS
        var to_three_js =
            P => new THREE.Vector3( P[0], P[1], P[2] );

        var coords_projection =
            P => to_three_js(model_to_gl_coordinates(proj_to_base_plane(P, -9.5)));

        var top_crease_meshes = creases.map(crease => ConnectedLineMesh(geom.vertices, crease, base_plane));
        var top_group = new THREE.Group();
        for (var mesh of top_crease_meshes)
            top_group.add(mesh);
        var geom_top = facing_up(geom, vDir);
        circumference(geom_top)
        top_group.add(NonConnectedLineMesh(geom_top, coords_projection));

        return top_group;
    }

    var z0 = bbox.min.z - 0.2 * (bbox.max.z - bbox.min.z);
    meshes["left"]  = project_to_base_plane([ 1, 0, 0 ], { x0: z0, y0: 0, z0: 0 });
    meshes["front"] = project_to_base_plane([ 0, 1, 0 ], { x0: 0, y0: z0, z0: 0 });
    meshes["top"]   = project_to_base_plane([ 0, 0, 1 ], { x0: 0, y0: 0, z0: z0 });

    draw_svg_proj(geom, creases);

    return meshes;

     if (!geom.edges.length) {
    }

    var line_material = new THREE.LineBasicMaterial( { color: 0x0000ff } );


    return mesh;
}

window.onload = function () {
    function update_model_viewer() {
        var crease_angle_threshold = this.value;
        document.getElementById("crease_angle_threshold_label").textContent = "("+crease_angle_threshold+"deg)"
        console.log("crease_angle_threshold", crease_angle_threshold);
        STLViewerEnable("stlviewer", { crease_angle_threshold });
    };

    var input = document.getElementById("crease_angle_threshold")
    input.addEventListener("change", update_model_viewer)
    input.addEventListener("input", update_model_viewer);

    STLViewerEnable("stlviewer", { crease_angle_threshold: 23 });
}


// SVG

function draw_svg_proj(geom, creases) {

    var svg = document.getElementById("svg_elnt");

    var cut = document.getElementById("cut");

    // cut.appendChild(svg_node("use", { "xlink:href": href, transform: `translate(${x0} ${y0}) rotate(${alpha})`, stroke: color || "black"}));
    cut.appendChild(svg_node("path", { d: "M 0 0 L 50 50", stroke: "orange" }));

    var minx = Math.min(...geom.vertices.map(x => x[0]));
    var maxx = Math.max(...geom.vertices.map(x => x[0]));
    var miny = Math.min(...geom.vertices.map(x => x[1]));
    var maxy = Math.max(...geom.vertices.map(x => x[1]));
    var deltax = maxx - minx;
    var deltay = maxy - miny;
    svg.setAttribute("viewBox", `${minx} ${miny} ${deltax} ${deltay}`);
    
    for (var crease of creases) {
        var d = svg_path(crease.map(i => geom.vertices[i]).map(x => [ x[0], x[1] ]));
        cut.appendChild(svg_node("path", { d, stroke: "green" }));
    }
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
