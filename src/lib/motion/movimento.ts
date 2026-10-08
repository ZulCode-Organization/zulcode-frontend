/** O vocabulário de movimento da barra de cima.
 *
 *  Poucas curvas, usadas sempre pelo mesmo motivo. O que denuncia animação
 *  genérica é tudo andar no mesmo `ease` de 300ms; aqui cada gesto tem o peso
 *  da coisa que ele representa — moeda é leve e cai rápido, chama sobe com
 *  antecipação, pena perde o ar e desce devagar. */

export const CURVA = {
  /** Chega rápido e assenta devagar. A maioria das entradas. */
  assenta: "cubic-bezier(0.16, 1, 0.3, 1)",
  /** Passa um pouco do ponto e volta: só onde há impacto (receber, saltar). */
  mola: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  /** Começa parado e acelera: o que vai embora ou cai. */
  cai: "cubic-bezier(0.55, 0, 0.85, 0.35)",
  /** Simétrica e firme, para o que vai e volta (tremor, vacilo). */
  firme: "cubic-bezier(0.65, 0, 0.35, 1)",
} as const;

/** Quem pediu menos movimento no sistema costuma ter pedido por enjoo. Nesses
 *  casos os gestos somem e fica só a mudança de cor e de número. */
export function movimentoReduzido() {
  return typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** `element.animate` com as guardas de sempre: elemento que já saiu da tela,
 *  navegador sem Web Animations, e preferência por menos movimento. */
export function animar(
  elemento: Element | null | undefined,
  quadros: Keyframe[],
  opcoes: KeyframeAnimationOptions,
) {
  if (!elemento || typeof (elemento as HTMLElement).animate !== "function") return null;
  if (movimentoReduzido()) return null;
  return (elemento as HTMLElement).animate(quadros, opcoes);
}

/** Pontos de uma parábola, para partículas com gravidade. Calcular os quadros
 *  em vez de usar uma curva pronta é o que faz o confete cair de verdade, e não
 *  deslizar em diagonal. */
export function parabola(
  vx: number,
  vy: number,
  gravidade: number,
  passos = 14,
): { x: number; y: number; t: number }[] {
  return Array.from({ length: passos + 1 }, (_, indice) => {
    const t = indice / passos;
    return { x: vx * t, y: vy * t + gravidade * t * t, t };
  });
}

/** Ponto de uma curva de Bézier quadrática — o arco do voo das rupees. */
export function bezier(
  inicio: { x: number; y: number },
  controle: { x: number; y: number },
  fim: { x: number; y: number },
  t: number,
) {
  const u = 1 - t;
  return {
    x: u * u * inicio.x + 2 * u * t * controle.x + t * t * fim.x,
    y: u * u * inicio.y + 2 * u * t * controle.y + t * t * fim.y,
  };
}

/** Sorteio determinístico por índice: as partículas variam entre si sem
 *  `Math.random`, e duas explosões iguais desenham igual. */
export function variacao(indice: number, semente: number) {
  const x = Math.sin(indice * 12.9898 + semente * 78.233) * 43758.5453;
  return x - Math.floor(x);
}
