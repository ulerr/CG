import * as THREE from "three";

//=====================================================================
// SONS
//
//  - Música em loop iniciando com o jogo e com a tecla 'S'
//    para ligar/desligar.
//  - Efeitos sonoros: tiro do player, captura de health pack,
//    avião atingido e inimigo abatido.
//
//=====================================================================

const listener = new THREE.AudioListener();
const audioLoader = new THREE.AudioLoader();

let musica = null;
let musicaLigada = true;
let musicaCarregada = false;
let jogoIniciado = false;

const buffers = { tiro: null, healthpack: null, atingido: null, abatido: null };

export function initSons(camera) {
  listener.name = "audioListener";
  camera.add(listener);

  // Música de fundo
  audioLoader.load(
    "./assets/sounds/ambiente.mp3",
    (buffer) => {
      musica = new THREE.Audio(listener);
      musica.setBuffer(buffer);
      musica.setLoop(true);
      musica.setVolume(0.35);
      musicaCarregada = true;
      // se o jogador já apertou START antes do áudio terminar de
      // carregar, começa a tocar agora
      if (jogoIniciado && musicaLigada) musica.play();
    },
    undefined,
    () => console.warn("ambiente.mp3 não encontrada em ./assets/sounds/"),
  );

  // Efeitos sonoros
  audioLoader.load(
      `./assets/sounds/abatido.wav`,
      (buffer) => (buffers[abatido] = buffer),
      undefined,
      () => console.warn(`abatido.wav não encontrado; usando som sintetizado`),
    );

  audioLoader.load(
      `./assets/sounds/atingido.wav`,
      (buffer) => (buffers[atingido] = buffer),
      undefined,
      () => console.warn(`atingido.wav não encontrado; usando som sintetizado`),
    );

  audioLoader.load(
      `./assets/sounds/tiro.mp3`,
      (buffer) => (buffers[tiro] = buffer),
      undefined,
      () => console.warn(`tiro.mp3 não encontrado; usando som sintetizado`),
    );

  audioLoader.load(
      `./assets/sounds/healthpack.wav`,
      (buffer) => (buffers[healthpack] = buffer),
      undefined,
      () => console.warn(`healthpack.wav não encontrado; usando som sintetizado`),
    );
}

// Chamado quando o botão START é pressionado
export function iniciarAudio() {
  jogoIniciado = true;
  if (listener.context.state === "suspended") listener.context.resume();
  if (musicaCarregada && musicaLigada) musica.play();
}

// liga/desliga a música
export function toggleMusica() {
  musicaLigada = !musicaLigada;
  if (!musica) return musicaLigada;
  if (musicaLigada) musica.play();
  else musica.pause();
  return musicaLigada;
}

// efeitos
function tocarBuffer(nome, volume) {
  const som = new THREE.Audio(listener);
  som.setBuffer(buffers[nome]);
  som.setVolume(volume);
  som.play();
}

// se der lenha, sintetizador WebAudio (usado só se o arquivo do
// efeito não existir). freqIni -> freqFim em 'dur' segundos.
function sintetizar({ tipo = "square", freqIni = 440, freqFim = 440, dur = 0.12, vol = 0.15 }) {
  const ctx = listener.context;
  if (ctx.state === "suspended") return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = tipo;
  osc.frequency.setValueAtTime(freqIni, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqFim), ctx.currentTime + dur);
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + dur);
}

export function somTiroPlayer() {
  if (buffers.tiro) return tocarBuffer("tiro", 0.12);
  sintetizar({ tipo: "square", freqIni: 700, freqFim: 250, dur: 0.07, vol: 0.05 });
}

export function somHealthPack() {
  if (buffers.healthpack) return tocarBuffer("healthpack", 0.5);
  sintetizar({ tipo: "sine", freqIni: 500, freqFim: 1000, dur: 0.25, vol: 0.2 });
}

export function somAviaoAtingido() {
  if (buffers.atingido) return tocarBuffer("atingido", 0.5);
  sintetizar({ tipo: "sawtooth", freqIni: 180, freqFim: 60, dur: 0.2, vol: 0.2 });
}

export function somInimigoAbatido() {
  if (buffers.abatido) return tocarBuffer("abatido", 0.5);
  sintetizar({ tipo: "triangle", freqIni: 300, freqFim: 80, dur: 0.35, vol: 0.2 });
}