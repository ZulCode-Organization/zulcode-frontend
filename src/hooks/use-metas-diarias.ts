"use client";

import { MetaDiaria, metasDiarias } from "@/data/painel-lateral";
import { usePerfil } from "./use-perfil";

export interface MetaDoDia extends MetaDiaria {
  /** Quanto já foi feito hoje. null = a API ainda não conta isso. */
  atual: number | null;
}

/**
 * Casa cada meta do dia com o dado real do perfil.
 *
 * Hoje o GET /user só devolve totais (xp acumulado, streak, desafios
 * completos) — nada recortado por dia. Enquanto os campos do dia não
 * existirem, `atual` fica null e a tela mostra a barra zerada avisando que a
 * contagem não está ligada, em vez de inventar progresso. Quando o backend
 * mandar `xpHoje` e `licoesHoje`, estas duas metas passam a valer sozinhas.
 *
 * "Resolver 3 desafios na primeira tentativa" depende de acerto por questão,
 * que não existe em lugar nenhum da API — essa continua sem fonte.
 */
export function useMetasDiarias(): { metas: MetaDoDia[]; conectada: boolean } {
  const { perfil } = usePerfil();

  const porMeta: Record<string, number | null> = {
    ganhar_xp: perfil?.xpHoje ?? null,
    completar_licoes: perfil?.licoesHoje ?? null,
    primeira_tentativa: null,
  };

  const metas = metasDiarias.map((meta) => ({ ...meta, atual: porMeta[meta.id] ?? null }));

  return { metas, conectada: metas.some((meta) => meta.atual !== null) };
}
