"use client";

import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";

export interface MetaDoDia { id:string; title:string; period:"DAILY"|"WEEKLY"|"MONTHLY"; type:"PERFECT_LESSONS"|"XP_EARNED"|"LESSONS_COMPLETED"|"DAILY_MINUTES"; target:number; coinReward:number; current:number; completed:boolean; claimable:boolean; isRankJourney?: boolean; }
export interface MissaoEspecial { id:string; title:string; description:string; icon:"rank"|"unit"|"secret"|"achievement"; current:number; target:number; completed:boolean; secret?:boolean; unavailable?:boolean; rewardLabel?:string; }

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
export function useMetasDiarias(): { metas: MetaDoDia[]; especiais: MissaoEspecial[]; conectada: boolean; carregando: boolean; resgatar: (id: string) => Promise<number> } {
  const [metas, setMetas] = useState<MetaDoDia[]>([]); const [especiais, setEspeciais] = useState<MissaoEspecial[]>([]); const [conectada, setConectada] = useState(false);
  // Comeca carregando, e nao vazio: sao duas chamadas a rede, e sem isso a
  // tela pisca "nenhuma meta hoje" antes de os dados chegarem.
  const [carregando, setCarregando] = useState(true);
  const carregar = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [normal, special] = await Promise.all([
        fetchComTimeout(`${API_BASE_URL}/goals`, { headers }),
        fetchComTimeout(`${API_BASE_URL}/goals/special`, { headers }),
      ]);
      if (!normal.ok || !special.ok) throw new Error("Falha ao carregar metas");
      const [data, missions] = await Promise.all([normal.json(), special.json()]);
      setMetas(data);
      setEspeciais(missions);
      setConectada(true);
    } catch {
      setConectada(false);
    } finally {
      setCarregando(false);
    }
  }, []);
  useEffect(() => { void carregar(); }, [carregar]);
  const resgatar = useCallback(async (id: string) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return 0;
    try {
      const res = await fetchComTimeout(`${API_BASE_URL}/goals/${id}/claim`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return 0;
      const data = await res.json();
      const ganho = data.coinsEarned ?? 0;
      setMetas((atuais) => atuais.map((meta) => meta.id === id ? { ...meta, completed: true, claimable: false } : meta));
      if (ganho > 0) window.dispatchEvent(new CustomEvent("zulcode:moedas", { detail: ganho }));
      void carregar();
      return ganho;
    } catch {
      return 0;
    }
  }, [carregar]);
  return { metas, especiais, conectada, carregando, resgatar };
}
