import { DIVISOES, divisaoDoXp } from "@/lib/divisoes";
import type { Barril } from "@/lib/barril";

/** Como a ofensiva mudou com a lição. Só vem na primeira lição do dia. */
export interface OfensivaDoDia {
  antes: number;
  depois: number;
  /** Um protetor (gás ou o do PRO) segurou o dia que faltou. */
  protegida: boolean;
}

/** Uma conquista recém-desbloqueada. O desenho sai do id (estiloDaConquista). */
export interface ConquistaNova {
  id: string;
  title: string;
  description: string;
  coins: number;
}

/** O que POST /lessons/:id/complete devolve e o fim da lição usa. */
export interface ResultadoDaLicao {
  xpEarned: number;
  totalXp?: number;
  ofensiva?: OfensivaDoDia | null;
  conquistas?: ConquistaNova[];
  /** O barril do marco da ofensiva (7, 30, 100 ou 365 dias), ainda fechado. */
  barril?: Barril | null;
}

export type Comemoracao =
  | { tipo: "ofensiva"; ofensiva: OfensivaDoDia }
  | { tipo: "divisao"; divisaoId: string }
  | { tipo: "conquista"; conquista: ConquistaNova }
  | { tipo: "barril"; barril: Barril };

/**
 * As telas cheias depois de uma lição, na ordem em que aparecem: primeiro a
 * ofensiva (é o que a pessoa sente todo dia), o barril do marco dela, depois
 * a divisão nova e, por fim, cada conquista. Nada para comemorar, lista vazia — e a lição vai direto
 * para a trilha.
 */
export function comemoracoesDaLicao(resultado: ResultadoDaLicao | null): Comemoracao[] {
  if (!resultado) return [];
  const lista: Comemoracao[] = [];
  if (resultado.ofensiva && resultado.ofensiva.depois > 0) lista.push({ tipo: "ofensiva", ofensiva: resultado.ofensiva });
  if (resultado.barril) lista.push({ tipo: "barril", barril: resultado.barril });
  if (typeof resultado.totalXp === "number" && resultado.xpEarned > 0) {
    const antes = divisaoDoXp(resultado.totalXp - resultado.xpEarned);
    const depois = divisaoDoXp(resultado.totalXp);
    if (DIVISOES.indexOf(depois) > DIVISOES.indexOf(antes)) lista.push({ tipo: "divisao", divisaoId: depois.id });
  }
  for (const conquista of resultado.conquistas ?? []) lista.push({ tipo: "conquista", conquista });
  return lista;
}
