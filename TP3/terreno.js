import * as THREE from 'three';


// Perlin Noise simples
class ImprovedNoise {
  constructor() {
    this.p = new Uint8Array(512);
    const permutation = [
      151,160,137,91,90,15,
      131,13,201,95,96,53,194,233,7,225,
      140,36,103,30,69,142,8,99,37,240,21,10,
      23,190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,
      35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,
      168, 68,175,74,165,71,134,139,48,27,166,
      77,146,158,231,83,111,229,122,60,211,
      133,230,220,105,92,41,55,46,245,40,244,
      102,143,54, 65,25,63,161, 1,216,80,73,209,76,
      132,187,208,89,18,169,200,196,135,130,116,
      188,159,86,164,100,109,198,173,186,
      3,64,52,217,226,250,124,123,5,202,38,
      147,118,126,255,82,85,212,207,206,59,227,
      47,16,58,17,182,189,28,42,223,183,170,213,
      119,248,152, 2,44,154,163, 70,221,153,101,155,
      167,43,172,9,129,22,39,253, 19,98,108,110,79,
      113,224,232,178,185, 112,104,218,246,97,228,
      251,34,242,193,238,210,144,12,191,179,162,
      241, 81,51,145,235,249,14,239,107,49,192,
      214, 31,181,199,106,157,184, 84,204,176,
      115,121,50,45,127, 4,150,254,138,236,205,
      93,222,114, 67,29,24,72,243,141,128,195,78,
      66,215,61,156,180
    ];

    for (let i = 0; i < 256; i++) {
      this.p[256 + i] = this.p[i] = permutation[i];
    }
  }

  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  lerp(t, a, b) {
    return a + t * (b - a);
  }

  grad(hash, x, y, z) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise(x, y, z) {
    const floorX = Math.floor(x), floorY = Math.floor(y), floorZ = Math.floor(z);

    const X = floorX & 255;
    const Y = floorY & 255;
    const Z = floorZ & 255;

    x -= floorX;
    y -= floorY;
    z -= floorZ;

    const xMinus1 = x - 1;
    const yMinus1 = y - 1;
    const zMinus1 = z - 1;

    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);

    const A = this.p[X] + Y;
    const AA = this.p[A] + Z;
    const AB = this.p[A + 1] + Z;
    const B = this.p[X + 1] + Y;
    const BA = this.p[B] + Z;
    const BB = this.p[B + 1] + Z;

    return this.lerp(w,
      this.lerp(v,
        this.lerp(u, this.grad(this.p[AA], x, y, z),
                    this.grad(this.p[BA], xMinus1, y, z)),
        this.lerp(u, this.grad(this.p[AB], x, yMinus1, z),
                    this.grad(this.p[BB], xMinus1, yMinus1, z))
      ),
      this.lerp(v,
        this.lerp(u, this.grad(this.p[AA + 1], x, y, zMinus1),
                    this.grad(this.p[BA + 1], xMinus1, y, zMinus1)),
        this.lerp(u, this.grad(this.p[AB + 1], x, yMinus1, zMinus1),
                    this.grad(this.p[BB + 1], xMinus1, yMinus1, zMinus1))
      )
    );
  }
}

const noise = new ImprovedNoise();

export function getTerrainHeight(x, z) {
  return (
    noise.noise(x * 0.02, z * 0.02, 0) * 20 +
    noise.noise(x * 0.05, z * 0.05, 0) * 5 +
    noise.noise(x * 0.1, z * 0.1, 0) * 2
  );
}

//=====================================================================
// TEXTURIZAÇÃO DO TERRENO VIA SHADERS (Procedural Material Blending)
//=====================================================================

export const NIVEL_AGUA = -3.5;

// --- Carregamento das texturas -------------------------------------
const texLoader = new THREE.TextureLoader(loadingManager);

function loadRepeatTexture(url) {
  const tex = texLoader.load(url);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const texAreia = loadRepeatTexture('./assets/textures/sand-512.jpg');
const texGrama = loadRepeatTexture('./assets/textures/grass-512.jpg');
const texRocha = loadRepeatTexture('./assets/textures/rock-512.jpg');
const texNeve  = loadRepeatTexture('./assets/textures/snow-512.jpg');


const texNormaisAgua = texLoader.load('./assets/textures/waternormals.jpg');
texNormaisAgua.wrapS = texNormaisAgua.wrapT = THREE.RepeatWrapping;

const FOG_COLOR = new THREE.Color("rgb(175, 200, 220)");
const FOG_NEAR = 1;
const FOG_FAR = 250;

const DIR_LUZ = new THREE.Vector3(1, 1, 0).normalize();

// --- Vertex shader do terreno ---------------------------------------
// Só repassa ao fragment shader as informações geométricas de que ele
// precisa: posição em coordenadas de MUNDO (para altura e UVs),
// normal em mundo (para inclinação e iluminação) e distância até a
// câmera (para a névoa).
const terrainVertexShader = /* glsl */`
  varying vec3 vWorldPos;   // posição do vértice no mundo
  varying vec3 vNormal;     // normal no espaço do mundo
  varying float vDist;      // distância até a câmera (para o fog)

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;

    // mat3(modelMatrix) funciona aqui porque o chunk não tem escala.
    vNormal = normalize(mat3(modelMatrix) * normal);

    vec4 mvPosition = viewMatrix * worldPos;
    vDist = -mvPosition.z;

    gl_Position = projectionMatrix * mvPosition;
  }
`;

// --- Fragment shader do terreno --------------------------------------
const terrainFragmentShader = /* glsl */`
  uniform sampler2D tAreia;
  uniform sampler2D tGrama;
  uniform sampler2D tRocha;
  uniform sampler2D tNeve;
  uniform vec3 dirLuz;
  uniform vec3 fogColor;
  uniform float fogNear;
  uniform float fogFar;
  uniform float nivelAgua;

  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vDist;

  void main() {
    // UVs derivadas da posição de MUNDO (x,z): garante continuidade
    // perfeita das texturas entre chunks vizinhos, sem emendas.
    // Cada material usa uma escala de repetição própria.
    vec2 uvBase = vWorldPos.xz;
    vec3 areia = texture2D(tAreia, uvBase * 0.08).rgb;
    vec3 grama = texture2D(tGrama, uvBase * 0.06).rgb;
    vec3 rocha = texture2D(tRocha, uvBase * 0.04).rgb;
    vec3 neve  = texture2D(tNeve,  uvBase * 0.05).rgb;

    float h = vWorldPos.y; // altura do fragmento

    //----------------------------------------------------------------
    // BLENDING POR ALTURA — cada smoothstep(a, b, h) devolve 0 antes
    // de 'a', 1 depois de 'b' e uma transição suave entre os dois.
    // É exatamente essa rampa que cria a mistura entre as texturas.
    //----------------------------------------------------------------
    float areiaParaGrama = smoothstep(nivelAgua + 0.5, nivelAgua + 3.0, h);
    float gramaParaRocha = smoothstep(5.0, 9.0, h);
    float rochaParaNeve  = smoothstep(9.5, 12.5, h);

    vec3 cor = mix(areia, grama, areiaParaGrama);
    cor = mix(cor, rocha, gramaParaRocha);
    cor = mix(cor, neve,  rochaParaNeve);

    //----------------------------------------------------------------
    // BLENDING POR INCLINAÇÃO — normal.y == 1 em terreno plano e
    // diminui conforme a encosta fica íngreme. Encostas íngremes
    // recebem rocha independentemente da altura (grama e neve não
    // "grudam" em paredões).
    //----------------------------------------------------------------
    float inclinacao = 1.0 - clamp(vNormal.y, 0.0, 1.0);
    float pesoEncosta = smoothstep(0.30, 0.55, inclinacao);
    cor = mix(cor, rocha, pesoEncosta);

    //----------------------------------------------------------------
    // ILUMINAÇÃO (Lambert): como ShaderMaterial não usa as luzes da
    // cena automaticamente, calculamos o termo difuso manualmente com
    // a mesma direção da DirectionalLight do main.js.
    //----------------------------------------------------------------
    float difusa = max(dot(normalize(vNormal), dirLuz), 0.0);
    vec3 corIluminada = cor * (0.35 + 0.75 * difusa); // 0.35 = ambiente

    //----------------------------------------------------------------
    // NÉVOA: reproduz o THREE.Fog linear da cena para o terreno não
    // "furar" o efeito de fog dos outros objetos.
    //----------------------------------------------------------------
    float fogFactor = smoothstep(fogNear, fogFar, vDist);
    gl_FragColor = vec4(mix(corIluminada, fogColor, fogFactor), 1.0);
  }
`;

// Material único compartilhado por todos os chunks (mais eficiente e
// as UVs por posição de mundo dispensam ajustes por chunk).
const terrainMaterial = new THREE.ShaderMaterial({
  uniforms: {
    tAreia:   { value: texAreia },
    tGrama:   { value: texGrama },
    tRocha:   { value: texRocha },
    tNeve:    { value: texNeve },
    dirLuz:   { value: DIR_LUZ },
    fogColor: { value: FOG_COLOR },
    fogNear:  { value: FOG_NEAR },
    fogFar:   { value: FOG_FAR },
    nivelAgua:{ value: NIVEL_AGUA },
  },
  vertexShader: terrainVertexShader,
  fragmentShader: terrainFragmentShader,
});

export function createTerrainChunk(zOffset = 0) {
  const size = 400;
  const segments = 100;

  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);

  const vertices = geometry.attributes.position;

  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i);
    const z = vertices.getZ(i) + zOffset;

    const y = getTerrainHeight(x, z);

    vertices.setY(i, y);
  }

  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(geometry, terrainMaterial);
  // Obs.: ShaderMaterial não participa do shadow mapping padrão do
  // three.js; o sombreamento do terreno vem do Lambert no shader.

  return mesh;
}

//=====================================================================
// ÁGUA COM SHADERS
//=====================================================================

const aguaVertexShader = /* glsl */`
  uniform float tempo;

  varying vec3 vWorldPos;
  varying float vDist;

  void main() {
    vec3 pos = position;

    // Ondas: soma de dois senos com frequências/fases diferentes.
    // Deslocamos o vértice em y (o plano já está rotacionado).
    vec4 wp = modelMatrix * vec4(pos, 1.0);
    pos.y += sin(wp.x * 0.35 + tempo * 1.3) * 0.12
           + cos(wp.z * 0.28 + tempo * 0.9) * 0.12;

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPos = worldPos.xyz;

    vec4 mvPosition = viewMatrix * worldPos;
    vDist = -mvPosition.z;

    gl_Position = projectionMatrix * mvPosition;
  }
`;

const aguaFragmentShader = /* glsl */`
  uniform float tempo;
  uniform sampler2D tNormais;
  uniform vec3 dirLuz;
  uniform vec3 fogColor;
  uniform float fogNear;
  uniform float fogFar;

  varying vec3 vWorldPos;
  varying float vDist;

  void main() {
    // Duas amostras do normal map, em escalas e velocidades
    // diferentes, somadas: quebra a repetição visível e dá a
    // impressão de ondulação contínua.
    vec2 uv1 = vWorldPos.xz * 0.040 + vec2(tempo * 0.020, tempo * 0.014);
    vec2 uv2 = vWorldPos.xz * 0.085 - vec2(tempo * 0.028, tempo * 0.020);
    vec3 n1 = texture2D(tNormais, uv1).rgb * 2.0 - 1.0;
    vec3 n2 = texture2D(tNormais, uv2).rgb * 2.0 - 1.0;

    // O normal map guarda o vetor em "tangent space" com z para fora;
    // como o plano é horizontal, trocamos z<->y para o espaço do mundo.
    vec3 normal = normalize(vec3(n1.x + n2.x, 4.0, n1.y + n2.y));

    // Fresnel: olhando de raspão (ângulo raso) a água reflete mais
    // (fica mais clara); olhando de cima vemos a cor profunda.
    vec3 dirVisao = normalize(cameraPosition - vWorldPos);
    float fresnel = pow(1.0 - max(dot(dirVisao, normal), 0.0), 2.0);

    vec3 corProfunda = vec3(0.03, 0.18, 0.30);
    vec3 corRasa     = vec3(0.16, 0.50, 0.60);
    vec3 cor = mix(corProfunda, corRasa, clamp(fresnel * 1.2, 0.0, 1.0));

    // Brilho especular do sol (Phong): reflexo pontual da luz.
    vec3 reflexo = reflect(-dirLuz, normal);
    float especular = pow(max(dot(reflexo, dirVisao), 0.0), 80.0);
    cor += vec3(1.0) * especular * 0.7;

    // Névoa igual à do terreno.
    float fogFactor = smoothstep(fogNear, fogFar, vDist);
    cor = mix(cor, fogColor, fogFactor);

    gl_FragColor = vec4(cor, 0.88); // levemente transparente
  }
`;

const aguaMaterial = new THREE.ShaderMaterial({
  uniforms: {
    tempo:    { value: 0 },
    tNormais: { value: texNormaisAgua },
    dirLuz:   { value: DIR_LUZ },
    fogColor: { value: FOG_COLOR },
    fogNear:  { value: FOG_NEAR },
    fogFar:   { value: FOG_FAR },
  },
  vertexShader: aguaVertexShader,
  fragmentShader: aguaFragmentShader,
  transparent: true,
});

// Cria o plano de água de um chunk (mesmo tamanho do terreno).
export function createAguaChunk() {
  const size = 400;
  const segments = 60; // subdividido para as ondas do vertex shader

  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);

  const mesh = new THREE.Mesh(geometry, aguaMaterial);
  mesh.position.y = NIVEL_AGUA;

  return mesh;
}

// Chamada a cada frame pelo main.js para animar as ondas e o
// deslizamento do normal map (uniform 'tempo' é compartilhado por
// todos os chunks de água, pois o material é único).
export function atualizarAgua(tempoDecorrido) {
  aguaMaterial.uniforms.tempo.value = tempoDecorrido;
}

// Mantém o fog dos shaders (terreno e água) sincronizado com o
// THREE.Fog da cena quando o usuário altera a distância na GUI.
// Sem isto, mexer no slider "Fog Distance" muda a névoa dos demais
// objetos mas não a do terreno/água, que têm o fog replicado à mão
// no fragment shader.
export function setFogFar(valor) {
  terrainMaterial.uniforms.fogFar.value = valor;
  aguaMaterial.uniforms.fogFar.value = valor;
}
