import * as THREE from 'three';
import GUI from '../libs/util/dat.gui.module.js'

export function createTree() {
   let tree = new THREE.Group();

   let trunkGeometry = new THREE.CylinderGeometry(0.5, 0.5, 3, 32);
   let trunkMaterial = new THREE.MeshStandardMaterial({ color: "sienna" });
   let trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
   trunk.position.y = 1.5; 
   tree.add(trunk);

   let foliageGeometry1 = new THREE.ConeGeometry(2, 4, 32);
   let foliageMaterial1 = new THREE.MeshStandardMaterial({ color: "forestgreen" });
   let foliage = new THREE.Mesh(foliageGeometry1, foliageMaterial1);
   foliage.position.y = 4; 
   tree.add(foliage);
   
   let foliageGeometry2 = new THREE.ConeGeometry(1.5, 3, 32);
   let foliageMaterial2 = new THREE.MeshStandardMaterial({ color: "forestgreen" });
   let foliage2 = new THREE.Mesh(foliageGeometry2, foliageMaterial2);
   foliage2.position.y = 5.5; 
   tree.add(foliage2);

   let foliageGeometry3 = new THREE.ConeGeometry(1, 2, 32);
   let foliageMaterial3 = new THREE.MeshStandardMaterial({ color: "forestgreen" });
   let foliage3 = new THREE.Mesh(foliageGeometry3, foliageMaterial3);
   foliage3.position.y = 6.5; 
   tree.add(foliage3);
   return tree;
}