import * as THREE from "three";

export function createAirplane() {
  const airplane = new THREE.Group();

  const material1 = new THREE.MeshPhongMaterial({ color: "navy" });
  const material2 = new THREE.MeshPhongMaterial({ color: "white" });
  const material3 = new THREE.MeshPhongMaterial({ color: "black" });

  // 1. Fuselagem (corpo)
  const fuselage = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 6, 32),
    material1,
  );
  fuselage.rotation.z = Math.PI / 2;
  airplane.add(fuselage);

  // 2. Nariz
  const nose = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 0.5, 32),
    material2,
  );
  nose.position.x = 3.25;
  nose.rotation.z = Math.PI / 2;
  airplane.add(nose);

  // 3. Cauda (traseira)
  const tailCone = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1, 32), material1);
  tailCone.position.x = -3.5;
  tailCone.rotation.z = Math.PI / 2;
  airplane.add(tailCone);

  // 4. Asa esquerda
  const wingLeft = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 2), material2);
  wingLeft.position.set(0, 0, -1);
  airplane.add(wingLeft);

  // 5. Asa direita
  const wingRight = wingLeft.clone();
  wingRight.position.z = 1;
  airplane.add(wingRight);

  // 6. Estabilizador horizontal
  const tailWing = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 1), material2);
  tailWing.position.set(-4, 0, 0);
  tailWing.rotation.y = Math.PI / 2;
  airplane.add(tailWing);

  // 7. Estabilizador vertical
  const verticalTail = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 1, 1),
    material2,
  );
  verticalTail.position.set(-4, 0.5, 0);
  verticalTail.rotation.y = Math.PI / 2;
  airplane.add(verticalTail);

  // 8. Cabine
  const cockpit = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 32, 16),
    material3
  );
  cockpit.position.set(1.5, 0.5, 0);
  airplane.add(cockpit);
  // airplane.rotation.y = Math.PI / 2;
  return airplane;
}
