"use client";

import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";

export interface MetaDoDia { id:string; title:string; period:"DAILY"|"WEEKLY"|"MONTHLY"; type:"PERFECT_LESSONS"|"XP_EARNED"|"LESSONS_COMPLETED"; target:number; coinReward:number; current:number; completed:boolean; claimable:boolean; }

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
export function useMetasDiarias(): { metas: MetaDoDia[]; conectada: boolean; resgatar: (id: string) => Promise<number> } {
  const [metas, setMetas] = useState<MetaDoDia[]>([]); const [conectada, setConectada] = useState(false);
  const carregar = useCallback(() => { const token=localStorage.getItem("accessToken"); if (!token) return; fetchComTimeout(`${API_BASE_URL}/goals`, { headers:{ Authorization:`Bearer ${token}` } }).then(r=>r.ok?r.json():[]).then(data=>{setMetas(data);setConectada(true)}).catch(()=>setConectada(false)); }, []);
  useEffect(carregar, [carregar]);
  const resgatar = useCallback(async (id:string) => { const token=localStorage.getItem("accessToken"); if (!token) return 0; const res=await fetchComTimeout(`${API_BASE_URL}/goals/${id}/claim`,{method:"POST",headers:{Authorization:`Bearer ${token}`}}); if(!res.ok)return 0; const data=await res.json(); const ganho=data.coinsEarned ?? 0; if (ganho > 0) window.dispatchEvent(new CustomEvent("zulcode:moedas", { detail: ganho })); carregar(); return ganho; },[carregar]);
  return { metas, conectada, resgatar };
}
