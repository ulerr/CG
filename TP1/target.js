import * as THREE from "three";

export function createTarget() {
  const target = new THREE.Object3D();
  const material = new THREE.MeshStandardMaterial({ color: "orangered" });
  const geometry = new THREE.BoxGeometry( 0.25, 1, 0.1 );

  for (let x = 0; x < 2; x++) {
    for (let y = 0; y < 2; y++) {
			  let line1 = new THREE.Mesh(geometry, material);
  				line1.position.x = -5 + 2*x;
					line1.position.y =  5 + 2*y;
					line1.position.z = 25;
  			target.add(line1);

				let line2 = new THREE.Mesh(geometry, material);
					line2.position.x = -5 + 2*x;
					line2.position.y =  5 + 2*y;
					line2.position.z = 25;
					line2.rotation.z = Math.PI / 2;

				if (x == 1) {
					line2.translateX(0.75);
					line2.translateY(0.25);
				}
				else {
					line2.translateX(-0.75);
					line2.translateY(-0.25);
				}
				
				target.add(line2);
		}
  }
  return target;
}