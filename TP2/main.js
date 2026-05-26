import * as THREE from "three";
import GUI from "../libs/util/dat.gui.module.js";
import Stats from "../build/jsm/libs/stats.module.js";
import { createTree1, createTree2 } from "./arvore.js";
import { createAirplane } from "./aviao.js";
import { createTarget } from "./target.js";
import KeyboardState from "../libs/util/KeyboardState.js";
import { createTerrainChunk, getTerrainHeight } from "./terreno.js";
import { createEnemy } from "./inimigo.js";
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
const maxPitch = Math.PI / 16;
const maxYaw = Math.PI / 16;
const eixoRoll = new THREE.Vector3(1, 0, 0);
const eixoPitch = new THREE.Vector3(0, 0, 1);
const eixoYaw = new THREE.Vector3(0, 1, 0);
const quatRoll = new THREE.Quaternion();
const quatPitch = new THREE.Quaternion();
const quatYaw = new THREE.Quaternion();
const rotacaoBase = new THREE.Quaternion().setFromEuler(
  new THREE.Euler(0, Math.PI / 2, 0),
);
const rotacaoAlvo = new THREE.Quaternion();
const aviaoPosition = new THREE.Vector3();

aviao.quaternion.copy(rotacaoBase); // Força o avião a começar olhando para frente
scene.add(aviao);

const alvo = createTarget();
alvo.position.set(0, 5, -80);
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
const planoAlvo = new THREE.Plane(planoAlvoNormal, 80);
let pontoIntersecao = new THREE.Vector3();

const raycaster = new THREE.Raycaster();
var posMouse = new THREE.Vector2();
var intersecaoMouse = new THREE.Vector3();

const alvoLerpConfig = {
  destination: new THREE.Vector3(),
  alpha: 0.01,
  move: true,
};
const aviaoLerpConfig = {
  destination: new THREE.Vector3(),
  alpha: 0.01,
  move: true,
};
let vel = 1;
let fator = -60;
const chunkPosition = new THREE.Vector3();
let lastBorderRow = null;
let currentChunk = createChunk(0);
let lastChunkZ = 0;
const delta = clock.getDelta();
scene.add(currentChunk);
const enemies = [];
const bullets = [];
let chunks = [];
initChunks();
spawnEnemies(currentChunk, 2, 0);
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
    spawnEnemies(chunk, 2, -i * 200);
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
    const dX = pontoIntersecao.x - aviao.position.x;
    const dY = pontoIntersecao.y - (aviao.position.y + 3);
    const absX = Math.abs(dX);
    const absY = Math.abs(dY);

    const alphaX = aviaoLerpConfig.alpha * (THREE.MathUtils.smoothstep(absX, 0.0, 3.0) * 0.8 + 0.2);
    const alphaY = aviaoLerpConfig.alpha * (THREE.MathUtils.smoothstep(absY, 0.0, 3.0) * 0.8 + 0.2);

    alvo.position.x = THREE.MathUtils.lerp(alvo.position.x, pontoIntersecao.x, alvoLerpConfig.alpha);
    alvo.position.y = THREE.MathUtils.lerp(alvo.position.y, pontoIntersecao.y, alvoLerpConfig.alpha);
  
    aviao.position.x = THREE.MathUtils.lerp(aviao.position.x, pontoIntersecao.x, alphaX);
    aviao.position.y = THREE.MathUtils.lerp(aviao.position.y, pontoIntersecao.y - 3, alphaY);

    const smoothX = THREE.MathUtils.smoothstep(absX, 2, 12);
    const smoothY = THREE.MathUtils.smoothstep(absY, 1, 6);

    const anguloRoll = THREE.MathUtils.clamp(dX * 0.35, -maxRoll, maxRoll) * smoothX;
    const anguloYaw = THREE.MathUtils.clamp(dX * 0.06, -maxYaw, maxYaw) * smoothX;
    const anguloPitch = THREE.MathUtils.clamp(dY * 0.04, -maxPitch, maxPitch) * smoothY;

    quatRoll.setFromAxisAngle(eixoRoll, anguloRoll);
    quatYaw.setFromAxisAngle(eixoYaw, anguloYaw);
    quatPitch.setFromAxisAngle(eixoPitch, anguloPitch);

    // Combina a rotação base (aviao modelado em outro eixo) com a rolagem e guinagem
    // ordem importa
    rotacaoAlvo.copy(rotacaoBase)
      .multiply(quatYaw)
      .multiply(quatPitch)
      .multiply(quatRoll);

    aviao.quaternion.slerp(rotacaoAlvo, 0.1);
  }
}

function getHeight(noise, x, z) {
  return noise.noise(x * 0.03, z * 0.03, 0) * 15;
}

function spawnEnemies(chunk, amount, zBase) {
  for (let i = 0; i < amount; i++) {

    const x = -15 + Math.random() * 25;
    const z = zBase + 300 - Math.random() * 200;
    const y = 15 + Math.random() * 10;

    const position = new THREE.Vector3(x, y, z);

    createEnemy(scene, position);
  }
}

function spawnTrees(chunk, amount, zBase) {
  const trees = [];
  const minDistance = 8; // distância mínima entre árvores

  for (let i = 0; i < amount; i++) {
    let validPosition = false;
    let x, z;

    while (!validPosition) {
      validPosition = true;

      x = (Math.random() - 0.5) * 200;
      z = zBase + (Math.random() - 0.5) * 400;
      const y = getTerrainHeight(x, z);
      // Verifica distância com árvores existentes
      for (let j = 0; j < trees.length; j++) {

        const dx = x - trees[j].position.x;
        const dy = y - trees[j].position.y;
        const dz = z - trees[j].position.z;

        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
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
      switch (vel) {
        case 1: loadingMessage.changeMessage("Velocidade 1");
          break;
        case 2: loadingMessage.changeMessage("Velocidade 2");
          break;
        case 3: loadingMessage.changeMessage("Velocidade 3");
          break;
      }
      document.body.style.cursor = 'none';
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
    aviao.position.z += delta;
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
    spawnEnemies(newChunk, 2, newZ);
    const oldChunk = chunks.shift();
    scene.remove(oldChunk);
    lastChunkZ = newZ;
  }

  // inimigos: movimento lateral + tiro mirando no avião
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    if (!enemy) continue;

    // remove os que já ficaram para trás do avião (frente = -Z)
    if (enemy.position.z > aviao.position.z + 80) {
      scene.remove(enemy);
      enemies.splice(i, 1);
      continue;
    }

    // movimento lateral: de uma lateral em direção à oposta
    enemy.position.x += enemy.userData.moveDir * enemy.userData.speed * rawDelta;

    // direção até o avião, recalculada a cada tiro para mirar nele
    const direction = new THREE.Vector3()
      .subVectors(aviao.position, enemy.position)
      .normalize();

    // cadência baseada em tempo real (segundos)
    enemy.userData.shootCooldown -= rawDelta;
    if (enemy.userData.shootCooldown <= 0) {
      createBullet(scene, enemy.position, direction, bullets);
      enemy.userData.shootCooldown = enemy.userData.shootDelay;
    }
  }

  // tiros: avançam em linha reta e somem pelo tempo de vida (não pela origem do mundo)
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    bullet.position.add(bullet.userData.velocity.clone().multiplyScalar(rawDelta));
    bullet.userData.life -= rawDelta;
    if (bullet.userData.life <= 0) {
      scene.remove(bullet);
      bullets.splice(i, 1);
    }
  }
  requestAnimationFrame(render);
  renderer.render(scene, camera);
}
