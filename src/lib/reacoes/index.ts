"use client";

import { prepararSons, tocar, type Som } from "./sons";
import { vibrar, type Vibracao } from "./vibrar";

/**
 * Como o app responde a cada momento: o som e a vibração juntos, sempre os
 * mesmos para o mesmo momento. Quem chama diz o que aconteceu ("acerto"), não
 * qual som tocar — assim trocar um som muda o app inteiro de uma vez.
 *
 * As duas metades respeitam as Configurações (som e vibração ligam e desligam
 * separados).
 */
export type Momento =
  | "toque"
  | "acerto"
  | "erro"
  | "licaoConcluida"
  | "ofensiva"
  | "rupees"
  | "compra"
  | "perdaDePena"
  | "conquista"
  | "nivel";

const MOMENTOS: Record<Momento, { som: Som; vibracao?: Vibracao }> = {
  toque: { som: "toque", vibracao: "toque" },
  acerto: { som: "acerto", vibracao: "acerto" },
  erro: { som: "erro", vibracao: "erro" },
  licaoConcluida: { som: "licaoConcluida", vibracao: "comemoracao" },
  ofensiva: { som: "ofensiva", vibracao: "impacto" },
  // As rupees chegam várias vezes por sessão; vibrar a cada uma cansa.
  rupees: { som: "rupees" },
  compra: { som: "compra", vibracao: "acerto" },
  perdaDePena: { som: "perdaDePena", vibracao: "erro" },
  conquista: { som: "conquista", vibracao: "comemoracao" },
  nivel: { som: "nivel", vibracao: "comemoracao" },
};

/** Até quando cada momento fica em silêncio (ver `silenciar`). */
const silenciosAte = new Map<Momento, number>();

/**
 * Cala um momento por um tempo. Serve para a mesma festa não tocar duas
 * vezes: depois da tela cheia da ofensiva, a chama da barra pula de novo ao
 * voltar para a trilha, e o som repetido soaria como erro.
 */
export function silenciar(momento: Momento, milissegundos: number) {
  silenciosAte.set(momento, Date.now() + milissegundos);
}

export function reagir(momento: Momento) {
  if ((silenciosAte.get(momento) ?? 0) > Date.now()) return;
  const { som, vibracao } = MOMENTOS[momento];
  void tocar(som);
  if (vibracao) void vibrar(vibracao);
}

/** Deixa os sons de uma tela prontos antes de serem usados. */
export function prepararReacoes(...momentos: Momento[]) {
  prepararSons(...momentos.map((m) => MOMENTOS[m].som));
}
