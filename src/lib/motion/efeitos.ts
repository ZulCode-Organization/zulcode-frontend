/** Os gestos da barra de cima.
 *
 *  São imperativos de propósito. Cada um nasce de um acontecimento (ganhou,
 *  perdeu, subiu), dura um segundo e some — não é estado da tela, é um evento
 *  passando por ela. Montar isso em React significaria guardar "a moeda 3 está
 *  no meio do voo" em estado, re-renderizar a barra a cada quadro e medir
 *  posições durante a renderização. Aqui o elemento é criado, animado pela Web
 *  Animations API e removido quando termina; o React nem fica sabendo.
 *
 *  Tudo vai para uma camada fixa no body, acima da página e sem receber
 *  clique. Assim nenhum gesto é cortado pelo overflow da barra, e nenhum
 *  rouba o clique de quem está tentando usar a tela.
 *
 *  Com "reduzir movimento" ligado no sistema, `animar` devolve null e cada
 *  gesto se desfaz na hora: fica só a mudança de cor e de número. */

import { CURVA, animar, bezier, movimentoReduzido, parabola, variacao } from "./movimento";

type Ponto = { x: number; y: number };

const ID_DA_CAMADA = "zc-camada-de-efeitos";

function camada(): HTMLElement {
  let elemento = document.getElementById(ID_DA_CAMADA);
  if (!elemento) {
    elemento = document.createElement("div");
    elemento.id = ID_DA_CAMADA;
    elemento.setAttribute("aria-hidden", "true");
    Object.assign(elemento.style, {
      position: "fixed",
      inset: "0",
      pointerEvents: "none",
      zIndex: "70",
      overflow: "hidden",
      contain: "strict",
    });
    document.body.append(elemento);
  }
  return elemento;
}

function caixa(elemento: Element) {
  const r = elemento.getBoundingClientRect();
  return { r, centro: { x: r.left + r.width / 2, y: r.top + r.height / 2 } };
}

function criar(tag: string, estilos: Partial<CSSStyleDeclaration>) {
  const elemento = document.createElement(tag);
  Object.assign(elemento.style, {
    position: "absolute",
    left: "0",
    top: "0",
    willChange: "transform, opacity",
  }, estilos);
  camada().append(elemento);
  return elemento;
}

/** Remove o elemento quando a animação acaba, é cancelada — ou nunca começa,
 *  que é o caso de quem pediu menos movimento. */
function descartar(elemento: HTMLElement, animacao: Animation | null) {
  if (!animacao) {
    elemento.remove();
    return;
  }
  animacao.onfinish = () => elemento.remove();
  animacao.oncancel = () => elemento.remove();
}

/** Uma cópia do SVG do ícone, para o gesto carregar o desenho de verdade em
 *  vez de uma bolinha genérica. */
function copiaDoIcone(icone: Element, tamanho: number, cor?: { corpo?: string; traco?: string }) {
  const original = icone.querySelector("svg") ?? icone;
  const copia = original.cloneNode(true) as SVGElement;
  copia.removeAttribute("class");
  Object.assign(copia.style, {
    width: `${tamanho}px`,
    height: `${tamanho}px`,
    display: "block",
    overflow: "visible",
  });
  // A cor do momento, não a que o ícone tem agora: a pena que cai ainda é
  // vermelha mesmo que a da barra já tenha ficado cinza.
  const computado = getComputedStyle(original);
  copia.style.color = cor?.traco ?? computado.color;
  copia.style.fill = cor?.corpo ?? computado.fill;
  copia.style.stroke = cor?.traco ?? computado.stroke;
  return copia;
}

// ---------------------------------------------------------------------------
// 3. O número que sobe (ou desce) ao lado do chip
// ---------------------------------------------------------------------------

/** "+30" saindo do número. Perto do topo da tela não há espaço para subir, e
 *  aí ele desce — o importante é ser lido, não a direção. */
export function mostrarDiferenca(numero: Element, texto: string, cor: string, atraso = 0) {
  if (movimentoReduzido()) return;
  const { r, centro } = caixa(numero);
  const sobe = r.top > 34;
  const fonte = getComputedStyle(numero).fontFamily;

  // Um contorno na cor do fundo do app, como os números de dano dos jogos. No
  // celular o número desce por cima do cabeçalho azul da jornada, e verde sobre
  // azul some; com o contorno ele se lê sobre qualquer coisa.
  const fundo = getComputedStyle(document.body).backgroundColor || "#101114";
  const elemento = criar("span", {
    left: `${centro.x}px`,
    top: `${sobe ? r.top : r.bottom}px`,
    font: `800 13px/1 ${fonte}`,
    fontVariantNumeric: "tabular-nums",
    letterSpacing: "-0.01em",
    color: cor,
    whiteSpace: "nowrap",
    textShadow: [
      `1px 0 0 ${fundo}`, `-1px 0 0 ${fundo}`, `0 1px 0 ${fundo}`, `0 -1px 0 ${fundo}`,
      `1px 1px 0 ${fundo}`, `-1px -1px 0 ${fundo}`, `1px -1px 0 ${fundo}`, `-1px 1px 0 ${fundo}`,
      `0 0 6px ${fundo}`,
    ].join(", "),
  });
  elemento.textContent = texto;

  const direcao = sobe ? -1 : 1;
  const animacao = animar(elemento, [
    { transform: `translate(-50%, ${sobe ? "-40%" : "0"}) translateY(${2 * -direcao}px) scale(0.6)`, opacity: 0 },
    { transform: `translate(-50%, ${sobe ? "-40%" : "0"}) translateY(${10 * direcao}px) scale(1.08)`, opacity: 1, offset: 0.2, easing: CURVA.assenta },
    { transform: `translate(-50%, ${sobe ? "-40%" : "0"}) translateY(${14 * direcao}px) scale(1)`, opacity: 1, offset: 0.62 },
    { transform: `translate(-50%, ${sobe ? "-40%" : "0"}) translateY(${24 * direcao}px) scale(0.94)`, opacity: 0 },
  ], { duration: 1500, delay: atraso, easing: "linear", fill: "both" });
  descartar(elemento, animacao);
}

// ---------------------------------------------------------------------------
// 2. As rupees voando até o chip
// ---------------------------------------------------------------------------

/** Quantas moedas desenhar para um ganho. Cresce devagar: 5 rupees e 500
 *  rupees não podem virar 5 e 500 moedas na tela. */
function moedasPara(ganho: number) {
  return Math.max(3, Math.min(9, Math.round(Math.log2(ganho + 1) * 1.6)));
}

/** De onde as moedas saem: o centro do conteúdo visível, que é onde a pessoa
 *  estava olhando quando voltou para a trilha. */
export function origemDoConteudo(): Ponto {
  const principal = document.querySelector("main");
  if (principal) {
    const r = principal.getBoundingClientRect();
    const topo = Math.max(r.top, 0);
    const base = Math.min(r.bottom, window.innerHeight);
    return { x: r.left + r.width / 2, y: topo + (base - topo) * 0.42 };
  }
  return { x: window.innerWidth / 2, y: window.innerHeight * 0.45 };
}

/** Devolve quando a primeira e a última moeda chegam, em ms, para o chip
 *  receber cada uma na hora certa. Sem movimento, chegam "agora". */
export function voarRupees(icone: Element, ganho: number, origem: Ponto = origemDoConteudo()) {
  if (movimentoReduzido()) return { primeira: 0, ultima: 0 };
  const destino = caixa(icone).centro;
  const total = moedasPara(ganho);
  const fim = { x: destino.x - origem.x, y: destino.y - origem.y };
  const semente = Math.round(ganho * 7 + destino.x);
  let primeira = Infinity;
  let ultima = 0;

  for (let indice = 0; indice < total; indice += 1) {
    const tamanho = 15 + variacao(indice, semente) * 5;
    const elemento = criar("span", {
      left: `${origem.x - tamanho / 2}px`,
      top: `${origem.y - tamanho / 2}px`,
    });
    elemento.append(copiaDoIcone(icone, tamanho));

    // Primeiro um estouro curto, como se as moedas saltassem de onde foram
    // ganhas; depois um arco por cima até o chip. O arco é uma Bézier com o
    // ponto de controle acima do caminho, e cada moeda tem o seu, para elas não
    // voarem em fila indiana.
    const angulo = variacao(indice, semente + 1) * Math.PI * 2;
    const raio = 16 + variacao(indice, semente + 2) * 30;
    const estouro = { x: Math.cos(angulo) * raio, y: Math.sin(angulo) * raio * 0.75 - 8 };
    // O chip mora no topo da tela: um arco alto sairia por cima dela e as
    // moedas sumiriam no meio do voo. O teto é 34px acima do chip — a curva
    // então sobe íngreme e entra quase deitada, como algo puxado para dentro.
    const tetoDoArco = fim.y - 34;
    const controle = {
      x: estouro.x + (fim.x - estouro.x) * (0.5 + variacao(indice, semente + 3) * 0.3),
      y: Math.max(Math.min(estouro.y, fim.y) - 90 - variacao(indice, semente + 4) * 90, tetoDoArco),
    };
    const giro = (variacao(indice, semente + 5) - 0.5) * 70;

    const quadros: Keyframe[] = [
      { transform: "translate(0px, 0px) scale(0) rotate(0deg)", opacity: 0, offset: 0 },
      {
        transform: `translate(${estouro.x}px, ${estouro.y}px) scale(1.06) rotate(${giro * 0.3}deg)`,
        opacity: 1,
        offset: 0.2,
        easing: CURVA.assenta,
      },
    ];
    // O voo acelera ao chegar (t^1.7): a moeda é puxada para o chip, não
    // flutua até ele.
    const passos = 12;
    for (let passo = 1; passo <= passos; passo += 1) {
      const t = Math.pow(passo / passos, 1.7);
      const p = bezier(estouro, controle, fim, t);
      const escala = 1.06 - 0.5 * (passo / passos);
      quadros.push({
        transform: `translate(${p.x}px, ${p.y}px) scale(${escala}) rotate(${giro * (0.3 + 0.7 * (passo / passos))}deg)`,
        opacity: passo === passos ? 0.9 : 1,
        offset: 0.28 + 0.72 * (passo / passos),
      });
    }

    const atraso = indice * 62;
    const duracao = 980 + variacao(indice, semente + 6) * 180;
    // Parada na largada, enquanto o estouro não começa: sem isso ela pisca no
    // canto antes de aparecer no lugar.
    quadros.splice(1, 0, { transform: "translate(0px, 0px) scale(0) rotate(0deg)", opacity: 0, offset: 0.001 });
    const animacao = animar(elemento, quadros, { duration: duracao, delay: atraso, easing: "linear", fill: "both" });
    descartar(elemento, animacao);

    primeira = Math.min(primeira, atraso + duracao);
    ultima = Math.max(ultima, atraso + duracao);
  }
  return { primeira: Number.isFinite(primeira) ? primeira : 0, ultima };
}

// ---------------------------------------------------------------------------
// Gestos no próprio ícone
// ---------------------------------------------------------------------------

/** O chip recebendo uma moeda: achata e volta. Forte na primeira, leve nas
 *  seguintes — cinco pancadas iguais pareceriam um defeito. */
export function receber(icone: Element, atraso: number, forca = 1) {
  animar(icone, [
    { transform: "scale(1, 1)" },
    { transform: `scale(${1 + 0.24 * forca}, ${1 - 0.2 * forca})`, offset: 0.28, easing: CURVA.assenta },
    { transform: `scale(${1 - 0.06 * forca}, ${1 + 0.08 * forca})`, offset: 0.6 },
    { transform: "scale(1, 1)" },
  ], { duration: 460, delay: atraso, easing: CURVA.mola, composite: "replace" });
}

/** Pulo curto de quem ganhou uma pena de volta. */
export function quicar(icone: Element, atraso = 0) {
  animar(icone, [
    { transform: "translateY(0) scale(1)" },
    { transform: "translateY(-5px) scale(1.18)", offset: 0.35, easing: CURVA.assenta },
    { transform: "translateY(0) scale(0.96)", offset: 0.7 },
    { transform: "translateY(0) scale(1)" },
  ], { duration: 560, delay: atraso, easing: CURVA.mola });
}

/** A chama subindo de número: abaixa (antecipação), dispara e assenta. As
 *  brasas saem da ponta, que é onde o fogo de verdade solta faísca. */
export function saltarChama(icone: Element, cores: string[] = ["#7dd3fc", "#3b82f6"]) {
  animar(icone, [
    { transform: "translateY(0) scale(1, 1)", transformOrigin: "50% 100%" },
    { transform: "translateY(1px) scale(1.14, 0.8)", transformOrigin: "50% 100%", offset: 0.17, easing: CURVA.firme },
    { transform: "translateY(-6px) scale(0.88, 1.24)", transformOrigin: "50% 100%", offset: 0.42, easing: CURVA.assenta },
    { transform: "translateY(1px) scale(1.05, 0.95)", transformOrigin: "50% 100%", offset: 0.72 },
    { transform: "translateY(0) scale(1, 1)", transformOrigin: "50% 100%" },
  ], { duration: 760, easing: "linear" });

  if (movimentoReduzido()) return;
  const { r } = caixa(icone);
  // A chama mora a ~20px do topo da tela: brasa que sobe muito sai por cima
  // e some. Por isso sobem pouco e se abrem para os lados.
  for (let indice = 0; indice < 6; indice += 1) {
    const deriva = (variacao(indice, 3) - 0.5) * 30;
    const subida = 8 + variacao(indice, 4) * 9;
    const tamanho = 3 + variacao(indice, 5) * 2.5;
    const traco = cores[indice % cores.length];
    const brasa = criar("span", {
      left: `${r.left + r.width * (0.38 + variacao(indice, 6) * 0.24)}px`,
      top: `${r.top + r.height * 0.32}px`,
      width: `${tamanho}px`,
      height: `${tamanho}px`,
      borderRadius: "999px",
      background: traco,
    });
    const animacao = animar(brasa, [
      { transform: "translate(0, 0) scale(0.6)", opacity: 0 },
      { transform: `translate(${deriva * 0.35}px, ${-subida * 0.5}px) scale(1.15)`, opacity: 1, offset: 0.2, easing: "ease-out" },
      { transform: `translate(${deriva * 0.75}px, ${-subida * 0.85}px) scale(0.9)`, opacity: 0.9, offset: 0.6 },
      { transform: `translate(${deriva}px, ${-subida}px) scale(0.5)`, opacity: 0 },
    ], { duration: 820 + variacao(indice, 7) * 320, delay: 200 + indice * 45, easing: "linear", fill: "both" });
    descartar(brasa, animacao);
  }
}

/** A chama apagando de vez: encolhe para a base e perde o ar. */
export function apagarChama(icone: Element) {
  animar(icone, [
    { transform: "scale(1, 1)", transformOrigin: "50% 100%", filter: "saturate(1)" },
    { transform: "scale(1.06, 0.72) skewX(-4deg)", transformOrigin: "50% 100%", offset: 0.4, filter: "saturate(0.6)" },
    { transform: "scale(1, 1)", transformOrigin: "50% 100%", filter: "saturate(1)" },
  ], { duration: 700, easing: CURVA.firme });
}

/** 8. A sequência em risco: um vacilo de vela numa corrente de ar, uma vez,
 *  logo depois que a tela abre. Não repete — repetido vira ansiedade. */
export function vacilarChama(icone: Element, atraso = 700) {
  const base = { transformOrigin: "50% 100%" };
  animar(icone, [
    { ...base, transform: "scale(1, 1) skewX(0deg)", opacity: 1 },
    { ...base, transform: "scale(0.96, 0.78) skewX(-7deg)", opacity: 0.62, offset: 0.16, easing: CURVA.firme },
    { ...base, transform: "scale(1.02, 1.05) skewX(3deg)", opacity: 1, offset: 0.34 },
    { ...base, transform: "scale(0.97, 0.84) skewX(5deg)", opacity: 0.72, offset: 0.52, easing: CURVA.firme },
    { ...base, transform: "scale(1, 1.03) skewX(-2deg)", opacity: 1, offset: 0.74 },
    { ...base, transform: "scale(1, 1) skewX(0deg)", opacity: 1 },
  ], { duration: 1500, delay: atraso, easing: "linear" });
}

/** 4. A pena que se solta: uma cópia vermelha cai balançando como pena de
 *  verdade — pêndulo e deriva, nunca em linha reta — enquanto a da barra
 *  perde a cor por um instante. */
export function soltarPena(icone: Element) {
  animar(icone, [
    { filter: "saturate(1) brightness(1)" },
    { filter: "saturate(0.15) brightness(1.35)", offset: 0.25 },
    { filter: "saturate(1) brightness(1)" },
  ], { duration: 640, easing: CURVA.assenta });

  if (movimentoReduzido()) return;
  const { r } = caixa(icone);
  const elemento = criar("span", { left: `${r.left}px`, top: `${r.top}px`, transformOrigin: "60% 20%" });
  elemento.append(copiaDoIcone(icone, r.width, { corpo: "#f43f5e", traco: "#9f1239" }));
  const animacao = animar(elemento, [
    { transform: "translate(0, 0) rotate(0deg)", opacity: 0.95 },
    { transform: "translate(4px, 7px) rotate(16deg)", opacity: 0.9, offset: 0.2, easing: "ease-in-out" },
    { transform: "translate(-3px, 15px) rotate(-12deg)", opacity: 0.75, offset: 0.44, easing: "ease-in-out" },
    { transform: "translate(5px, 23px) rotate(13deg)", opacity: 0.45, offset: 0.68, easing: "ease-in-out" },
    { transform: "translate(-1px, 33px) rotate(-7deg)", opacity: 0 },
  ], { duration: 1500, easing: "linear", fill: "both" });
  descartar(elemento, animacao);
}

/** 5. A última pena: um tremor que perde força, como algo batendo e parando.
 *  O cinza vem depois, pela transição de cor do próprio ícone. */
export function tremer(icone: Element, atraso = 0) {
  animar(icone, [
    { transform: "translateX(0) rotate(0deg)" },
    { transform: "translateX(-5px) rotate(-6deg)", offset: 0.12 },
    { transform: "translateX(5px) rotate(5deg)", offset: 0.26 },
    { transform: "translateX(-4px) rotate(-4deg)", offset: 0.4 },
    { transform: "translateX(3px) rotate(3deg)", offset: 0.54 },
    { transform: "translateX(-2px) rotate(-1deg)", offset: 0.7 },
    { transform: "translateX(1px) rotate(0deg)", offset: 0.85 },
    { transform: "translateX(0) rotate(0deg)" },
  ], { duration: 640, delay: atraso, easing: CURVA.firme });
}

/** 9 e 10. Um reflexo atravessando o ícone. É a própria silhueta do ícone,
 *  clara, recortada por uma faixa inclinada que anda — por isso o brilho
 *  respeita o desenho em vez de passar como um retângulo por cima de tudo. */
export function varrerBrilho(icone: Element, cor = "#ffffff", atraso = 0) {
  if (movimentoReduzido()) return;
  const { r } = caixa(icone);
  const elemento = criar("span", {
    left: `${r.left}px`,
    top: `${r.top}px`,
    width: `${r.width}px`,
    height: `${r.height}px`,
    opacity: "0.85",
  });
  elemento.append(copiaDoIcone(icone, r.width, { corpo: cor, traco: cor }));

  const faixa = (x: number) =>
    `polygon(${x}% 0%, ${x + 26}% 0%, ${x + 6}% 100%, ${x - 20}% 100%)`;
  const animacao = animar(elemento, [
    { clipPath: faixa(-40) },
    { clipPath: faixa(130) },
  ], { duration: 820, delay: atraso, easing: CURVA.firme, fill: "both" });
  descartar(elemento, animacao);
}

/** 19. Confete pequeno saindo do chip num marco da sequência. Cada pedaço cai
 *  numa parábola calculada — é a gravidade que separa confete de verdade de
 *  pontinhos deslizando em diagonal. */
export function estourarConfete(icone: Element, cores: string[]) {
  if (movimentoReduzido()) return;
  const { centro } = caixa(icone);
  const total = 22;
  for (let indice = 0; indice < total; indice += 1) {
    const angulo = (-170 + variacao(indice, 11) * 160) * (Math.PI / 180);
    const velocidade = 55 + variacao(indice, 12) * 70;
    // Mais para os lados que para cima: o chip mora no topo da tela e o
    // confete que sobe muito sai por cima dela antes de cair.
    const trajeto = parabola(Math.cos(angulo) * velocidade * 1.15, Math.sin(angulo) * velocidade * 0.6, 170, 18);
    const redondo = variacao(indice, 13) > 0.62;
    const largura = redondo ? 4 : 3 + variacao(indice, 14) * 2;
    const altura = redondo ? 4 : 6 + variacao(indice, 15) * 3;
    const giro = (variacao(indice, 16) - 0.5) * 900;
    const pedaco = criar("span", {
      left: `${centro.x - largura / 2}px`,
      top: `${centro.y - altura / 2}px`,
      width: `${largura}px`,
      height: `${altura}px`,
      borderRadius: redondo ? "999px" : "1px",
      background: cores[indice % cores.length],
    });
    const animacao = animar(pedaco, trajeto.map((p) => ({
      transform: `translate(${p.x}px, ${p.y}px) rotate(${giro * p.t}deg) scale(${p.t < 0.08 ? p.t / 0.08 : 1})`,
      opacity: p.t > 0.7 ? 1 - (p.t - 0.7) / 0.3 : 1,
      offset: p.t,
    // Tempo linear: a parábola já é a física. Uma curva por cima comprimia a
    // queda e o confete sumia transparente no meio do caminho.
    })), { duration: 1150 + variacao(indice, 17) * 450, delay: variacao(indice, 18) * 90, easing: "linear", fill: "both" });
    descartar(pedaco, animacao);
  }
}

// ---------------------------------------------------------------------------
// 20. O selo de divisão nova
// ---------------------------------------------------------------------------

/** O troféu do lucide, o mesmo do resto do app — copiado como dado, porque o
 *  selo é montado fora do React. */
const TROFEU = [
  "M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978",
  "M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978",
  "M18 9h1.5a1 1 0 0 0 0-5H18",
  "M4 22h16",
  "M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z",
  "M6 9H4.5a1 1 0 0 1 0-5H6",
];

/** Uma etiqueta que desce de baixo dos chips, fica o tempo de ser lida e
 *  volta. As classes são do próprio app, então ela acompanha o tema. */
export function mostrarSeloDeDivisao(ancora: Element, nome: string, classeDaCor: string, atraso = 0) {
  const { r, centro } = caixa(ancora);
  const elemento = criar("div", { left: `${centro.x}px`, top: `${r.bottom + 10}px` });
  elemento.innerHTML = `
    <div class="flex items-center gap-2 whitespace-nowrap rounded-2xl border border-border bg-popover py-1.5 pl-1.5 pr-3.5 text-[0.8rem] font-black text-popover-foreground shadow-lg">
      <span class="grid size-7 place-items-center rounded-[10px] ${classeDaCor}">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          ${TROFEU.map((d) => `<path d="${d}"/>`).join("")}
        </svg>
      </span>
      <span class="flex flex-col leading-tight">
        <span class="text-[0.6rem] font-black uppercase tracking-[0.12em] text-muted-foreground">Divisão nova</span>
        <span></span>
      </span>
    </div>`;
  // O nome entra como texto, nunca como HTML.
  const alvo = elemento.querySelectorAll("span span")[1] as HTMLElement | undefined;
  if (alvo) alvo.textContent = nome;

  const animacao = animar(elemento, [
    { transform: "translate(-50%, -12px) scale(0.9)", opacity: 0 },
    { transform: "translate(-50%, 0) scale(1.02)", opacity: 1, offset: 0.1, easing: CURVA.mola },
    { transform: "translate(-50%, 0) scale(1)", opacity: 1, offset: 0.16 },
    { transform: "translate(-50%, 0) scale(1)", opacity: 1, offset: 0.88, easing: CURVA.cai },
    { transform: "translate(-50%, -8px) scale(0.96)", opacity: 0 },
  ], { duration: 3800, delay: atraso, easing: "linear", fill: "both" });
  descartar(elemento, animacao);
}
