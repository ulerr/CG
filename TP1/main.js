// fog example, filtrar oq precisa e refazer
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

let clock = new THREE.Clock();
let freeFlight = true;
let baseColor = "rgb(175, 200, 220)"; // It's important the fog color is the same as the background
let keyboard = new KeyboardState();
let scene = new THREE.Scene();    // Create main scene
    scene.fog = new THREE.Fog(baseColor, 1, 100); // ADD FOG TO THE SCENE
let renderer = initRenderer();    // View function in util/utils
   renderer.setClearColor(baseColor); // Set background to match fog color
let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(10.0, 15.0, 0.0);
camera.up.set(0, 1, 0);
initDefaultBasicLight(scene, true); // Use default light

const container = document.getElementById('fps-container');
const stats = new Stats();
container.appendChild(stats.dom);

// Listen window size changes
window.addEventListener('resize', function () { onWindowResize(camera, renderer) }, false);

let groundPlane = createGroundPlaneWired(400, 400, 80, 80, 2, "olivedrab", "gainsboro");
scene.add(groundPlane);

// para testes, remover posteriormente
let flyCamera = new FlyControls(camera, renderer.domElement);
flyCamera.movementSpeed = 10;
flyCamera.domElement = renderer.domElement;
flyCamera.rollSpeed = 0;
flyCamera.autoForward = true;
flyCamera.dragToLook = true;

let loadingMessage = new SecondaryBox("");
showInformation();
buildInterface();

render();

//-- FUNCTIONS ---------------------------------------------------
function showInformation() {
   var controls = new InfoBox();
   controls.add("Fly Controls Example");
   controls.addParagraph();
   controls.add("Keyboard:");
   controls.add("* WASD - Move");
   controls.add("* R | F - up | down");
   controls.add("* Q | E - roll");
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
scene.add(target);

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
       freeFlight = !freeFlight;
       freeFlight ? loadingMessage.changeMessage("Fly On") : loadingMessage.changeMessage("Fly Off");
   }
}

function render() {
   const delta = clock.getDelta();
   stats.update();
   keyboardUpdate();
   if (freeFlight) flyCamera.update(delta);
   requestAnimationFrame(render);
   renderer.render(scene, camera)
}
