//=====================================================================
// INTERFACE (HUD)
//
//  - Barra de vida em no topo
//  - Indicação do modo de invencibilidade com tecla G
//  - Janela de fim de jogo com opção de reiniciar (após 20 tiros).
//=====================================================================

let barraFill = null;
let barraBorda = null;
let badgeInvencivel = null;
let textoTiros = null;
let tirosRecebidos = 0;

export function initInterface() {
  const hud = document.createElement("div");
  hud.style.cssText = `
    position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
    display: flex; flex-direction: column; align-items: center; gap: 4px;
    font-family: monospace; color: white; z-index: 999; pointer-events: none;
  `;

  barraBorda = document.createElement("div");
  barraBorda.style.cssText = `
    width: min(320px, 55vw); height: 20px; border: 2px solid #fff; border-radius: 10px;
    overflow: hidden; background: rgba(0,0,0,.45); box-shadow: 0 2px 6px rgba(0,0,0,.4);
  `;

  barraFill = document.createElement("div");
  barraFill.style.cssText = `
    width: 100%; height: 100%; transition: width .2s, background .2s;
    background: linear-gradient(90deg, #7fd27f, #2f8f2f);
  `;
  barraBorda.appendChild(barraFill);

  textoTiros = document.createElement("div");
  textoTiros.textContent = "Tiros recebidos: 0 / 20";
  textoTiros.style.cssText = "font-size:13px; background:rgba(0,0,0,.4); padding:2px 10px; border-radius:6px;";

  badgeInvencivel = document.createElement("div");
  badgeInvencivel.textContent = "★ INVENCÍVEL (G) ★";
  badgeInvencivel.style.cssText = `
    display: none; font-size: 14px; font-weight: bold; color: #ffd700;
    background: rgba(0,0,0,.55); padding: 3px 14px; border-radius: 6px;
    border: 1px solid #ffd700; text-shadow: 0 0 6px #ffd700;
  `;

  hud.append(barraBorda, textoTiros, badgeInvencivel);
  document.body.appendChild(hud);
}

// energia em % (0 a 100); cor muda de verde -> amarelo -> vermelho
export function setEnergia(pct) {
  const p = Math.max(0, Math.min(100, pct));
  barraFill.style.width = p + "%";
  if (p > 50) barraFill.style.background = "linear-gradient(90deg,#7fd27f,#2f8f2f)";
  else if (p > 25) barraFill.style.background = "linear-gradient(90deg,#ffe27f,#cfa72f)";
  else barraFill.style.background = "linear-gradient(90deg,#ff7f7f,#b02f2f)";
}

export function registrarTiroRecebido() {
  tirosRecebidos++;
  textoTiros.textContent = `Tiros recebidos: ${tirosRecebidos} / 20`;
}

export function setInvencivel(ligado) {
  badgeInvencivel.style.display = ligado ? "block" : "none";
  barraBorda.style.borderColor = ligado ? "#ffd700" : "#fff";
  barraBorda.style.boxShadow = ligado
    ? "0 0 12px #ffd700"
    : "0 2px 6px rgba(0,0,0,.4)";
}

// Janela de término do jogo com botão de reiniciar
export function mostrarGameOver(aoReiniciar) {
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 10000;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 20px; background: rgba(0,0,0,.75); font-family: monospace; color: white;
  `;

  const titulo = document.createElement("h1");
  titulo.textContent = "FIM DE JOGO";
  titulo.style.cssText = "font-size:48px; letter-spacing:6px; color:#ff6b6b; margin:0;";

  const sub = document.createElement("p");
  sub.textContent = "Seu avião recebeu 20 tiros.";
  sub.style.cssText = "font-size:18px; margin:0;";

  const botao = document.createElement("button");
  botao.textContent = "REINICIAR";
  botao.style.cssText = `
    font-family:monospace; font-size:20px; letter-spacing:3px; padding:10px 40px;
    border-radius:8px; border:2px solid #fff; background:rgba(255,255,255,.12);
    color:#fff; cursor:pointer;
  `;
  botao.addEventListener("click", aoReiniciar);

  overlay.append(titulo, sub, botao);
  document.body.appendChild(overlay);
}