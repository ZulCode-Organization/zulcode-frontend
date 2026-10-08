import { PALETAS } from "./temas";

/** Preferências do editor. Ficam neste aparelho, não na conta: tamanho de fonte
 *  bom no celular é ruim no monitor, e sincronizar isso entre os dois só daria
 *  trabalho para o usuário. */
export type Ajustes = {
  tema: string;
  fonte: number;
  tabulacao: number;
  quebrarLinha: boolean;
  numerosDeLinha: boolean;
  /** Fecha parêntese, chave e aspas automaticamente. */
  fecharPares: boolean;
  /** Expande abreviação do Emmet: `!`, `div.cartao`, `ul>li*3`. */
  emmet: boolean;
  /** Roda sozinho pouco depois de parar de digitar. */
  rodarSozinho: boolean;
  /** A barra de símbolos acima do teclado, no celular. */
  barraDeTeclas: boolean;
};

export const AJUSTES_PADRAO: Ajustes = {
  tema: "zulcode-escuro",
  fonte: 14,
  tabulacao: 2,
  quebrarLinha: true,
  numerosDeLinha: true,
  fecharPares: true,
  emmet: true,
  rodarSozinho: true,
  barraDeTeclas: true,
};

export const FONTE_MIN = 11;
export const FONTE_MAX = 24;

const CHAVE = "zulcode:playground-ajustes:v1";

function numero(valor: unknown, padrao: number, min: number, max: number) {
  return typeof valor === "number" && Number.isFinite(valor)
    ? Math.min(max, Math.max(min, Math.round(valor)))
    : padrao;
}

function booleano(valor: unknown, padrao: boolean) {
  return typeof valor === "boolean" ? valor : padrao;
}

export function lerAjustes(): Ajustes {
  if (typeof window === "undefined") return AJUSTES_PADRAO;
  try {
    const cru: unknown = JSON.parse(localStorage.getItem(CHAVE) ?? "{}");
    if (!cru || typeof cru !== "object") return AJUSTES_PADRAO;
    const item = cru as Record<string, unknown>;
    return {
      tema: PALETAS.some((p) => p.id === item.tema) ? String(item.tema) : AJUSTES_PADRAO.tema,
      fonte: numero(item.fonte, AJUSTES_PADRAO.fonte, FONTE_MIN, FONTE_MAX),
      tabulacao: numero(item.tabulacao, AJUSTES_PADRAO.tabulacao, 2, 8),
      quebrarLinha: booleano(item.quebrarLinha, AJUSTES_PADRAO.quebrarLinha),
      numerosDeLinha: booleano(item.numerosDeLinha, AJUSTES_PADRAO.numerosDeLinha),
      fecharPares: booleano(item.fecharPares, AJUSTES_PADRAO.fecharPares),
      emmet: booleano(item.emmet, AJUSTES_PADRAO.emmet),
      rodarSozinho: booleano(item.rodarSozinho, AJUSTES_PADRAO.rodarSozinho),
      barraDeTeclas: booleano(item.barraDeTeclas, AJUSTES_PADRAO.barraDeTeclas),
    };
  } catch {
    return AJUSTES_PADRAO;
  }
}

export function salvarAjustes(ajustes: Ajustes) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(ajustes));
  } catch {
    // Aparelho sem espaço ou em aba privada: as preferências valem só nesta
    // sessão. Não vale interromper quem está programando por causa disso.
  }
}
