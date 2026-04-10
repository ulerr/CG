import * as THREE from 'three';

export function createAirplane(){
    let airplane = new THREE.Group();
    const pi = Math.PI;
    let CylinderGeometry = new THREE.CylinderGeometry(0.5, 0.5, 3, 32);
    let cylinderMaterial = new THREE.MeshBasicMaterial({color: 'Black'});
    let cylinder = new THREE.Mesh(CylinderGeometry, cylinderMaterial);
    cylinder.rotateX(pi/2);
    airplane.add(cylinder);

    let ConeGeometry = new THREE.ConeGeometry(0.5, 0.1, 64, 1);
    let coneMaterial = new THREE.MeshBasicMaterial({color: 'red'});
    let cone = new THREE.Mesh(ConeGeometry, coneMaterial);
    airplane.add(cone);
    cone.rotateX(pi/2);
    cone.translateY(1.55);

    let CubeGeometry = new THREE.BoxGeometry(0.15, 0.04);
    let cubeMaterial = new THREE.MeshBasicMaterial({color : "white"});
    let helice = new THREE.Mesh(CubeGeometry, cubeMaterial);
    helice.translateY(0.01);
    cone.add(helice);
    return airplane;
}