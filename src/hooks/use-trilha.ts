"use client";

import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";
import { EstadoLicao, UnidadeTrilha } from "@/lib/types/trilha";

interface LicaoTrack {
  id: string;
  title: string;
  xpReward: number;
  completed: boolean;
}

interface UnidadeTrack {
  id: string;
  title: string;
  lessons: LicaoTrack[];
}

interface TrackResponse {
  units: UnidadeTrack[];
}

interface TrilhaState {
  loading: boolean;
  error: boolean;
  unidades: UnidadeTrilha[];
}

/**
 * GET /languages/:slug/track já devolve, por lição, se ela está `completed`
 * — é a única fonte de verdade pro estado visual de cada nó, sem nada
 * inventado no front: a primeira lição não concluída vira "atual", tudo
 * depois dela fica "bloqueada" (é assim que a 2ª lição só libera depois da
 * 1ª feita de verdade) e o que já foi feito vira "concluida". Quando o
 * backend tiver mais lições semeadas, essa mesma lógica escala sozinha, sem
 * precisar mexer aqui.
 */
function montarUnidades(track: TrackResponse): UnidadeTrilha[] {
  let jaAchouAtual = false;

  return (track.units ?? []).map((unidade, unidadeIndex) => ({
    id: unidade.id,
    secao: 1,
    unidade: unidadeIndex + 1,
    titulo: unidade.title,
    duracaoEstimada: "",
    licoes: (unidade.lessons ?? []).map((licao) => {
      let estado: EstadoLicao;
      if (licao.completed) {
        estado = "concluida";
      } else if (!jaAchouAtual) {
        estado = "atual";
        jaAchouAtual = true;
      } else {
        estado = "bloqueada";
      }
      return { id: licao.id, titulo: licao.title, subtitulo: "", xp: licao.xpReward, estado };
    }),
  }));
}

function getToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
}

/**
 * Busca a trilha de verdade do backend pra uma linguagem. Sem cache em
 * memória (diferente do usePerfil): só a Jornada usa esse dado, e ele muda a
 * cada lição concluída — melhor buscar de novo a cada visita do que arriscar
 * mostrar um "bloqueada"/"atual" desatualizado.
 */
export function useTrilha(languageSlug: string, enabled: boolean = true) {
  const [state, setState] = useState<TrilhaState>({ loading: enabled, error: false, unidades: [] });

  const load = useCallback(() => {
    if (!enabled) return;
    const token = getToken();
    if (!token) {
      setState({ loading: false, error: true, unidades: [] });
      return;
    }

    setState((atual) => ({ ...atual, loading: true, error: false }));

    fetchComTimeout(`${API_BASE_URL}/languages/${languageSlug}/track`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Falha ao buscar trilha");
        return res.json();
      })
      .then((track: TrackResponse) => setState({ loading: false, error: false, unidades: montarUnidades(track) }))
      .catch(() => setState({ loading: false, error: true, unidades: [] }));
  }, [languageSlug, enabled]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, retry: load };
}
