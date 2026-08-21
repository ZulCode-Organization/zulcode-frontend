"use client";

import { Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { usePerfil } from "@/hooks/use-perfil";
import { AppShell } from "@/components/app-shell/app-shell";
import { SideFooter } from "@/components/shared/side-footer";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";

const DIVISOES = [
  { id: "bronze", nome: "Bronze", cor: "bg-[#C08457]", minXp: 0, tamanho: 56 },
  { id: "prata", nome: "Prata", cor: "bg-slate-300", minXp: 300, tamanho: 56 },
  { id: "ouro", nome: "Ouro", cor: "bg-amber-400", minXp: 1000, tamanho: 56 },
  { id: "platina", nome: "Platina", cor: "bg-emerald-500", minXp: 3000, tamanho: 56 },
  { id: "diamante", nome: "Diamante", cor: "bg-sky-500", minXp: 6000, tamanho: 56 },
  { id: "mestre", nome: "Mestre", cor: "bg-rose-400", minXp: 10000, tamanho: 56 },
];
const RANK_IDS: Record<string, string> = { bronze: "BRONZE", prata: "SILVER", ouro: "GOLD", platina: "PLATINUM", diamante: "DIAMOND", mestre: "MASTER" };

function LideresContent() {
  const { perfil } = usePerfil(); const xp = perfil?.xp ?? 0;
  const atual = [...DIVISOES].reverse().find(divisao => xp >= divisao.minXp) ?? DIVISOES[0];
  const [ligaSelecionada, setLigaSelecionada] = useState(RANK_IDS[atual.id]);
  const [ranking, setRanking] = useState<{ entries:{rank:number;id:string;name:string;xp:number;level:number;levelLabel:string}[];me:{rank:number|null;league:string;xp:number;level:number;levelLabel:string} } | null>(null);
  useEffect(() => { const token=localStorage.getItem("accessToken"); if(!token)return; fetchComTimeout(`${API_BASE_URL}/leaderboard?league=${ligaSelecionada}`,{headers:{Authorization:`Bearer ${token}`}}).then(res=>res.ok?res.json():null).then(setRanking).catch(()=>setRanking(null)); },[ligaSelecionada]);
  const proxima = DIVISOES.find(divisao => divisao.minXp > xp) ?? null;
  const falta = proxima ? proxima.minXp - xp : 0;
  const pct = proxima ? Math.round(((xp - atual.minXp) / (proxima.minXp - atual.minXp)) * 100) : 100;
  const divisaoSelecionada = DIVISOES.find(d=>RANK_IDS[d.id]===ligaSelecionada) ?? atual;
  const nomeLiga = divisaoSelecionada.nome;
  const alvo = divisaoSelecionada.minXp > atual.minXp ? divisaoSelecionada : proxima;
  const faltaAlvo = alvo ? Math.max(0, alvo.minXp - xp) : 0;
  const pctAlvo = alvo ? Math.round(((xp - atual.minXp) / Math.max(1, alvo.minXp - atual.minXp)) * 100) : 100;
  return <div className="mx-auto max-w-[640px] pt-3"><div className="flex origin-top scale-[0.72] flex-wrap items-end justify-center gap-3 sm:scale-100">{DIVISOES.map(divisao=>{const id=RANK_IDS[divisao.id];const selecionada=id===ligaSelecionada;return <button key={divisao.id} onClick={()=>setLigaSelecionada(id)} title={`Ver liga ${divisao.nome}`} style={{width:selecionada?divisao.tamanho+14:divisao.tamanho,height:selecionada?divisao.tamanho+14:divisao.tamanho}} className={`flex items-center justify-center rounded-[16px_16px_26px_26px] shadow-[inset_0_-4px_0_rgba(0,0,0,.18)] transition-all duration-200 hover:-translate-y-1 hover:brightness-110 ${selecionada?`${divisao.cor} ring-2 ring-primary/40`:'bg-muted'}`}><Trophy className={`${selecionada?'size-8':'size-6.5'} transition-all duration-200 ${selecionada?'text-white/90':'text-muted-foreground/60'}`}/></button>})}</div><div className="-mt-2 text-center sm:mt-5"><h1 className="text-xl font-black text-foreground sm:text-2xl">Divisão {nomeLiga}</h1><p className="mt-2 text-[.88rem] text-muted-foreground">{alvo?`Faltam ${faltaAlvo} XP para chegar à divisão ${alvo.nome}.`:'Você alcançou a divisão Mestre!'}</p></div><div className="my-4 h-px bg-border"/><div className="rounded-[20px] border border-border bg-card p-4 sm:p-6"><div className="flex items-center justify-between gap-3 text-sm font-extrabold"><span>Do seu elo {atual.nome} até {alvo?.nome ?? 'Mestre'}</span><span className="text-primary">{xp} XP{alvo?` / ${alvo.minXp} XP`:''}</span></div><div className="mt-3 h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{width:`${Math.max(0,Math.min(100,pctAlvo))}%`}}/></div><p className="mt-4 text-sm leading-relaxed text-muted-foreground">{alvo?`Você precisa de mais ${faltaAlvo} XP para desbloquear ${alvo.nome}.`:'Você está no elo máximo.'}</p></div><div className="mt-5 rounded-[20px] border border-border bg-card p-3"><h2 className="px-2 pb-2 text-lg font-black">Ranking</h2>{ranking?.entries.map(item=><div key={item.id} className="flex items-center gap-3 border-t border-border px-2 py-3"><span className="w-8 font-black text-primary">#{item.rank}</span><div className="min-w-0 flex-1"><p className="truncate font-black">{item.name}</p><p className="text-xs text-muted-foreground">Nível {item.level} · {item.levelLabel}</p></div><span className="font-black text-amber-500">{item.xp} XP</span></div>)}{ranking?.me.rank&&ranking.me.rank>15&&<div className="mt-3 rounded-xl bg-primary/10 p-3 font-black text-primary">Sua posição: #{ranking.me.rank}</div>}{ranking&&!ranking.entries.length&&<p className="p-6 text-center text-sm text-muted-foreground">Ninguém chegou à liga {nomeLiga} ainda.</p>}</div></div>
}
export default function TabelaLideresPage(){useRequireAuth();return <AppShell rightPanel={<SideFooter/>}><LideresContent/></AppShell>}
