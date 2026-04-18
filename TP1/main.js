import * as THREE from "three";
import GUI from "../libs/util/dat.gui.module.js";
import Stats from "../build/jsm/libs/stats.module.js";
import { createTree1, createTree2 } from "./arvore.js";
import { createAirplane } from "./aviao.js";
import { createTarget } from "./target.js";
import KeyboardState from "../libs/util/KeyboardState.js";
import {
  initRenderer,
  SecondaryBox,
  initDefaultBasicLight,
  onWindowResize,
  InfoBox,
  createGroundPlaneWired,
} from "../libs/util/util.js";

// boilerplate code
let clock = new THREE.Clock();
let baseColor = "rgb(175, 200, 220)"; // cor de background e fog
let keyboard = new KeyboardState();
let renderer = initRenderer(); // View function in util/utils
renderer.setClearColor(baseColor);
let scene = new THREE.Scene();
scene.fog = new THREE.Fog(baseColor, 1, 100);

initDefaultBasicLight(scene, true); // iluminacao basica

// Listen window size changes
window.addEventListener(
  "resize",
  function () {
    onWindowResize(camera, renderer);
  },
  false,
);

// camera, adicionar modo livre
let camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
let isFlyOn = true;
camera.position.set(0, 18.0, -10.0);
camera.lookAt(0, 18, -40);
camera.up.set(0, 1, 0);

// fps container
const container = document.getElementById("fps-container");
const stats = new Stats();
container.appendChild(stats.dom);

let loadingMessage = new SecondaryBox("");
var controls = new InfoBox();
var showInfo = true;
showInformation(controls);
buildInterface();

window.addEventListener("mousemove", onMouseMove);

// geracao de arvores, fazer geracao automatica

let aviao = createAirplane();
aviao.position.set(0, 10, -50);
camera.add(aviao);
scene.add(aviao);

let alvo = createTarget();
alvo.position.set(0, 5, -50);
scene.add(alvo);

const planoAlvoNormal = new THREE.Vector3(0, 0, 1);
const planoAlvo = new THREE.Plane(planoAlvoNormal, 50); // O "50" coloca o plano em Z = -50
const pontoIntersecao = new THREE.Vector3(); // Variável auxiliar para guardar o resultado

const raycaster = new THREE.Raycaster();
var posMouse = new THREE.Vector2();
var intersecaoMouse = new THREE.Vector3();

const alvoLerpConfig = {
  destination: new THREE.Vector3(),
  alpha: 0.1,
  move: true,
};
const planeLerpConfig = {
  destination: new THREE.Vector3(),
  alpha: 0.05,
  move: true,
};

let currentChunk = createChunk(0);
scene.add(currentChunk);
render();

//-- FUNCTIONS ---------------------------------------------------
function showInformation(controls) {
  controls.add("Trabalho 1");
  controls.addParagraph();
  controls.show();
}

function createChunk(zPosition) {
  const chunk = new THREE.Group();

  let groundPlane = createGroundPlaneWired(
    400,
    400,
    80,
    80,
    2,
    "olivedrab",
    "gainsboro",
  );

  groundPlane.rotation.x = -Math.PI / 2;
  groundPlane.position.z = zPosition;

  chunk.add(groundPlane);
  spawnTrees(chunk, 300, zPosition);
  return chunk;
}

function hideInformation(controls) {
  if (
    controls &&
    controls.domElement &&
    document.body.contains(controls.domElement)
  ) {
    document.body.removeChild(controls.domElement);
  }
}

function onMouseMove(event) {
  posMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  posMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function checkIntersections() {
  raycaster.setFromCamera(posMouse, camera);
  planoAlvo.constant = -alvo.position.z;
  raycaster.ray.intersectPlane(planoAlvo, pontoIntersecao);
  if (pontoIntersecao) {
    alvo.position.x = THREE.MathUtils.lerp(
      alvo.position.x,
      pontoIntersecao.x,
      alvoLerpConfig.alpha,
    );
    alvo.position.y = THREE.MathUtils.lerp(
      alvo.position.y,
      pontoIntersecao.y,
      alvoLerpConfig.alpha,
    );
    aviao.position.x = THREE.MathUtils.lerp(
      aviao.position.x,
      pontoIntersecao.x,
      planeLerpConfig.alpha,
    );
    aviao.position.y = THREE.MathUtils.lerp(
      aviao.position.y,
      pontoIntersecao.y - 5,
      planeLerpConfig.alpha,
    );
  }
}
/*
const v0 = new THREE.Vector3()
const q = new THREE.Quaternion()
const angularVelocity = new THREE.Vector3()
q.setFromAxisAngle(angularVelocity, delta).normalize()
sphere.applyQuaternion(q)
angularVelocity.lerp(v0, 0.01)
*/
function spawnTrees(chunk, amount, zBase) {
  const trees = [];
  const minDistance = 5; // distância mínima entre árvores

  for (let i = 0; i < amount; i++) {
    let validPosition = false;
    let x, z;

    while (!validPosition) {
      validPosition = true;

      x = (Math.random() - 0.5) * 100;
      z = zBase + (Math.random() - 0.5) * 200;

      // Verifica distância com árvores existentes
      for (let j = 0; j < trees.length; j++) {
        const dx = x - trees[j].position.x;
        const dz = z - trees[j].position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance < minDistance) {
          validPosition = false;
          break;
        }
      }
    }

    // Escolhe tipo de árvore
    const tree =
      Math.random() > 0.5 ? createTree1().clone() : createTree2().clone();

    tree.position.set(x, 0, z);

    // escala aleatória
    const scale = 0.5 + Math.random() * 1.5;
    tree.scale.set(scale, scale, scale);

    chunk.add(tree);
    trees.push(tree);
  }

  return trees;
}

function buildInterface() {
  var controls = new (function () {
    this.color = baseColor;
    this.updateColor = function () {
      renderer.setClearColor(this.color);
      scene.fog.color = new THREE.Color(this.color);
    };
  })();

  var gui = new GUI();
  gui.add(scene.fog, "far", 16, 500).name("Fog Distance");
}

function keyboardUpdate() {
  keyboard.update();
  if (keyboard.down("enter")) {
    isFlyOn = !isFlyOn;
    isFlyOn
      ? loadingMessage.changeMessage("Fly On")
      : loadingMessage.changeMessage("Fly Off");
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
  if (isFlyOn) {
    camera.translateZ(delta * -12);
    aviao.translateZ(delta * -12);
    alvo.translateZ(delta * -12);
  }
  checkIntersections();

  if (aviao.position.z < currentChunk.position.z - 100) {
    scene.remove(currentChunk);
    currentChunk = createChunk(aviao.position.z - 200);
    scene.add(currentChunk);
  }

  requestAnimationFrame(render);
  renderer.render(scene, camera);
}
