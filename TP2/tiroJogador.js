import * as THREE from "three";

// Tiro do player: retângulo alongado na direção do disparo, com cor sólida.
// Versão simplificada do enunciado (em T3 vira billboard, sempre virado ao player).
export function createPlayerShot(scene, origin, direction, shots, speed = 260) {
  const geometry = new THREE.BoxGeometry(0.2, 0.2, 4); // alongado no eixo Z local
  const material = new THREE.MeshBasicMaterial({ color: 0x33ddff });
  const shot = new THREE.Mesh(geometry, material);

  const dir = direction.clone().normalize();
  shot.position.copy(origin);
  // alinha o comprimento (Z local) do retângulo com a direção do tiro
  shot.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);

  shot.userData = {
    velocity: dir.multiplyScalar(speed),
    life: 2, // segundos até sumir (some sozinho ao sair da área visível)
  };

  scene.add(shot);
  shots.push(shot);
}
