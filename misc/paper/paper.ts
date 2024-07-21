
import { RuledSurfaceTransfo, Cylinder, Cone } from './surfaces.js'
import { intersectionLineSurface } from './intersections.js'
import { translate, rotate } from './transformations.js'
import { generate } from './svg.js'

import * as THREE from "three"
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

function render()
{
	var line = { A: [ 0, 0, 0 ], AB: [ 0.5, 1, 1 ]}

	var cyl = new Cylinder(2, 10);
	var cyl2 = new RuledSurfaceTransfo(translate([ 0, 0, -5 ]), cyl);
	var cyl3 = new RuledSurfaceTransfo(rotate([ 60, 0, 0 ]), cyl2);

	var cone = new Cone(3, 10);
	var cone2 = new RuledSurfaceTransfo(translate([ 2, 0, 0 ]), cone);

	console.log(cone2);
}

render();

var camera : THREE.PerspectiveCamera;
var scene : THREE.Scene;
var renderer : THREE.WebGLRenderer;
var group : THREE.Group
var mesh : THREE.Mesh;
var controls;

scene_init();
scene_animate();

function scene_init() {
	camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 10, 250 );  // fov,aspect, near & far planes
	camera.position.z = 90;
	scene = new THREE.Scene();

	// Geometries

	var geometry : THREE.BufferGeometry<THREE.NormalBufferAttributes>;
	var material : THREE.Material;

	// const group = new THREE.Group();
	// group.add( cubeA );
	// group.add( cubeB );

	// SphereGeometry( radius )
	geometry = new THREE.SphereGeometry( 7 );
	// material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
	material = new THREE.MeshPhongMaterial( { color: 0xffff00, specular: 0xffffff, shininess: 50 } );
	mesh = new THREE.Mesh( geometry, material );
	mesh.position.set(5, 0, 1);
	scene.add( mesh );

	// ConeGeometry( radius, height, radialSegments, heightSegments, openEnded)
	geometry = new THREE.ConeGeometry( 5, 20, 32 );
	material = new THREE.MeshPhongMaterial( { color: 0xff3300, specular: 0xffffff, shininess: 50 } );
	mesh = new THREE.Mesh( geometry, material );
	mesh.position.set(-3, 0, 1);
	scene.add( mesh );

	// CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded)
	geometry = new THREE.CylinderGeometry( 5, 5, 15, 32, 1, false );
	material = new THREE.MeshPhongMaterial( { color: 0x22ff22, specular: 0xffffff, shininess: 50 } );
	material.opacity = 0.7;
	mesh = new THREE.Mesh( geometry, material );
	scene.add( mesh );


	const axesHelper = new THREE.AxesHelper( 5 );
	scene.add( axesHelper );


	// Lights

	const dirLight = new THREE.DirectionalLight( 0xffffff, 0.15 );
	// dirLight.position.set( 0, 1, 0 ).normalize();
	dirLight.color.setHSL( 0.1, 0.5, 0.7 );
	scene.add( dirLight );

	const light = new THREE.AmbientLight( 0xffffff ); // soft white light
	scene.add( light );


	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );

	controls = new OrbitControls( camera, renderer.domElement );
	controls.update();

	document.body.appendChild( renderer.domElement );

	window.addEventListener( 'resize', scene_onWindowResize, false );
}

function scene_onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}

function scene_animate() {
	requestAnimationFrame( scene_animate );

	// required if controls.enableDamping or controls.autoRotate are set to true
	controls.update();

	mesh.rotation.x += 0.05;
	mesh.rotation.y += 0.03;

	renderer.render( scene, camera );
}
