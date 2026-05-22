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
      scene.add(obj);
    }
  );
}
