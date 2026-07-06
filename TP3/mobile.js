import { toggleMusica } from "./sons.js";

//=====================================================================
// CONTROLES MOBILE
//
//  - Joystick virtual controlando a mira, como o mouse faz no desktop.
//    Posição FIXA no canto inferior esquerdo (evita sobrepor a caixa
//    de mensagens)
//  - Dois botões na parte superior da tela: ligar/desligar fullscreen
//    e ligar/desligar a música
//  - O avião atira automaticamente sempre que a mira é modificada
//
//=====================================================================

let ativo = false;
let jx = 0; // movimento horizontal normalizado [-1, 1] (negativo = esquerda)
let jy = 0; // movimento vertical normalizado [-1, 1] (positivo = baixo)
const VEL_MIRA = 1.6;

export function dispositivoTouch() {
  return (
    window.matchMedia("(pointer: coarse)").matches ||
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0
  );
}

export function initControlesMobile() {
  if (!dispositivoTouch() || ativo) return false;
  criarBotoesSuperiores();
  criarJoystick();
  ativo = true;
  return true;
}

// threshold para movimentos
export function joystickEmUso() {
  return ativo && jx * jx + jy * jy > 0.003;
}

export function atualizarMira(posMouse, dt) {
  if (!joystickEmUso()) return;
  posMouse.x = Math.max(-1, Math.min(1, posMouse.x + jx * VEL_MIRA * dt));
  posMouse.y = Math.max(-1, Math.min(1, posMouse.y - jy * VEL_MIRA * dt));
}

function criarBotoesSuperiores() {
  const barra = document.createElement("div");
  barra.style.cssText = `
    position: fixed; top: 12px; left: 12px; z-index: 1000;
    display: flex; gap: 10px;
  `;

  const estiloBotao = `
    width: 48px; height: 48px; border-radius: 10px;
    border: 2px solid #fff; background: rgba(0,0,0,.5); color: #fff;
    font-size: 22px; font-family: monospace;
    display: flex; align-items: center; justify-content: center;
    touch-action: none; user-select: none; -webkit-user-select: none;
  `;

  // --- Fullscreen ---
  const btnFull = document.createElement("button");
  btnFull.textContent = "⛶";
  btnFull.style.cssText = estiloBotao;

  
  btnFull.addEventListener("pointerdown", (e) => e.stopPropagation());
  btnFull.addEventListener("mousedown", (e) => e.stopPropagation());
  btnFull.addEventListener("click", (e) => {
    e.stopPropagation();
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (document.documentElement.requestFullscreen) {
      // iOS/Safari em iPhone não suporta a Fullscreen API
      document.documentElement.requestFullscreen().catch(() => {});
    }
  });
  document.addEventListener("fullscreenchange", () => {
    btnFull.style.background = document.fullscreenElement
      ? "rgba(47,143,47,.7)"
      : "rgba(0,0,0,.5)";
  });

  // --- Música ---
  const btnMusica = document.createElement("button");
  btnMusica.textContent = "♪";
  btnMusica.style.cssText = estiloBotao;
  btnMusica.addEventListener("pointerdown", (e) => e.stopPropagation());
  btnMusica.addEventListener("mousedown", (e) => e.stopPropagation());
  btnMusica.addEventListener("click", (e) => {
    e.stopPropagation();
    const ligada = toggleMusica();
    btnMusica.style.opacity = ligada ? "1" : "0.4";
    btnMusica.style.textDecoration = ligada ? "none" : "line-through";
  });

  barra.append(btnFull, btnMusica);
  document.body.appendChild(barra);
}

// Joystick virtual
function criarJoystick() {
  const TAM_BASE = 130;
  const TAM_KNOB = 56;
  const raioMax = (TAM_BASE - TAM_KNOB) / 2;

  const base = document.createElement("div");
  base.style.cssText = `
    position: fixed; left: 20px; bottom: 95px; z-index: 1000;
    width: ${TAM_BASE}px; height: ${TAM_BASE}px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,.7); background: rgba(0,0,0,.28);
    touch-action: none; user-select: none; -webkit-user-select: none;
  `;

  const knob = document.createElement("div");
  knob.style.cssText = `
    position: absolute; left: 50%; top: 50%;
    width: ${TAM_KNOB}px; height: ${TAM_KNOB}px; border-radius: 50%;
    background: rgba(255,255,255,.85); box-shadow: 0 2px 8px rgba(0,0,0,.5);
    transform: translate(-50%, -50%);
    pointer-events: none;
  `;
  base.appendChild(knob);
  document.body.appendChild(base);

  let pointerId = null;

  function atualizarDeflexao(e) {
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > raioMax) {
      dx = (dx / dist) * raioMax;
      dy = (dy / dist) * raioMax;
    }
    jx = dx / raioMax;
    jy = dy / raioMax;
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  }

  function soltar() {
    pointerId = null;
    jx = 0;
    jy = 0;
    knob.style.transform = "translate(-50%, -50%)";
  }

  // mousedown cobre notebook com tela de toque
  base.addEventListener("mousedown", (e) => e.stopPropagation());
  base.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    pointerId = e.pointerId;
    base.setPointerCapture(pointerId);
    atualizarDeflexao(e);
  });
  base.addEventListener("pointermove", (e) => {
    if (e.pointerId !== pointerId) return;
    atualizarDeflexao(e);
  });
  base.addEventListener("pointerup", (e) => {
    if (e.pointerId === pointerId) soltar();
  });
  base.addEventListener("pointercancel", soltar);
}