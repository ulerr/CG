import * as THREE from "three";

//=====================================================================
// GERENCIADOR DE ASSETS + PÁGINA DE CARREGAMENTO
//
// Todos os loaders do projeto (texturas do terreno, normal map da
// água e o drone GLB) recebem este mesmo LoadingManager. Assim o
// onProgress reflete o carregamento de fato, e não uma barra falsa.
//=====================================================================

export const loadingManager = new THREE.LoadingManager();

let aoIniciarCallback = null;
let carregouTudo = false;

// Construção do overlay (DOM)
const overlay = document.createElement("div");
overlay.style.cssText = `
  position: fixed; inset: 0; z-index: 10000;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 24px; font-family: monospace; color: #fff;
  /* Troque por uma imagem temática se quiser:
     background: url('./assets/textures/loading.jpg') center/cover; */
  background: linear-gradient(180deg, #24435f 0%, #6d93b0 55%, #2e4a33 56%, #16281a 100%);
`;

const titulo = document.createElement("h1");
titulo.textContent = "RAIL SHOOTER";
titulo.style.cssText = "font-size:56px; letter-spacing:8px; text-shadow:0 4px 12px rgba(0,0,0,.6); margin:0;";

const barraFundo = document.createElement("div");
barraFundo.style.cssText = "width:420px; max-width:80vw; height:22px; border:2px solid #fff; border-radius:11px; overflow:hidden; background:rgba(0,0,0,.35);";

const barraPreenchimento = document.createElement("div");
barraPreenchimento.style.cssText = "width:0%; height:100%; background:linear-gradient(90deg,#7fd27f,#2f8f2f); transition:width .15s;";
barraFundo.appendChild(barraPreenchimento);

const textoProgresso = document.createElement("div");
textoProgresso.textContent = "Carregando assets... 0%";
textoProgresso.style.cssText = "font-size:16px; opacity:.9;";

const botaoStart = document.createElement("button");
botaoStart.textContent = "START";
botaoStart.disabled = true;
botaoStart.style.cssText = `
  font-family:monospace; font-size:24px; letter-spacing:4px; padding:12px 48px;
  border-radius:8px; border:2px solid #fff; cursor:not-allowed;
  background:rgba(255,255,255,.15); color:rgba(255,255,255,.4);
`;

overlay.append(titulo, barraFundo, textoProgresso, botaoStart);
document.body.appendChild(overlay);

// Progresso do carregamento
loadingManager.onProgress = (url, carregados, total) => {
  const pct = Math.round((carregados / total) * 100);
  barraPreenchimento.style.width = pct + "%";
  textoProgresso.textContent = `Carregando assets... ${pct}% (${carregados}/${total})`;
};

loadingManager.onError = (url) => {
  console.error("Falha ao carregar asset:", url);
  textoProgresso.textContent = "Erro ao carregar: " + url;
};

loadingManager.onLoad = () => {
  if (carregouTudo) return;
  carregouTudo = true;
  barraPreenchimento.style.width = "100%";
  textoProgresso.textContent = "Todos os assets carregados!";
  botaoStart.disabled = false;
  botaoStart.style.cursor = "pointer";
  botaoStart.style.background = "rgba(47,143,47,.85)";
  botaoStart.style.color = "#fff";
};

botaoStart.addEventListener("click", () => {
  if (botaoStart.disabled) return;
  overlay.remove();
  if (aoIniciarCallback) aoIniciarCallback();
});

// main.js registra aqui o que deve acontecer quando o jogador
// pressionar START (iniciar o loop de render e a música).
export function aoIniciar(callback) {
  aoIniciarCallback = callback;
}
