import * as THREE from "three";
import {GLTFLoader} from '../build/jsm/loaders/GLTFLoader.js';

export function createEnemy(scene, position) {
  const loader = new GLTFLoader();

  loader.load(
    './assets/duck.glb',
    function (gltf) {
      let obj = gltf.scene;
      obj.scale.set(2, 2, 2); 
      obj.position.copy(position);
      obj.userData.isEnemy = true;
      obj.userData.speed = 5;
      obj.userData.shootCooldown = 3;
      obj.userData.shootDelay = 2;
      scene.add(obj);
      enemies.push(obj);
    }
  );
}

function createBullet(scene, position, direction) {
  const geometry = new THREE.SphereGeometry(0.2);
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });

  const bullet = new THREE.Mesh(geometry, material);

  bullet.position.copy(position);

  bullet.userData = {
    velocity: direction.clone().multiplyScalar(30)
  };

  scene.add(bullet);
  bullets.push(bullet);
}
