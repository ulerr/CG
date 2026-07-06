import * as THREE from "three";
import { GLTFLoader } from "../build/jsm/loaders/GLTFLoader.js";
import { loadingManager } from "./gerenciadorAssets.js";

//=====================================================================
// INIMIGOS
//
// o modelo é carregado uma única vez no LoadingManager, 
// contando na tela de carregamento e cada inimigo é
// apenas um clone() do modelo em memória, o que é praticamente
// instantâneo e elimina os engasgos ao gerar novos chunks.
//=====================================================================

let modeloDrone = null;

const loader = new GLTFLoader(loadingManager);
loader.load("./assets/drone.glb", (gltf) => {
  modeloDrone = gltf.scene;
});

export function createEnemy(scene, position, enemies, dirX = 1) {
  // o guard é apenas segurança
  if (!modeloDrone) return;

  const obj = modeloDrone.clone(true);
  obj.scale.set(2, 2, 2);
  obj.position.copy(position);
  obj.userData.isEnemy = true;
  obj.userData.speed = 12;      // velocidade lateral (atravessar a tela)
  obj.userData.moveDir = dirX;  // +1 vai pra direita, -1 pra esquerda
  obj.userData.shootCooldown = 1;
  obj.userData.shootDelay = 1;  // segundos entre tiros
  scene.add(obj);
  enemies.push(obj);
}

// geometria/material compartilhados por todos os tiros inimigos
const geoBala = new THREE.ConeGeometry(0.1, 0.5, 8);
const matBala = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const EIXO_Y = new THREE.Vector3(0, 1, 0);

export function createBullet(scene, position, direction, bullets, worldVelocityZ = 0) {
  const bullet = new THREE.Mesh(geoBala, matBala);
  bullet.position.copy(position);

  bullet.userData = {
    velocity: direction
      .clone()
      .multiplyScalar(30)
      .add(new THREE.Vector3(0, 0, worldVelocityZ)),
    life: 4,
  };

  bullet.quaternion.setFromUnitVectors(EIXO_Y, direction.normalize());

  scene.add(bullet);
  bullets.push(bullet);
}
