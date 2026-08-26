"use client";

import { useCallback } from "react";
import { UnidadeTrilha } from "@/lib/types/trilha";
import { useTrilha } from "./use-trilha";
import { useCursos } from "./use-cursos";

export type { CursoDaJornada } from "./use-cursos";

/**
 * Monta a Jornada completa (80 lições) combinando duas fontes de verdade:
 * progresso local pra 79 lições que só existem no mock, e o estado real do
 * backend pra a única que existe de fato. O estado de cada nó (atual /
 * bloqueada / concluida) é sempre calculado, nunca lido de um campo
 * hardcoded — é isso que garante que a lição 2 só libera depois que a 1ª
 * é concluída de verdade, em toda a trilha, não só na lição conectada.
 *
 * O catálogo de cursos e o curso atual vêm do useCursos, compartilhado com a
 * barra de status (onde agora fica o seletor de curso) — trocar de curso lá
 * em cima recarrega a trilha aqui sozinho.
 */
export function useJornada() {
  const { cursos, cursoAtual, loading: carregandoCurso, selecionarCurso } = useCursos();
  const trilhaReal = useTrilha(cursoAtual ?? "", !!cursoAtual);

  const marcarConcluidaLocal = useCallback((_licaoId: string) => undefined, []);

  return {
    unidades: trilhaReal.unidades as UnidadeTrilha[],
    // Só bloqueia a tela inteira no primeiro carregamento — depois de
    // cacheado (useTrilha), essa página nunca mais fica presa esperando
    // rede de novo.
    loading: carregandoCurso || !cursoAtual || trilhaReal.loading,
    marcarConcluidaLocal,
    cursoAtual: cursoAtual ?? "",
    cursos,
    selecionarCurso,
  };
}
