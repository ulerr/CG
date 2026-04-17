import * as THREE from 'three';
import GUI from '../libs/util/dat.gui.module.js'
import Stats from '../build/jsm/libs/stats.module.js';
import { createTree1, createTree2 } from './arvore.js';
import { createAirplane } from './aviao.js';
import { createTarget } from './target.js';
import { FlyControls } from '../build/jsm/controls/FlyControls.js';
import KeyboardState from '../libs/util/KeyboardState.js';
import {
   initRenderer,
   SecondaryBox,
   initDefaultBasicLight,
   onWindowResize,
   InfoBox,
   createGroundPlaneWired
} from "../libs/util/util.js";

// boilerplate code
let clock = new THREE.Clock();
let baseColor = "rgb(175, 200, 220)"; // cor de background e fog
let keyboard = new KeyboardState();
let renderer = initRenderer();    // View function in util/utils
   renderer.setClearColor(baseColor);
let scene = new THREE.Scene();
   scene.fog = new THREE.Fog(baseColor, 1, 100);

initDefaultBasicLight(scene, true); // iluminacao basica

// Listen window size changes
window.addEventListener('resize', function () { onWindowResize(camera, renderer) }, false);

let groundPlane = createGroundPlaneWired(400, 400, 80, 80, 2, "olivedrab", "gainsboro");
scene.add(groundPlane);

// camera, adicionar modo livre
let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
let isFlyOn = true;
camera.position.set(10.0, 15.0, 0.0);
camera.up.set(0, 1, 0);

let flyCamera = new FlyControls(camera, renderer.domElement);
flyCamera.movementSpeed = 10;
flyCamera.domElement = renderer.domElement;
flyCamera.rollSpeed = 0;
flyCamera.autoForward = true;
flyCamera.dragToLook = true;


// fps container
const container = document.getElementById('fps-container');
const stats = new Stats();
container.appendChild(stats.dom);

let loadingMessage = new SecondaryBox("");
var controls = new InfoBox();
var showInfo = true;
showInformation(controls);
buildInterface();

window.addEventListener('mousemove', onMouseMove);

const raycaster = new THREE.Raycaster();

// geracao de arvores, fazer geracao automatica
let arvore1 = createTree1();
arvore1.position.set(0, 0, -20);
scene.add(arvore1);

let arvore2 = createTree2();
arvore2.position.set(0,0,-25);
scene.add(arvore2);

let aviao = createAirplane();
aviao.position.set(0, 5, -40);
scene.add(aviao);

let target = createTarget();
target.position.set(0, 5, -50);
let targetPlane = new THREE.Plane((0,-1,0),0);
scene.add(target);

// Variables that will be used for linear interpolation
var posMouse = new THREE.Vector2();
var intersecaoMouse = new THREE.Vector3();
const lerpConfig = {
  destination: new THREE.Vector3(-20.0, -30.0, -10.0),
  alpha: 0.01,
  move: true
}

render();

//-- FUNCTIONS ---------------------------------------------------
function showInformation(controls) {
   controls.add("Fly Controls Example");
   controls.addParagraph();
   controls.add("Keyboard:");
   controls.add("* WASD - Move");
   controls.add("* R | F - up | down");
   controls.add("* Q | E - roll");
   controls.add("* F - toggle show/hide information");
   controls.add("* Enter - start/stop fly control");
   controls.addParagraph();
   controls.add("Mouse and Keyboard arrows:");
   controls.add("* up | down    - pitch");
   controls.add("* left | right - yaw");
   controls.addParagraph();
   controls.add("Mouse buttons:");
   controls.add("* Left  - Move forward");
   controls.add("* Right - Move backward");

   controls.show();
}

function hideInformation(controls) {
   if (controls && controls.domElement && document.body.contains(controls.domElement)) {
      document.body.removeChild(controls.domElement);
   }
}

function onMouseMove(event) {
	posMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	posMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function checkIntersections() {
  raycaster.setFromCamera(posMouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);
  if (intersects.length > 0) {
    
  }
}

function buildInterface() {
   var controls = new function () {
      this.color = baseColor;
      this.updateColor = function () {
         renderer.setClearColor(this.color);
         scene.fog.color = new THREE.Color(this.color);
      };
   };

   var gui = new GUI();
   gui.add(scene.fog, 'far', 16, 500)
      .name("Fog Distance");
}

function keyboardUpdate() {
   keyboard.update();
   if (keyboard.down("enter"))
   {
       isFlyOn = !isFlyOn;
       isFlyOn ? loadingMessage.changeMessage("Fly On") : loadingMessage.changeMessage("Fly Off");
   }
   if (keyboard.down("f")) {
      if (showInfo) {
         hideInformation(controls);
         showInfo = false;
      } else {
         showInformation(controls);
         showInfo = true;
      }
   }
}

function render() {
   const delta = clock.getDelta();
   stats.update();
   keyboardUpdate();
   if (isFlyOn) flyCamera.update(delta);
	 checkIntersections();
   // if(intersecaoMouse != null) aviao.position.lerp(intersecaoMouse, lerpConfig.alpha);
   requestAnimationFrame(render);
   renderer.render(scene, camera)
}
