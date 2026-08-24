"use client";

import { useCallback, useEffect, useState } from "react";
import { UnidadeTrilha } from "@/lib/types/trilha";
import { limparTrilhaCache, useTrilha } from "./use-trilha";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";

export interface CursoDaJornada { id: string; name: string; icon: string; }

/**
 * Monta a Jornada completa (80 lições) combinando duas fontes de verdade:
 * progresso local pra 79 lições que só existem no mock, e o estado real do
 * backend pra a única que existe de fato. O estado de cada nó (atual /
 * bloqueada / concluida) é sempre calculado, nunca lido de um campo
 * hardcoded — é isso que garante que a lição 2 só libera depois que a 1ª
 * é concluída de verdade, em toda a trilha, não só na lição conectada.
 */
export function useJornada() {
  // Não assume JavaScript: em um reload isso iniciava uma requisição e
  // renderizava a trilha errada antes de a API responder o curso do usuário.
  const [cursoAtual, setCursoAtual] = useState<string | null>(null);
  const [cursos, setCursos] = useState<CursoDaJornada[]>([]);
  const [carregandoCurso, setCarregandoCurso] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) { setCarregandoCurso(false); return; }
    Promise.all([
      fetchComTimeout(`${API_BASE_URL}/languages`).then(r => r.json()),
      fetchComTimeout(`${API_BASE_URL}/languages/current`, { headers: { Authorization: `Bearer ${token}` } }).then(async r => {
        if (!r.ok || r.status === 204) return null;
        const body = await r.text();
        return body ? JSON.parse(body) : null;
      }),
    ]).then(([available, current]) => {
      setCursos(available);
      setCursoAtual(current?.id ?? available[0]?.id ?? null);
    }).catch(() => setCursoAtual(null)).finally(() => setCarregandoCurso(false));
  }, []);
  const trilhaReal = useTrilha(cursoAtual ?? "", !!cursoAtual);

  const marcarConcluidaLocal = useCallback((_licaoId: string) => undefined, []);
  const selecionarCurso = useCallback(async (slug: string) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    const res = await fetchComTimeout(`${API_BASE_URL}/languages/${slug}/current`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { limparTrilhaCache(); setCursoAtual(slug); }
  }, []);

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
