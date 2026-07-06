import * as THREE from "three";

//=====================================================================
// HEALTH PACKS (HA)
//
//  - Aparecem a cada 3 inimigos abatidos
//  - Recuperam 25% da energia/vida
//  - Efeito atrato visível: dentro de um raio o health packs
//    translada em direção ao avião
//  - Caixa de primeiros socorros com cruz vermelha (pode ser problema
//    devido às convenções de Genebra) com textura gerada por canvas
//  - Raio de coleta configurável e exibível
//=====================================================================

export const configHealthPack = {
  raioAtracao: 22,
  raioColeta: 4,
  forcaAtracao: 3,
  mostrarRaios: false,
};

// --- Textura da cruz vermelha
function criarTexturaMedkit() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d");

  // caixa branca com borda vermelha
  ctx.fillStyle = "#f4f4f4";
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = "#c62828";
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, 118, 118);

  // cruz vermelha central
  ctx.fillStyle = "#c62828";
  ctx.fillRect(52, 24, 24, 80);
  ctx.fillRect(24, 52, 80, 24);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Geometria/material compartilhados por todos os packs
// reuso evita problemas de memoria (negligivel neste caso)
const geoPack = new THREE.BoxGeometry(2.2, 2.2, 2.2);
const matPack = new THREE.MeshPhongMaterial({
  map: criarTexturaMedkit(),
  emissive: 0x330000,
});

const geoAnel = new THREE.RingGeometry(0.95, 1.0, 48);
const matAnel = new THREE.MeshBasicMaterial({
  color: 0x00ff88,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.6,
});

export function createHealthPack(scene, position, packs) {
  const pack = new THREE.Mesh(geoPack, matPack);
  pack.position.copy(position);
  pack.castShadow = true;
  pack.userData.baseY = position.y;
  pack.userData.tempoVida = 0;

  // anel horizontal indicando o raio de coleta para debug
  const anel = new THREE.Mesh(geoAnel, matAnel);
  anel.rotation.x = -Math.PI / 2;
  anel.visible = false;
  pack.add(anel);
  pack.userData.anel = anel;

  scene.add(pack);
  packs.push(pack);
  return pack;
}

export function atualizarHealthPacks(scene, packs, aviao, dt, aoColetar) {
  for (let i = packs.length - 1; i >= 0; i--) {
    const pack = packs[i];
    pack.userData.tempoVida += dt;

    // animação idle
    pack.rotation.y += dt * 1.5;
    pack.position.y =
      pack.userData.baseY + Math.sin(pack.userData.tempoVida * 2.5) * 0.6;

    // anel de debug
    const anel = pack.userData.anel;
    anel.visible = configHealthPack.mostrarRaios;
    if (anel.visible) {
      const r = configHealthPack.raioColeta;
      anel.scale.set(r, r, r);
    }

    const dist = pack.position.distanceTo(aviao.position);

    if (dist <= configHealthPack.raioColeta) {
      // coletar
      scene.remove(pack);
      packs.splice(i, 1);
      aoColetar();
      continue;
    }

    if (dist <= configHealthPack.raioAtracao) {
      // efeito atrator com translação acelerada
      const t = 1 - dist / configHealthPack.raioAtracao; // 0..1
      const alpha = Math.min(1, (0.5 + t * 2) * configHealthPack.forcaAtracao * dt);
      pack.position.lerp(aviao.position, alpha);
      pack.userData.baseY = pack.position.y; // evita conlito com o flutuar do idle
    }

    // ficou para trás do avião sem ser coletado: remove
    if (pack.position.z > aviao.position.z + 30) {
      scene.remove(pack);
      packs.splice(i, 1);
    }
  }
}
