import * as THREE from "three";
import GUI from "../libs/util/dat.gui.module.js";
import Stats from "../build/jsm/libs/stats.module.js";
import { createTree1, createTree2 } from "./arvore.js";
import { createAirplane } from "./aviao.js";
import { createTarget } from "./target.js";
import KeyboardState from "../libs/util/KeyboardState.js";
import { createTerrainChunk, getTerrainHeight } from "./terreno.js";
import {
  initRenderer,
  SecondaryBox,
  initDefaultBasicLight,
  onWindowResize,
  InfoBox,
  createGroundPlaneWired,
} from "../libs/util/util.js";
import { KeyframeTrack } from "../build/three.core.js";

// boilerplate code
let clock = new THREE.Clock();
let baseColor = "rgb(175, 200, 220)"; // cor de background e fog
let keyboard = new KeyboardState();
let renderer = initRenderer(); // View function in util/utils
renderer.setClearColor(baseColor);
let scene = new THREE.Scene();
scene.fog = new THREE.Fog(baseColor, 1, 250);

initDefaultBasicLight(scene, true); // iluminacao basica
document.body.style.cursor = 'none';
// camera, adicionar modo livre
const camera = new THREE.PerspectiveCamera(
  30,
  window.innerWidth / window.innerHeight,
  0.1,
  600,
);
let isFlyOn = true;
camera.position.set(0, 20.0, -10.0);
camera.lookAt(0, 20, -10);
camera.up.set(0, 1, 0);

// fps container
const container = document.getElementById("fps-container");
const stats = new Stats();
container.appendChild(stats.dom);

// informacoes, canto inf direito
let loadingMessage = new SecondaryBox("Velocidade 1");
var controls = new InfoBox();
var showInfo = true;
showInformation(controls);
buildInterface();

// eixo longitudinal da fuselagem = X local => rolagem no X
// eixo lateral (asas) = Z local => guinagem no Z
// eixo vertical = Y local => arfagem no Y
// isso significa que apesar da cena prosseguir no Z global
// o aviao se translada em seu X local

const aviao = createAirplane();
aviao.position.set(0, 10, -50);
const maxRoll = Math.PI / 3;
const maxPitch = Math.PI / 4;
const eixoRoll = new THREE.Vector3(1, 0, 0);
const eixoPitch = new THREE.Vector3(0, 0, 1);
const quatRoll = new THREE.Quaternion();
const quatPitch = new THREE.Quaternion();
const rotacaoBase = new THREE.Quaternion().setFromEuler(
  new THREE.Euler(0, Math.PI / 2, 0),
);
const rotacaoAlvo = new THREE.Quaternion();
const aviaoPosition = new THREE.Vector3();

aviao.quaternion.copy(rotacaoBase); // Força o avião a começar olhando para frente
scene.add(aviao);

const alvo = createTarget();
alvo.position.set(0, 5, -50);
scene.add(alvo);

window.addEventListener(
  "resize",
  function () {
    onWindowResize(camera, renderer);
  },
  false,
);
window.addEventListener("mousemove", onMouseMove);

// sincronização alvo e mouse
const planoAlvoNormal = new THREE.Vector3(0, 0, 1);
const planoAlvo = new THREE.Plane(planoAlvoNormal, 50);
const pontoIntersecao = new THREE.Vector3();

const raycaster = new THREE.Raycaster();
var posMouse = new THREE.Vector2();
var intersecaoMouse = new THREE.Vector3();

const alvoLerpConfig = {
  destination: new THREE.Vector3(),
  alpha: 0.04,
  move: true,
};
const aviaoLerpConfig = {
  destination: new THREE.Vector3(),
  alpha: 0.04,
  move: true,
};
let vel = 1;
let fator = -60;
const chunkPosition = new THREE.Vector3();
let lastBorderRow = null;
let currentChunk = createChunk(0);
let lastChunkZ = 0;
scene.add(currentChunk);
let chunks = [];
initChunks();
render();

//-- FUNCTIONS ---------------------------------------------------
function showInformation(controls) {
  controls.add("Trabalho 2");
  controls.addParagraph();
  controls.show();
}

function createChunk(zPosition) {
  const chunk = new THREE.Group();

  const terrain = createTerrainChunk(zPosition);
  terrain.position.z = zPosition;

  chunk.add(terrain);

  let trees = (Math.random() * 100 + 100 + 1) | 0;
  spawnTrees(chunk, trees, zPosition);

  return chunk;
}

function initChunks() {
  lastBorderRow = null;
  for (let i = 0; i < 3; i++) {
    const chunk = createChunk(-i * 200);
    chunks.push(chunk);
  }
  lastChunkZ = -200;
}

// atualiza movimento do mouse por event
function onMouseMove(event) {
  posMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  posMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

// inicialmente era pra tratar somente intersecao do mouse por raycast
// mas convinientemente acabou sendo um bom lugar para fazer lerp e slerp
function intersecoesLERPeSLERP() {
  raycaster.setFromCamera(posMouse, camera);
  planoAlvo.constant = -alvo.position.z;
  raycaster.ray.intersectPlane(planoAlvo, pontoIntersecao);

  if (pontoIntersecao && aviaoLerpConfig.move && alvoLerpConfig.move) {
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
      aviaoLerpConfig.alpha,
    );
    aviao.position.y = THREE.MathUtils.lerp(
      aviao.position.y,
      pontoIntersecao.y - 3,
      aviaoLerpConfig.alpha,
    );

    const dX = pontoIntersecao.x - aviao.position.x;
    let anguloRoll = THREE.MathUtils.clamp(dX * 0.15, -maxRoll, maxRoll);
    quatRoll.setFromAxisAngle(eixoRoll, anguloRoll);

    const dY = pontoIntersecao.y - (aviao.position.y + 3);
    let anguloPitch = THREE.MathUtils.clamp(dY * 0.05, -maxPitch, maxPitch);
    quatPitch.setFromAxisAngle(eixoPitch, anguloPitch);

    // Combina a rotação base (aviao modelado em outro eixo) com a rolagem e guinagem
    // ordem importa
    rotacaoAlvo.copy(rotacaoBase).multiply(quatPitch).multiply(quatRoll);

    aviao.quaternion.slerp(rotacaoAlvo, aviaoLerpConfig.alpha * 2);
  }
}

function getHeight(noise, x, z) {
  return noise.noise(x * 0.03, z * 0.03, 0) * 15;
}

function spawnTrees(chunk, amount, zBase) {
  const trees = [];
  const minDistance = 5; // distância mínima entre árvores

  for (let i = 0; i < amount; i++) {
    let validPosition = false;
    let x, z;

    while (!validPosition) {
      validPosition = true;

      x = (Math.random() - 0.5) * 200;
      z = zBase + (Math.random() - 0.5) * 400;

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

    const y = getTerrainHeight(x, z);
    tree.position.set(x, y, z);

    // escala aleatória
    const scale = 0.5 + Math.random() * 0.8;
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
  if (keyboard.down("esc")) {
    isFlyOn = !isFlyOn;
    if (isFlyOn) {
      switch(vel){
        case 1: loadingMessage.changeMessage("Velocidade 1");
        break;
        case 2: loadingMessage.changeMessage("Velocidade 2");
        break;
        case 3: loadingMessage.changeMessage("Velocidade 3");
        break;
      }
      scene.add(alvo);
    } else {
      loadingMessage.changeMessage("Pause");
      document.body.style.cursor = 'default';
      scene.remove(alvo);
    }
  }
  if (keyboard.down("1")) {
    fator = -60;
    loadingMessage.changeMessage("Velocidade 1");
    vel = 1;
  }
  if (keyboard.down("2")) {
    fator = -120;
    loadingMessage.changeMessage("Velocidade 2");
    vel = 2;
  }
  if (keyboard.down("3")) {
    fator = -180;
    loadingMessage.changeMessage("Velocidade 3");
    vel = 3;
    
  }
}

function render() {
  const delta = clock.getDelta() * fator;
  stats.update();
  keyboardUpdate();

  if (isFlyOn) {
    camera.translateZ(delta);
    aviao.translateX(-1 * delta);
    alvo.translateZ(delta);
    intersecoesLERPeSLERP();
  }

  aviao.getWorldPosition(aviaoPosition);
  currentChunk.getWorldPosition(chunkPosition);

  if (aviao.position.z < lastChunkZ + 200) {
    const newZ = lastChunkZ - 200;
    const newChunk = createChunk(newZ);
    scene.add(newChunk);
    chunks.push(newChunk);
    const oldChunk = chunks.shift();
    scene.remove(oldChunk);
    lastChunkZ = newZ;
  }

  requestAnimationFrame(render);
  renderer.render(scene, camera);
}
