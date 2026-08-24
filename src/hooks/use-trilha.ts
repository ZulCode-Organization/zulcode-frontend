"use client";

import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";
import { EstadoLicao, UnidadeTrilha } from "@/lib/types/trilha";

interface LicaoTrack {
  id: string;
  title: string;
  xpReward: number;
  completed: boolean;
  theoryCompleted: boolean;
  stageCount?: number;
  completedStages?: number;
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
      const totalEtapas = Math.max(1, licao.stageCount ?? 2);
      const feitas = licao.completed ? totalEtapas : Math.min(totalEtapas, licao.completedStages ?? (licao.theoryCompleted ? 1 : 0));
      return { id: licao.id, titulo: licao.title, subtitulo: `${feitas}/${totalEtapas} etapas`, xp: licao.xpReward, estado };
    }),
  }));
}

function getToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
}

interface TrilhaCache {
  /** Dono do cache — token + linguagem. Trocar de conta ou de idioma
   * invalida o cache em vez de vazar dado errado. */
  token: string;
  languageSlug: string;
  unidades: UnidadeTrilha[];
}

/**
 * Cache em memória do módulo, no mesmo espírito do usePerfil: cada troca de
 * tela remonta o componente que usa useTrilha do zero, então sem esse cache
 * a Jornada rebuscava GET /track (e mostrava o esqueleto de novo) toda vez
 * que a pessoa saía e voltava pra ela. Só se perde num reload de página de
 * verdade, ou quando alguém chama limparTrilhaCache().
 */
let trilhaCache: TrilhaCache | null = null;

function cacheValidoPara(token: string | null, languageSlug: string): boolean {
  return !!token && trilhaCache?.token === token && trilhaCache?.languageSlug === languageSlug;
}

/** Chamado depois de concluir uma lição de verdade (o estado "atual" /
 * "bloqueada" muda) e no logout — sem isso, a tela seguinte reaproveitaria
 * o cache antigo e mostraria a trilha desatualizada. */
export function limparTrilhaCache() {
  trilhaCache = null;
}

/** Busca a trilha de verdade do backend pra uma linguagem, cacheada em
 * memória entre navegações — só busca de novo se o cache não existir, for
 * de outra conta/idioma, ou alguém pedir explicitamente (retry ou depois de
 * concluir uma lição). */
export function useTrilha(languageSlug: string, enabled: boolean = true) {
  const cacheOk = enabled && cacheValidoPara(getToken(), languageSlug);
  const [state, setState] = useState<TrilhaState>(
    cacheOk ? { loading: false, error: false, unidades: trilhaCache!.unidades } : { loading: enabled, error: false, unidades: [] }
  );

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
      .then((track: TrackResponse) => {
        const unidades = montarUnidades(track);
        trilhaCache = { token, languageSlug, unidades };
        setState({ loading: false, error: false, unidades });
      })
      .catch(() => setState({ loading: false, error: true, unidades: [] }));
  }, [languageSlug, enabled]);

  useEffect(() => {
    // Ao voltar para a Jornada o hook é montado de novo. Nesse caso o estado
    // inicia vazio, mas o cache pode existir: além de evitar a requisição,
    // é obrigatório reidratar o estado com ele. Antes só retornávamos aqui,
    // deixando a tela com `loading: false` e nenhuma unidade.
    if (cacheValidoPara(getToken(), languageSlug) && trilhaCache) {
      setState({ loading: false, error: false, unidades: trilhaCache.unidades });
      return;
    }
    load();
  }, [load, languageSlug]);

  return { ...state, retry: load };
}
