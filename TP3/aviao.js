import * as THREE from "three";

//=====================================================================
// AVIÃO TEXTURIZADO
//
// São aplicadas 3 texturas distintas:
//   1. Metal com painéis, rebites e parafusos  -> fuselagem, nariz e cauda
//   2. Asa com faixa e cocar (roundel) -> asas e estabilizadores
//   3. Vidro de cabine com "reflexo"  -> cockpit
//
// As texturas são geradas em CanvasTexture (procedurais), o que evita
// depender de arquivos externos
//=====================================================================

// Textura 1: metal da fuselagem
function criarTexturaMetal() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d");

  // base metálica com leve gradiente
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, "#cfd8e0");
  grad.addColorStop(0.5, "#aab6c2");
  grad.addColorStop(1, "#8d9aa8");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // linhas de painel verticais
  ctx.strokeStyle = "rgba(60,70,80,0.55)";
  ctx.lineWidth = 2;
  for (let x = 0; x <= 256; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }

  // fileiras de rebites
  ctx.fillStyle = "rgba(50,60,70,0.6)";
  for (let x = 8; x < 256; x += 16) {
    for (let y = 12; y < 256; y += 42) {
      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1);
  return tex;
}

// Textura 2: asa com faixa e cocar
function criarTexturaAsa() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d");

  // base azul-marinho
  ctx.fillStyle = "#1b3a6b";
  ctx.fillRect(0, 0, 256, 256);

  // faixa branca diagonal
  ctx.fillStyle = "#e8e8e8";
  ctx.save();
  ctx.translate(128, 128);
  ctx.rotate(-Math.PI / 10);
  ctx.fillRect(-160, -22, 320, 44);
  ctx.restore();

  // cocar
  const circulo = (r, cor) => {
    ctx.fillStyle = cor;
    ctx.beginPath();
    ctx.arc(190, 66, r, 0, Math.PI * 2);
    ctx.fill();
  };
  circulo(30, "#e8e8e8");
  circulo(20, "#c62828");
  circulo(10, "#e8e8e8");

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Textura 3: vidro da cabine
function criarTexturaVidro() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d");

  // vidro azulado escuro com gradiente
  ctx.fillStyle = "#0e2233";
  ctx.fillRect(0, 0, 128, 128);
  const g2 = ctx.createLinearGradient(0, 0, 0, 128);
  g2.addColorStop(0, "rgba(140,190,230,0.9)");
  g2.addColorStop(0.5, "rgba(30,70,100,0.4)");
  g2.addColorStop(1, "rgba(5,15,25,0.9)");
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, 128, 128);

  // reflexo diagonal
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(20, 118);
  ctx.lineTo(110, 24);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(42, 122);
  ctx.lineTo(122, 40);
  ctx.stroke();

  // molduras da cabine
  ctx.strokeStyle = "rgba(10,15,20,0.9)";
  ctx.lineWidth = 5;
  ctx.strokeRect(2, 2, 124, 124);
  ctx.beginPath();
  ctx.moveTo(64, 0);
  ctx.lineTo(64, 128);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createAirplane() {
  const airplane = new THREE.Group();

  const matMetal = new THREE.MeshPhongMaterial({
    map: criarTexturaMetal(),
    shininess: 60,
  });
  const matAsa = new THREE.MeshPhongMaterial({ map: criarTexturaAsa() });
  const matVidro = new THREE.MeshPhongMaterial({
    map: criarTexturaVidro(),
    shininess: 120,
    specular: 0x99bbdd,
  });

  // 1. Fuselagem
  const fuselage = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 6, 32),
    matMetal,
  );
  fuselage.rotation.z = Math.PI / 2;
  airplane.add(fuselage);

  // 2. Nariz/coifa
  const nose = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 0.5, 16),
    matMetal,
  );
  nose.position.x = 3.25;
  nose.rotation.z = Math.PI / 2;
  airplane.add(nose);

  // 3. Cauda
  const tailCone = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1, 32), matMetal);
  tailCone.position.x = -3.5;
  tailCone.rotation.z = Math.PI / 2;
  airplane.add(tailCone);

  // 4. Asa esquerda
  const wingLeft = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 2), matAsa);
  wingLeft.position.set(0, 0, -1);
  airplane.add(wingLeft);

  // 5. Asa direita
  const wingRight = wingLeft.clone();
  wingRight.position.z = 1;
  airplane.add(wingRight);

  // 6. Estabilizador horizontal
  const tailWing = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 1), matAsa);
  tailWing.position.set(-4, 0, 0);
  tailWing.rotation.y = Math.PI / 2;
  airplane.add(tailWing);

  // 7. Estabilizador vertical
  const verticalTail = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1, 1), matAsa);
  verticalTail.position.set(-4, 0.5, 0);
  verticalTail.rotation.y = Math.PI / 2;
  airplane.add(verticalTail);

  // 8. Cabine
  const cockpit = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 32, 16),
    matVidro,
  );
  cockpit.position.set(1.5, 0.5, 0);
  airplane.add(cockpit);

  return airplane;
}