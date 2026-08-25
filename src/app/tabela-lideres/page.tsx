"use client";

import Link from "next/link";
import { Search, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { usePerfil } from "@/hooks/use-perfil";
import { AppShell } from "@/components/app-shell/app-shell";
import { SideFooter } from "@/components/shared/side-footer";
import { UserAvatar } from "@/components/shared/user-avatar";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";

const DIVISOES = [{ id: "bronze", nome: "Bronze", cor: "bg-[#C08457]", minXp: 0 }, { id: "prata", nome: "Prata", cor: "bg-slate-300", minXp: 300 }, { id: "ouro", nome: "Ouro", cor: "bg-amber-400", minXp: 1000 }, { id: "platina", nome: "Platina", cor: "bg-emerald-500", minXp: 3000 }, { id: "diamante", nome: "Diamante", cor: "bg-sky-500", minXp: 6000 }, { id: "mestre", nome: "Mestre", cor: "bg-rose-400", minXp: 10000 }];
const RANK_IDS: Record<string, string> = { bronze: "BRONZE", prata: "SILVER", ouro: "GOLD", platina: "PLATINUM", diamante: "DIAMOND", mestre: "MASTER" };
type RankEntry = { rank: number; id: string; name: string; avatarId?: string; bannerColor?: string | null; xp: number; level: number; levelLabel: string };

function PesquisaLideres() {
  const [q, setQ] = useState(""); const [resultados, setResultados] = useState<any[]>([]);
  useEffect(() => { const token = localStorage.getItem("accessToken"); if (!token || q.trim().length < 2) { setResultados([]); return; } const timer = window.setTimeout(() => fetchComTimeout(`${API_BASE_URL}/leaderboard/search?q=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []).then(setResultados), 250); return () => clearTimeout(timer); }, [q]);
  return <aside className="rounded-[20px] border border-border bg-card p-5"><h2 className="flex items-center gap-2 font-black"><Search className="size-4 text-primary" />Encontrar usuário</h2><p className="mt-2 text-sm text-muted-foreground">Busque por nome ou código, como #123456.</p><input value={q} onChange={e => setQ(e.target.value)} placeholder="Nome ou #123456" className="mt-4 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />{resultados.length > 0 && <div className="mt-3 divide-y divide-border">{resultados.map(user => <Link key={user.id} href={`/perfil/${user.id}`} className="flex items-center gap-3 py-3"><UserAvatar iniciais={user.name.slice(0,2).toUpperCase()} avatarId={user.avatarId} bannerColor={user.bannerColor} size="sm"/><span className="min-w-0"><b className="block truncate text-sm">{user.name}</b><span className="text-xs text-muted-foreground">#{user.publicCode} · Nível {user.level}</span></span></Link>)}</div>}</aside>;
}

function LideresContent() {
  const { perfil } = usePerfil();
  const xp = perfil?.xp ?? 0;
  const atual = [...DIVISOES].reverse().find((divisao) => xp >= divisao.minXp) ?? DIVISOES[0];
  const [ligaSelecionada, setLigaSelecionada] = useState(RANK_IDS[atual.id]);
  const [ranking, setRanking] = useState<{ entries: RankEntry[]; me: { rank: number | null } } | null>(null);
  const [selecionado, setSelecionado] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    setSelecionado(null);
    fetchComTimeout(`${API_BASE_URL}/leaderboard?league=${ligaSelecionada}`, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.ok ? res.json() : null).then(setRanking).catch(() => setRanking(null));
  }, [ligaSelecionada]);

  const divisao = DIVISOES.find((item) => RANK_IDS[item.id] === ligaSelecionada) ?? atual;
  const alvo = divisao.minXp > atual.minXp ? divisao : DIVISOES.find((item) => item.minXp > xp) ?? null;
  const faltam = alvo ? Math.max(0, alvo.minXp - xp) : 0;
  const percentual = alvo ? Math.max(0, Math.min(100, Math.round(((xp - atual.minXp) / Math.max(1, alvo.minXp - atual.minXp)) * 100))) : 100;

  return <div className="mx-auto max-w-[640px] pt-3">
    <div className="mb-5 xl:hidden"><PesquisaLideres /></div>
    <div className="flex origin-top scale-[0.72] flex-wrap items-end justify-center gap-3 sm:scale-100">{DIVISOES.map((item) => { const selecionada = RANK_IDS[item.id] === ligaSelecionada; return <button type="button" key={item.id} onClick={() => setLigaSelecionada(RANK_IDS[item.id])} className={`flex size-14 items-center justify-center rounded-[16px_16px_26px_26px] shadow-[inset_0_-4px_0_rgba(0,0,0,.18)] transition-all hover:-translate-y-1 ${selecionada ? `${item.cor} scale-110 ring-2 ring-primary/40` : "bg-muted"}`}><Trophy className={selecionada ? "size-8 text-white" : "size-6 text-muted-foreground/60"} /></button>; })}</div>
    <div className="mt-2 text-center"><h1 className="text-2xl font-black">Divisão {divisao.nome}</h1><p className="mt-2 text-sm text-muted-foreground">{alvo ? `Faltam ${faltam} XP para chegar à divisão ${alvo.nome}.` : "Você alcançou a divisão Mestre!"}</p></div>
    <div className="my-5 rounded-[20px] border border-border bg-card p-5"><div className="flex justify-between text-sm font-black"><span>Do seu elo {atual.nome} até {alvo?.nome ?? "Mestre"}</span><span className="text-primary">{xp} XP</span></div><div className="mt-3 h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${percentual}%` }} /></div></div>
    <div className="rounded-[20px] border border-border bg-card p-3"><h2 className="px-2 pb-2 text-lg font-black">Ranking</h2>{ranking?.entries.map((item) => { const souEu = item.id === perfil?.id; return <div key={item.id} className="border-t border-border">{souEu ? <div className="flex w-full items-center gap-3 bg-primary/5 px-2 py-3"><span className="w-8 font-black text-primary">#{item.rank}</span><UserAvatar iniciais={item.name.slice(0, 2).toUpperCase()} avatarId={item.avatarId} bannerColor={item.bannerColor} size="sm" /><div className="min-w-0 flex-1"><p className="truncate font-black">{item.name} <span className="text-xs text-primary">(você)</span></p><p className="text-xs text-muted-foreground">Nível {item.level} · {item.levelLabel}</p></div><span className="font-black text-amber-500">{item.xp} XP</span></div> : <><button type="button" onClick={() => setSelecionado((selecionadoAtual) => selecionadoAtual === item.id ? null : item.id)} className="flex w-full items-center gap-3 px-2 py-3 text-left transition-colors hover:bg-muted/50"><span className="w-8 font-black text-primary">#{item.rank}</span><UserAvatar iniciais={item.name.slice(0, 2).toUpperCase()} avatarId={item.avatarId} bannerColor={item.bannerColor} size="sm" /><div className="min-w-0 flex-1"><p className="truncate font-black">{item.name}</p><p className="text-xs text-muted-foreground">Nível {item.level} · {item.levelLabel}</p></div><span className="font-black text-amber-500">{item.xp} XP</span></button>{selecionado === item.id && <div className="px-2 pb-3 pl-[76px]"><Link href={`/perfil/${item.id}`} className="inline-flex rounded-xl bg-primary px-3 py-2 text-xs font-black text-primary-foreground">Abrir perfil</Link></div>}</>}</div>; })}{ranking?.me.rank && ranking.me.rank > 15 && <div className="mt-3 rounded-xl bg-primary/10 p-3 font-black text-primary">Sua posição: #{ranking.me.rank}</div>}{ranking && !ranking.entries.length && <p className="p-6 text-center text-sm text-muted-foreground">Ninguém chegou à liga {divisao.nome} ainda.</p>}</div>
  </div>;
}

export default function TabelaLideresPage() { useRequireAuth(); return <AppShell rightPanel={<><PesquisaLideres /><SideFooter /></>}><LideresContent /></AppShell>; }
