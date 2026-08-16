/**
 * Progresso local das lições que só existem no mock (79 das 80 da trilha —
 * o backend hoje só tem 1 lição semeada de verdade). Sem isso, reabrir o
 * app perderia o avanço nelas a cada sessão, e a trilha nunca desbloquearia
 * a lição 2, 3, 4... Guardado por conta (chave inclui o id estável do
 * usuário — não o token cru, que muda a cada login), então cada conta só
 * enxerga o próprio progresso, e ele sobrevive a logout/login de novo.
 */

import { idEstavelDoToken } from "./auth-token";

const PREFIXO_CHAVE = "zulcode:progresso-mock";

function chave(token: string): string {
  return `${PREFIXO_CHAVE}:${idEstavelDoToken(token)}`;
}

export function lerLicoesConcluidasLocal(token: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const bruto = localStorage.getItem(chave(token));
    return new Set(bruto ? (JSON.parse(bruto) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function marcarLicaoConcluidaLocal(token: string, licaoId: string): void {
  if (typeof window === "undefined") return;
  const atuais = lerLicoesConcluidasLocal(token);
  if (atuais.has(licaoId)) return;

  atuais.add(licaoId);
  try {
    localStorage.setItem(chave(token), JSON.stringify([...atuais]));
  } catch {
    // localStorage indisponível (aba anônima cheia, modo restrito etc.) —
    // o progresso local só não persiste entre sessões; não deve quebrar a tela.
  }
}
