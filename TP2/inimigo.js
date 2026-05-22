import * as THREE from "three";
import {GLTFLoader} from '../build/jsm/loaders/GLTFLoader.js';

export function createEnemy(scene, position) {
  const loader = new GLTFLoader();

  console.log("createEnemy chamado, posição:", position); // <-- log 1

  loader.load(
    './assets/duck.glb',
    function (gltf) {
      console.log("GLB carregado com sucesso!"); // <-- log 2
      let obj = gltf.scene;
      obj.scale.set(2, 2, 2); // duck.glb costuma ser ENORME, tente 0.005
      obj.position.copy(position);
      obj.userData.isEnemy = true;
      scene.add(obj);
      console.log("Inimigo adicionado à cena em:", obj.position); // <-- log 3
    },
    undefined,
    function (error) {
      console.error("ERRO ao carregar GLB:", error); // <-- log 4
    }
  );
}
