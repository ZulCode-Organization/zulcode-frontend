"use client";

import { useCallback } from "react";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";
import { envelhecerGuardado, mudarGuardado, useDadosGuardados } from "@/lib/dados-guardados";

export interface MetaDoDia { id:string; title:string; period:"DAILY"|"WEEKLY"|"MONTHLY"; type:"PERFECT_LESSONS"|"XP_EARNED"|"LESSONS_COMPLETED"|"DAILY_MINUTES"; target:number; coinReward:number; current:number; completed:boolean; claimable:boolean; isRankJourney?: boolean; }
export interface MissaoEspecial { id:string; title:string; description:string; icon:"rank"|"unit"|"secret"|"achievement"; current:number; target:number; completed:boolean; secret?:boolean; unavailable?:boolean; rewardLabel?:string; }

type Metas = { metas: MetaDoDia[]; especiais: MissaoEspecial[] };

const CHAVE = "metas";
const SEM_METAS: MetaDoDia[] = [];
const SEM_ESPECIAIS: MissaoEspecial[] = [];

async function buscarMetas(token: string): Promise<Metas> {
  const headers = { Authorization: `Bearer ${token}` };
  const [normal, special] = await Promise.all([
    fetchComTimeout(`${API_BASE_URL}/goals`, { headers }),
    fetchComTimeout(`${API_BASE_URL}/goals/special`, { headers }),
  ]);
  if (!normal.ok || !special.ok) throw new Error("Falha ao carregar metas");
  const [metas, especiais] = await Promise.all([normal.json(), special.json()]);
  return { metas: Array.isArray(metas) ? metas : [], especiais: Array.isArray(especiais) ? especiais : [] };
}

/** Depois de concluir uma aula as metas mudam: a próxima tela mostra as de antes e busca as novas por trás. */
export function envelhecerMetas() {
  envelhecerGuardado(CHAVE);
}

/**
 * As metas do dia, com o progresso que o backend já contabiliza.
 *
 * O progresso vem de `userGoalProgress`, incrementado quando uma aula é
 * concluída — não é inferido na tela. O GET /user também devolve `xpHoje`,
 * `licoesHoje` e `minutosHoje`, recortados pelo dia de Brasília, para quem
 * precisar do número solto fora das metas.
 *
 * A barra de cima, o widget da home e a página de metas leem o mesmo lugar
 * (useDadosGuardados): uma busca só, e trocar de tela mostra na hora o que já
 * se sabia, atualizando por trás.
 */
export function useMetasDiarias(): { metas: MetaDoDia[]; especiais: MissaoEspecial[]; conectada: boolean; carregando: boolean; resgatar: (id: string) => Promise<number> } {
  const { dados, carregando, recarregar } = useDadosGuardados(CHAVE, buscarMetas, 20_000);

  const resgatar = useCallback(async (id: string) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return 0;
    try {
      const res = await fetchComTimeout(`${API_BASE_URL}/goals/${id}/claim`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return 0;
      const data = await res.json();
      const ganho = data.coinsEarned ?? 0;
      mudarGuardado<Metas>(CHAVE, (atual) => ({
        metas: (atual?.metas ?? []).map((meta) => (meta.id === id ? { ...meta, completed: true, claimable: false } : meta)),
        especiais: atual?.especiais ?? [],
      }));
      if (ganho > 0) window.dispatchEvent(new CustomEvent("zulcode:moedas", { detail: ganho }));
      void recarregar();
      return ganho;
    } catch {
      return 0;
    }
  }, [recarregar]);

  return {
    metas: dados?.metas ?? SEM_METAS,
    especiais: dados?.especiais ?? SEM_ESPECIAIS,
    conectada: !!dados,
    carregando,
    resgatar,
  };
}
