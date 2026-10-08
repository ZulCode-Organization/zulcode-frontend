/** Catálogo fechado de bibliotecas. Por que uma lista e não um campo de URL
 *  livre: um projeto compartilhado roda no navegador de quem abre o link, e
 *  "cole aqui qualquer script" é exatamente como se espalha código hostil. As
 *  versões são fixas para o projeto de hoje continuar rodando ano que vem.
 *
 *  Os domínios precisam bater com os de `playground-preview/runtime.js`, que
 *  revalida tudo por conta própria. */

export type Biblioteca = {
  id: string;
  nome: string;
  descricao: string;
  /** O que o aluno digita para usar. Aparece no painel como dica. */
  global: string;
  urls: string[];
};

export const CDNS_PERMITIDOS = ["https://cdn.jsdelivr.net/", "https://cdnjs.cloudflare.com/"];

export const BIBLIOTECAS: Biblioteca[] = [
  {
    id: "confetti",
    nome: "Confetti",
    descricao: "Chuva de confete em uma linha. Bom para celebrar acerto.",
    global: "confetti()",
    urls: ["https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js"],
  },
  {
    id: "chartjs",
    nome: "Chart.js",
    descricao: "Gráficos de barra, linha e pizza em um <canvas>.",
    global: "new Chart(canvas, { ... })",
    urls: ["https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"],
  },
  {
    id: "three",
    nome: "Three.js",
    descricao: "Cena 3D no navegador. Pesado, mas impressiona.",
    global: "THREE.Scene",
    urls: ["https://cdn.jsdelivr.net/npm/three@0.171.0/build/three.min.js"],
  },
  {
    id: "p5",
    nome: "p5.js",
    descricao: "Desenho e animação com setup() e draw(). Ótimo para começar.",
    global: "setup() / draw()",
    urls: ["https://cdn.jsdelivr.net/npm/p5@1.11.2/lib/p5.min.js"],
  },
  {
    id: "matter",
    nome: "Matter.js",
    descricao: "Física 2D: gravidade, colisão, corpos que caem.",
    global: "Matter.Engine",
    urls: ["https://cdn.jsdelivr.net/npm/matter-js@0.20.0/build/matter.min.js"],
  },
  {
    id: "gsap",
    nome: "GSAP",
    descricao: "Animação suave de qualquer propriedade.",
    global: "gsap.to(alvo, { ... })",
    urls: ["https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"],
  },
  {
    id: "lodash",
    nome: "Lodash",
    descricao: "Atalhos para listas e objetos.",
    global: "_.shuffle([1, 2, 3])",
    urls: ["https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js"],
  },
  {
    id: "dayjs",
    nome: "Day.js",
    descricao: "Datas sem dor de cabeça.",
    global: "dayjs().format()",
    urls: ["https://cdn.jsdelivr.net/npm/dayjs@1.11.13/dayjs.min.js"],
  },
  {
    id: "tone",
    nome: "Tone.js",
    descricao: "Som e música feitos por código.",
    global: "new Tone.Synth()",
    urls: ["https://cdn.jsdelivr.net/npm/tone@15.0.4/build/Tone.js"],
  },
  {
    id: "normalize",
    nome: "Normalize.css",
    descricao: "Zera as diferenças de estilo entre navegadores.",
    global: "só CSS",
    urls: ["https://cdn.jsdelivr.net/npm/normalize.css@8.0.1/normalize.css"],
  },
];

export function biblioteca(id: string) {
  return BIBLIOTECAS.find((item) => item.id === id) ?? null;
}

/** As URLs de script, na ordem do catálogo. O preview carrega uma por vez. */
export function urlsDeScript(ids: string[]) {
  return ids
    .flatMap((id) => biblioteca(id)?.urls ?? [])
    .filter((url) => url.endsWith(".js") && CDNS_PERMITIDOS.some((cdn) => url.startsWith(cdn)));
}

/** As folhas de estilo entram como <link> no HTML gerado, não como script. */
export function urlsDeEstilo(ids: string[]) {
  return ids
    .flatMap((id) => biblioteca(id)?.urls ?? [])
    .filter((url) => url.endsWith(".css") && CDNS_PERMITIDOS.some((cdn) => url.startsWith(cdn)));
}
