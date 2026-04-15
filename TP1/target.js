import * as THREE from "three";

export function createTarget() {
  const target = new THREE.Object3D();
  const material = new THREE.MeshStandardMaterial({ color: "orangered" });
  const geometry = new THREE.BoxGeometry( 0.5, 2, 0.1 );

  for (let x = 0; x < 2; x++) {
    for (let y = 0; y < 2; y++) {
			  let line1 = new THREE.Mesh(geometry, material);
  			line1.position.x = -5 +10*x;
				line1.position.y = -5 +10*y;
				line1.position.z = 0;
  			target.add(line1);

				let line2 = new THREE.Mesh(geometry, material);
				line2.position.x = -5 +10*x;
				line2.position.y = -5 +10*y;
				line2.position.z = 0;
				if(x == 0 || y == 0) line2.rotation.z = -1*Math.PI / 2;
				else line2.rotation.z = Math.PI / 2;
				line2.translateX(0.75);
				line2.translateY(1);
				target.add(line2);
		}
  }
  return target;
}