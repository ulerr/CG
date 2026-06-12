import * as THREE from "three";
import { GLTFLoader } from '../build/jsm/loaders/GLTFLoader.js';

export function createEnemy(scene, position, enemies, dirX = 1) {
  const loader = new GLTFLoader();

  loader.load(
    './assets/drone.glb',
    function (gltf) {
      let obj = gltf.scene;
      obj.scale.set(6, 6, 6);
      obj.position.copy(position);
      obj.userData.isEnemy = true;
      obj.userData.speed = 12;      // velocidade lateral (atravessar a tela)
      obj.userData.moveDir = dirX;  // +1 vai p/ direita, -1 p/ esquerda
      obj.userData.shootCooldown = 1;
      obj.userData.shootDelay = 1;  // segundos entre tiros
      scene.add(obj);
      enemies.push(obj);
    }
  );
}

export function createBullet(scene, position, direction, bullets, worldVelocityZ = 0) {
  const geometry = new THREE.ConeGeometry(0.1, 0.5, 8);
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });

  const bullet = new THREE.Mesh(geometry, material);

  bullet.position.copy(position);

 bullet.userData = {
    velocity: direction.clone().multiplyScalar(30).add(new THREE.Vector3(0, 0, worldVelocityZ)),
    life: 4
  };

  bullet.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0), // cone aponta em Y por padrão
    direction.normalize()
  );

  scene.add(bullet);
  bullets.push(bullet);
}