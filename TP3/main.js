// IMPORTS

import * as THREE from "three";
import GUI from "../libs/util/dat.gui.module.js";
import Stats from "../build/jsm/libs/stats.module.js";
import KeyboardState from "../libs/util/KeyboardState.js";
import { initRenderer, SecondaryBox, onWindowResize, InfoBox } from "../libs/util/util.js";

import { aoIniciar } from "./gerenciadorAssets.js";
import { createTree1, createTree2 } from "./arvore.js";
import { createAirplane } from "./aviao.js";
import { createTarget } from "./target.js";

import { KeyframeTrack } from "../build/three.core.js";

import {
  createTerrainChunk,
  getTerrainHeight,
  createAguaChunk,
  atualizarAgua,
  setFogFar,
  NIVEL_AGUA,
} from "./terreno.js";

import { createEnemy, createBullet } from "./inimigo.js";
import { createPlayerShot } from "./tiroJogador.js";
import { createHealthPack, atualizarHealthPacks, configHealthPack } from "./healthpack.js";

import {
  initInterface,
  setEnergia,
  setInvencivel,
  registrarTiroRecebido,
  mostrarGameOver,
} from "./interface.js";

import {
  initControlesMobile,
  dispositivoTouch,
  atualizarMira,
  joystickEmUso,
} from "./mobile.js";

import {
  initSons,
  iniciarAudio,
  toggleMusica,
  somTiroPlayer,
  somHealthPack,
  somAviaoAtingido,
  somInimigoAbatido,
} from "./sons.js";

//-- BOILERPLATE --------------------------------------------------
const clock = new THREE.Clock();
const baseColor = "rgb(175, 200, 220)"; // cor de background e fog
const keyboard = new KeyboardState();
const renderer = initRenderer();
renderer.setClearColor(baseColor);
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(baseColor, 1, 250);

//-- LUZES ---------------------------------------------------------
const corLuz = "rgb(255,255,255)";
const luz = new THREE.DirectionalLight(corLuz, 5);
luz.position.set(1, 1, 0);
luz.castShadow = true;

const luzAmbiente = new THREE.AmbientLight(corLuz, 0.3);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // sombras suaves

luz.shadow.mapSize.width = 2048; // boa resolução sem travar
luz.shadow.mapSize.height = 2048;
luz.shadow.bias = -0.0005;

// A câmera de sombra só precisa ser reconfigurada quando o alcance do
// fog muda (via GUI) — e não a cada frame, como era antes.
function configurarCameraSombra() {
  const alcanceVisivel = scene.fog.far * 1.25;
  luz.shadow.camera.near = 1;
  luz.shadow.camera.far = alcanceVisivel + 5;
  luz.shadow.camera.left = -alcanceVisivel * 0.5;
  luz.shadow.camera.right = alcanceVisivel * 0.5;
  luz.shadow.camera.top = alcanceVisivel * 0.5;
  luz.shadow.camera.bottom = -alcanceVisivel * 0.5;
  luz.shadow.camera.updateProjectionMatrix();
}
configurarCameraSombra();

scene.add(luz);
scene.add(luzAmbiente);

document.body.style.cursor = "none";

//-- CÂMERA ----------------------------------------------------------
const camera = new THREE.PerspectiveCamera(
  30,
  window.innerWidth / window.innerHeight,
  0.1,
  600,
);
camera.position.set(0, 20.0, -10.0);
camera.lookAt(0, 20, -10);
camera.up.set(0, 1, 0);

const camRotacaoBase = camera.quaternion.clone();

const maxCamYaw = Math.PI / 32;
const maxCamPitch = Math.PI / 48;

const camQuatYaw = new THREE.Quaternion();
const camQuatPitch = new THREE.Quaternion();
const camRotacaoAlvo = new THREE.Quaternion();

//-- HUD / FPS ---------------------------------------------------------
const stats = new Stats();
document.getElementById("fps-container").appendChild(stats.dom);

const loadingMessage = new SecondaryBox("Velocidade 1");
// Instruções de teclado só fazem sentido no desktop; no mobile a caixa
// ocuparia o canto inferior esquerdo, onde fica o joystick virtual.
if (!dispositivoTouch()) {
  const infoBox = new InfoBox();
  showInformation(infoBox);
}
initInterface();
buildInterface();

//-- ESTADO DO JOGO ----------------------------------------------------
// Avião suporta 20 tiros => cada tiro tira 5% de energia.
const DANO_POR_TIRO = 5;
const CURA_HEALTH_PACK = 25; // "aumentam a energia do avião em 25%"
let energia = 100;
let invencivel = false;
let inimigosAbatidos = 0;
let gameOver = false;
let isFlyOn = true;
let vel = 1;
let fator = -60;

//-- AVIÃO --------------------------------------------------------------
// eixo longitudinal da fuselagem = X local => rolagem no X
// eixo lateral (asas) = Z local => guinagem no Z
// eixo vertical = Y local => arfagem no Y
// isso significa que apesar da cena prosseguir no Z global
// o avião se translada em seu X local
const aviao = createAirplane();
aviao.traverse((child) => {
  if (child.isMesh) child.castShadow = true;
});
aviao.position.set(0, 10, -50);

const maxRoll = Math.PI / 3;
const maxPitch = Math.PI / 16;
const maxYaw = Math.PI / 16;
const EIXO_X = new THREE.Vector3(1, 0, 0);
const EIXO_Y = new THREE.Vector3(0, 1, 0);
const EIXO_Z = new THREE.Vector3(0, 0, 1);
const quatRoll = new THREE.Quaternion();
const quatPitch = new THREE.Quaternion();
const quatYaw = new THREE.Quaternion();
const rotacaoBase = new THREE.Quaternion().setFromEuler(
  new THREE.Euler(0, Math.PI / 2, 0),
);
const rotacaoAlvo = new THREE.Quaternion();

aviao.quaternion.copy(rotacaoBase); // avião começa olhando para frente
scene.add(aviao);

// A luz segue o avião; o target só precisa ser atribuído uma vez.
luz.target = aviao;

const alvo = createTarget();
alvo.position.set(0, 5, -80);
scene.add(alvo);

//-- EVENTOS ------------------------------------------------------------
window.addEventListener("resize", () => onWindowResize(camera, renderer), false);
window.addEventListener("mousemove", onMouseMove);

// --- Tiro do player ---
const playerShots = [];
let isMouseDown = false;
let playerShootCooldown = 0;
const playerShootDelay = 0.15; // cadência (s) com botão esquerdo pressionado

window.addEventListener("mousedown", (e) => {
  if (e.button !== 0 || gameOver) return; // apenas botão esquerdo
  if (!isFlyOn) {
    // clicar na tela retoma a simulação (ESC pausa, clique retoma)
    isFlyOn = true;
    document.body.style.cursor = "none";
    scene.add(alvo);
    loadingMessage.changeMessage("Velocidade " + vel);
  } else {
    isMouseDown = true;
  }
});
window.addEventListener("mouseup", (e) => {
  if (e.button === 0) isMouseDown = false;
});

//-- MIRA / RAYCAST -------------------------------------------------------
const planoAlvo = new THREE.Plane(new THREE.Vector3(0, 0, 1), 80);
const pontoIntersecao = new THREE.Vector3();
const raycaster = new THREE.Raycaster();
const posMouse = new THREE.Vector2();

//-- MUNDO ---------------------------------------------------------------
const enemies = [];
const bullets = [];
const healthPacks = [];
const chunks = [];
let lastChunkZ = 0;

// vetores/caixas temporários reutilizados no loop de render, para não
// alocar objetos novos a cada frame (evita pressão no garbage collector)
const _vTmp = new THREE.Vector3();
const _prevPos = new THREE.Vector3();
const _boxAviao = new THREE.Box3();
const _boxTiro = new THREE.Box3();
const _boxInimigo = new THREE.Box3();

// O mundo, o loop de render e a música só começam quando o jogador
// pressiona START na página de carregamento. Criar os chunks aqui (e
// não no import do módulo) garante que o modelo do drone e as
// texturas do terreno já estejam carregados quando forem usados.
aoIniciar(() => {
  initChunks();
  initSons(camera);
  iniciarAudio();
  initControlesMobile(); // só cria joystick/botões em dispositivos de toque
  clock.getDelta(); // zera o delta acumulado durante o carregamento
  render();
});

//-- FUNCTIONS ---------------------------------------------------
function showInformation(box) {
  box.add("Trabalho 3 — Rail Shooter");
  box.addParagraph();
  box.add("Mouse: mira e voo | Botão esq.: atirar");
  box.add("1/2/3: velocidade | G: invencível | S: música | ESC: pausa");
  box.show();
}

function createChunk(zPosition) {
  const chunk = new THREE.Group();

  const terrain = createTerrainChunk(zPosition);
  terrain.position.z = zPosition;
  chunk.add(terrain);

  // plano de água do chunk (shader), nas regiões baixas do terreno
  const agua = createAguaChunk();
  agua.position.z = zPosition;
  chunk.add(agua);

  const qtdArvores = THREE.MathUtils.randInt(50, 100);
  spawnTrees(chunk, qtdArvores, zPosition);

  return chunk;
}

function initChunks() {
  for (let i = 0; i < 3; i++) {
    const chunk = createChunk(-i * 200);
    spawnEnemies(2);
    scene.add(chunk);
    chunks.push(chunk);
  }
  lastChunkZ = -400;
}

// atualiza posição do mouse normalizada (NDC) por evento
function onMouseMove(event) {
  posMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  posMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

// inicialmente era pra tratar somente interseção do mouse por raycast
// mas convenientemente acabou sendo um bom lugar para fazer lerp e slerp
function intersecoesLERPeSLERP() {
  raycaster.setFromCamera(posMouse, camera);
  planoAlvo.constant = -alvo.position.z;
  // intersectPlane devolve null quando o raio não corta o plano; o
  // Vector3 de saída continua "truthy", então é o RETORNO que deve
  // ser testado (bug herdado da versão anterior).
  const intersectou = raycaster.ray.intersectPlane(planoAlvo, pontoIntersecao);
  if (!intersectou) return;

  const dX = pontoIntersecao.x - aviao.position.x;
  const dY = pontoIntersecao.y - (aviao.position.y + 3);
  const absX = Math.abs(dX);
  const absY = Math.abs(dY);

  const alphaX = 0.01 * (THREE.MathUtils.smoothstep(absX, 0.0, 3.0) * 1.5 + 0.2);
  const alphaY = 0.01 * (THREE.MathUtils.smoothstep(absY, 0.0, 3.0) * 1.5 + 0.2);

  alvo.position.x = pontoIntersecao.x;
  alvo.position.y = pontoIntersecao.y;

  aviao.position.x = THREE.MathUtils.lerp(aviao.position.x, pontoIntersecao.x, alphaX);
  aviao.position.y = THREE.MathUtils.lerp(aviao.position.y, pontoIntersecao.y - 3, alphaY);

  const smoothX = THREE.MathUtils.smoothstep(absX, 4, 24);
  const smoothY = THREE.MathUtils.smoothstep(absY, 2, 9);

  const anguloRoll = THREE.MathUtils.clamp(dX * 0.35, -maxRoll, maxRoll) * smoothX;
  const anguloYaw = THREE.MathUtils.clamp(dX * 0.06, -maxYaw, maxYaw) * smoothX;
  const anguloPitch = THREE.MathUtils.clamp(dY * 0.04, -maxPitch, maxPitch) * smoothY;

  quatRoll.setFromAxisAngle(EIXO_X, anguloRoll);
  quatYaw.setFromAxisAngle(EIXO_Y, anguloYaw);
  quatPitch.setFromAxisAngle(EIXO_Z, anguloPitch);

  // Combina a rotação base (avião modelado em outro eixo) com a
  // rolagem e guinagem — a ordem importa
  rotacaoAlvo.copy(rotacaoBase).multiply(quatYaw).multiply(quatPitch).multiply(quatRoll);
  aviao.quaternion.slerp(rotacaoAlvo, 0.1);

  // câmera acompanha suavemente as bordas da tela
  const dXcam = aviao.position.x;
  const dYcam = aviao.position.y - 17;

  const fatorBordaX = THREE.MathUtils.smoothstep(Math.abs(dXcam), 5.0, 25.0) * Math.sign(dXcam);
  const fatorBordaY = THREE.MathUtils.smoothstep(Math.abs(dYcam), 5.0, 15.0) * Math.sign(dYcam);

  camQuatYaw.setFromAxisAngle(EIXO_Y, -fatorBordaX * maxCamYaw);
  camQuatPitch.setFromAxisAngle(EIXO_X, fatorBordaY * maxCamPitch);

  camRotacaoAlvo.copy(camRotacaoBase).multiply(camQuatYaw).multiply(camQuatPitch);
  camera.quaternion.slerp(camRotacaoAlvo, 0.008);

  const dXmax = 6.0;
  const dYmax = 4.0;
  camera.position.x = THREE.MathUtils.lerp(camera.position.x, fatorBordaX * dXmax, 0.02);
  camera.position.y = THREE.MathUtils.lerp(camera.position.y, 20.0 + fatorBordaY * dYmax, 0.02);
}

function spawnEnemies(amount) {
  for (let i = 0; i < amount; i++) {
    const fromLeft = Math.random() > 0.5;
    const x = fromLeft ? -45 : 45;
    const dirX = fromLeft ? 1 : -1;

    const z = aviao.position.z - (120 + Math.random() * 200);
    const y = 15 + Math.random() * 10;

    createEnemy(scene, new THREE.Vector3(x, y, z), enemies, dirX);
  }
}

function spawnTrees(chunk, amount, zBase) {
  const trees = [];
  const minDistance = 8; // distância mínima entre árvores
  const maxTentativas = 15; // evita loop infinito se o chunk lotar

  for (let i = 0; i < amount; i++) {
    let x = 0;
    let y = 0;
    let z = 0;
    let posicionou = false;

    for (let tentativa = 0; tentativa < maxTentativas && !posicionou; tentativa++) {
      x = (Math.random() - 0.5) * 200;
      z = zBase + (Math.random() - 0.5) * 400;
      y = getTerrainHeight(x, z);

      // não planta árvore submersa (abaixo do nível da água)
      if (y < NIVEL_AGUA + 0.5) continue;

      posicionou = true;
      for (let j = 0; j < trees.length; j++) {
        const dx = x - trees[j].position.x;
        const dz = z - trees[j].position.z;
        if (dx * dx + dz * dz < minDistance * minDistance) {
          posicionou = false;
          break;
        }
      }
    }
    if (!posicionou) continue; // desiste desta árvore

    // createTreeX já devolve um Group novo — não precisa de clone()
    const tree = Math.random() > 0.5 ? createTree1() : createTree2();
    tree.position.set(x, y - 0.5, z);

    const scale = 0.5 + Math.random() * 0.8;
    tree.scale.set(scale, scale, scale);

    chunk.add(tree);
    trees.push(tree);
  }

  return trees;
}

function buildInterface() {
  const gui = new GUI();
  gui
    .add(scene.fog, "far", 16, 600)
    .name("Fog Distance")
    .onChange((valor) => {
      // sem isto, o fog dos shaders do terreno/água ficava
      // dessincronizado do fog da cena ao mexer no slider
      setFogFar(valor);
      configurarCameraSombra();
    });
  const pastaHA = gui.addFolder("Health Packs");
  pastaHA.add(configHealthPack, "raioAtracao", 5, 60).name("Raio de atração");
  pastaHA.add(configHealthPack, "raioColeta", 1, 15).name("Raio de coleta");
  pastaHA.add(configHealthPack, "mostrarRaios").name("Mostrar raio (debug)");
}

function alternarInvencibilidade() {
  invencivel = !invencivel;
  setInvencivel(invencivel);
}

function aplicarDanoAviao() {
  if (invencivel) return; // modo invencível: não recebe dano nem conta tiro

  registrarTiroRecebido(1);
  energia -= DANO_POR_TIRO;
  setEnergia(energia);
  somAviaoAtingido();

  if (energia <= 0) fimDeJogo();
}

function fimDeJogo() {
  gameOver = true;
  isFlyOn = false;
  document.body.style.cursor = "default";
  loadingMessage.changeMessage("Fim de jogo");
  mostrarGameOver(() => location.reload());
}

function coletarHealthPack() {
  energia = Math.min(100, energia + CURA_HEALTH_PACK);
  registrarTiroRecebido(-4);
  setEnergia(energia);
  somHealthPack();
}

function registrarInimigoAbatido() {
  somInimigoAbatido();
  inimigosAbatidos++;
  // "a cada três aviões inimigos abatidos" surge um health pack
  if (inimigosAbatidos % 3 === 0) {
    const pos = new THREE.Vector3(
      (Math.random() - 0.5) * 60,
      12 + Math.random() * 10,
      aviao.position.z - 180,
    );
    createHealthPack(scene, pos, healthPacks);
  }
}

function keyboardUpdate() {
  keyboard.update();
  if (keyboard.down("esc") && !gameOver) {
    isFlyOn = !isFlyOn;
    if (isFlyOn) {
      loadingMessage.changeMessage("Velocidade " + vel);
      document.body.style.cursor = "none";
      scene.add(alvo);
    } else {
      loadingMessage.changeMessage("Pause");
      document.body.style.cursor = "default";
      scene.remove(alvo);
    }
  }
  if (keyboard.down("G")) alternarInvencibilidade();
  if (keyboard.down("S")) {
    const ligada = toggleMusica();
    loadingMessage.changeMessage(ligada ? "Música ligada" : "Música desligada");
  }
  if (keyboard.down("1")) {
    fator = -60;
    vel = 1;
    loadingMessage.changeMessage("Velocidade 1");
  }
  if (keyboard.down("2")) {
    fator = -120;
    vel = 2;
    loadingMessage.changeMessage("Velocidade 2");
  }
  if (keyboard.down("3")) {
    fator = -180;
    vel = 3;
    loadingMessage.changeMessage("Velocidade 3");
  }
}

function render() {
  const rawDelta = clock.getDelta(); // delta real em segundos
  atualizarAgua(clock.elapsedTime); // anima ondas e normal map da água
  const delta = rawDelta * fator;
  stats.update();
  keyboardUpdate();

  if (isFlyOn) {
    camera.position.z += delta;
    aviao.position.z += delta;
    alvo.position.z += delta;
    // no mobile, o joystick desloca o ponto de mira (posMouse) antes
    // do raycast — o restante do pipeline é idêntico ao do mouse
    atualizarMira(posMouse, rawDelta);
    intersecoesLERPeSLERP();

    // a luz acompanha o avião (o target já é o próprio avião)
    luz.position.set(aviao.position.x + 80, aviao.position.y + 100, aviao.position.z + 40);
  }

  // geração/descartes de chunks conforme o avião avança
  if (aviao.position.z < lastChunkZ + 350) {
    const newZ = lastChunkZ - 350;
    const newChunk = createChunk(newZ);
    scene.add(newChunk);
    chunks.push(newChunk);
    spawnEnemies(2);
    const oldChunk = chunks.shift();
    scene.remove(oldChunk);
    lastChunkZ = newZ;
  }

  if (isFlyOn) {
    //---------------- INIMIGOS ----------------
    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      if (!enemy) continue;

      // animação de morte: encolhe, gira e cai; depois é removido
      if (enemy.userData.dying) {
        enemy.userData.deathTime += rawDelta;
        const t = enemy.userData.deathTime / 0.5; // 0.5s de animação
        enemy.scale.setScalar(Math.max(0, 2 * (1 - t))); // escala base = 2
        enemy.rotation.z += rawDelta * 8;
        enemy.position.y -= rawDelta * 12;
        if (t >= 1) {
          scene.remove(enemy);
          enemies.splice(i, 1);
        }
        continue; // enquanto morre não se move nem atira
      }

      // remove os que já ficaram para trás do avião (frente = -Z)
      if (enemy.position.z > aviao.position.z + 30) {
        scene.remove(enemy);
        enemies.splice(i, 1);
        continue;
      }

      // movimento lateral: de uma lateral em direção à oposta
      enemy.position.x += enemy.userData.moveDir * enemy.userData.speed * rawDelta;

      // cadência baseada em tempo real (segundos); a direção até o
      // avião só é calculada quando o inimigo realmente atira
      enemy.userData.shootCooldown -= rawDelta;
      if (enemy.userData.shootCooldown <= 0) {
        _vTmp.subVectors(aviao.position, enemy.position).normalize();
        createBullet(scene, enemy.position, _vTmp, bullets, fator);
        enemy.userData.shootCooldown = enemy.userData.shootDelay;
      }
    }

    //---------------- TIROS INIMIGOS ----------------
    _boxAviao.setFromObject(aviao);

    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i];

      _prevPos.copy(bullet.position);
      bullet.position.addScaledVector(bullet.userData.velocity, rawDelta);
      bullet.userData.life -= rawDelta;

      // caixa que cobre o trajeto do tiro neste frame (contra "tunneling")
      _boxTiro
        .makeEmpty()
        .expandByPoint(_prevPos)
        .expandByPoint(bullet.position)
        .expandByScalar(0.3);

      if (_boxTiro.intersectsBox(_boxAviao)) {
        aplicarDanoAviao();
        scene.remove(bullet);
        bullets.splice(i, 1);
        continue;
      }

      if (bullet.userData.life <= 0) {
        scene.remove(bullet);
        bullets.splice(i, 1);
      }
    }

    //---------------- TIRO DO PLAYER ----------------
    // desktop: botão esquerdo pressionado; mobile: atira sempre que a
    // mira está sendo modificada pelo joystick (exigência do enunciado)
    if (isMouseDown || joystickEmUso()) {
      playerShootCooldown -= rawDelta;
      if (playerShootCooldown <= 0) {
        _vTmp.subVectors(alvo.position, aviao.position).normalize();
        const origin = aviao.position.clone().addScaledVector(_vTmp, 4);
        const shotSpeed = 200 + vel * 60;
        createPlayerShot(scene, origin, _vTmp, playerShots, shotSpeed);
        somTiroPlayer();
        playerShootCooldown = playerShootDelay;
      }
    }

    // move tiros do player, testa colisão (bounding box) e tempo de vida
    for (let i = playerShots.length - 1; i >= 0; i--) {
      const shot = playerShots[i];

      _prevPos.copy(shot.position);
      shot.position.addScaledVector(shot.userData.velocity, rawDelta);
      shot.userData.life -= rawDelta;

      _boxTiro
        .makeEmpty()
        .expandByPoint(_prevPos)
        .expandByPoint(shot.position)
        .expandByScalar(0.5);

      let hit = false;
      for (let j = enemies.length - 1; j >= 0; j--) {
        const enemy = enemies[j];
        if (!enemy || enemy.userData.dying) continue;
        _boxInimigo.setFromObject(enemy);
        if (_boxTiro.intersectsBox(_boxInimigo)) {
          enemy.userData.dying = true; // inicia a animação de morte
          enemy.userData.deathTime = 0;
          registrarInimigoAbatido();
          hit = true;
          break;
        }
      }

      if (hit || shot.userData.life <= 0) {
        scene.remove(shot);
        playerShots.splice(i, 1);
      }
    }

    //---------------- HEALTH PACKS ----------------
    atualizarHealthPacks(scene, healthPacks, aviao, rawDelta, coletarHealthPack);
  }

  requestAnimationFrame(render);
  renderer.render(scene, camera);
}
