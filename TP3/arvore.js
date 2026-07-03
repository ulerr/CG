import * as THREE from 'three';

let trunkGeometry = new THREE.CylinderGeometry(0.5, 0.5, 3, 32);
let trunkMaterial = new THREE.MeshPhongMaterial({ color: "sienna" });
let foliageMaterial = new THREE.MeshPhongMaterial({ color: "forestgreen" });
let foliageGeometry1 = new THREE.ConeGeometry(2, 4, 32);
let foliageGeometry2 = new THREE.ConeGeometry(1.5, 3, 32);
let foliageGeometry3 = new THREE.ConeGeometry(1, 2, 32);
let foliageGeometry4 = new THREE.SphereGeometry(2, 6, 6);  
   
export function createTree1() {
   let tree = new THREE.Group();

   let trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
   trunk.position.y = 1.5; 
   tree.add(trunk);

   let foliage = new THREE.Mesh(foliageGeometry1, foliageMaterial);
   foliage.position.y = 4; 
   tree.add(foliage);
   
   let foliage2 = new THREE.Mesh(foliageGeometry2, foliageMaterial);
   foliage2.position.y = 5.5; 
   tree.add(foliage2);

   let foliage3 = new THREE.Mesh(foliageGeometry3, foliageMaterial);
   foliage3.position.y = 6.5; 
   tree.add(foliage3);

   trunk.castShadow = true;
   trunk.receiveShadow = true;
   foliage.castShadow = true;
   foliage.receiveShadow = true;
   foliage2.castShadow = true;
   foliage2.receiveShadow = true;
   foliage3.castShadow = true;
   foliage3.receiveShadow = true;
   return tree;
}


export function createTree2(){
   let tree = new THREE.Group();

   let trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
   trunk.position.y = 1.5; 
   tree.add(trunk);

   let foliage = new THREE.Mesh(foliageGeometry4, foliageMaterial);
   foliage.position.y = 4;
   tree.add(foliage);

   trunk.castShadow = true;
   trunk.receiveShadow = true;
   foliage.castShadow = true;
   foliage.receiveShadow = true;
   
   return tree;
}