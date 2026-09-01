"use client";

import Link from "next/link";
import { Search, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { usePerfil } from "@/hooks/use-perfil";
import { AppShell } from "@/components/app-shell/app-shell";
import { SideFooter } from "@/components/shared/side-footer";
import { UserAvatar } from "@/components/shared/user-avatar";
import { SeloVerificado } from "@/components/shared/selo-verificado";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";
import { cn } from "@/lib/utils";
import { AvatarComStatus, EscolhaDeStatus, FolhaDeStatus, statusPorId, useStatusEscolhido } from "@/components/lideres/escolha-status";

const DIVISOES = [{ id: "bronze", nome: "Bronze", cor: "bg-[#C08457]", minXp: 0 }, { id: "prata", nome: "Prata", cor: "bg-slate-300", minXp: 300 }, { id: "ouro", nome: "Ouro", cor: "bg-amber-400", minXp: 1000 }, { id: "platina", nome: "Platina", cor: "bg-emerald-500", minXp: 3000 }, { id: "diamante", nome: "Diamante", cor: "bg-sky-500", minXp: 6000 }, { id: "mestre", nome: "Mestre", cor: "bg-rose-400", minXp: 10000 }];
const RANK_IDS: Record<string, string> = { bronze: "BRONZE", prata: "SILVER", ouro: "GOLD", platina: "PLATINUM", diamante: "DIAMOND", mestre: "MASTER" };
type RankEntry = { rank: number; id: string; name: string; avatarId?: string; bannerColor?: string | null; statusId?: string | null; isVerified?: boolean; xp: number; level: number; levelLabel: string };
type UsuarioBusca = { id: string; name: string; publicCode: string; avatarId?: string; bannerColor?: string | null; isVerified?: boolean; level: number };

/** Avatar redondo e sem anel, como na referência — o formato padrão do
 * UserAvatar (quadrado arredondado com anel) continua valendo no resto do app. */
const AVATAR_REDONDO = "[&>div]:rounded-full [&>div]:ring-0";

function PesquisaLideres() {
  const [q, setQ] = useState(""); const [resultados, setResultados] = useState<UsuarioBusca[]>([]);
  useEffect(() => { const token = localStorage.getItem("accessToken"); if (!token || q.trim().length < 2) { setResultados([]); return; } const timer = window.setTimeout(() => fetchComTimeout(`${API_BASE_URL}/leaderboard/search?q=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []).then(setResultados), 250); return () => clearTimeout(timer); }, [q]);
  return <aside className="rounded-[20px] border border-border bg-card p-5"><h2 className="flex items-center gap-2 font-black"><Search className="size-4 text-primary" />Encontrar usuário</h2><p className="mt-2 text-sm text-muted-foreground">Busque por nome ou código, como #123456.</p><input value={q} onChange={e => setQ(e.target.value)} placeholder="Nome ou #123456" className="mt-4 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />{resultados.length > 0 && <div className="mt-3 divide-y divide-border">{resultados.map(user => <Link key={user.id} href={`/perfil/${user.id}`} className="flex items-center gap-3 py-3"><UserAvatar iniciais={user.name.slice(0,2).toUpperCase()} avatarId={user.avatarId} bannerColor={user.bannerColor} size="sm"/><span className="min-w-0"><b className="block truncate text-sm">{user.name}{user.isVerified && <SeloVerificado className="ml-1 text-[0.85rem]" />}</b><span className="text-xs text-muted-foreground">#{user.publicCode} · Nível {user.level}</span></span></Link>)}</div>}</aside>;
}

/**
 * Posição na lista. Do 4º em diante é só o número; o pódio ganha a fitinha
 * com a ponta recortada embaixo, como na referência.
 */
const CORES_DO_PODIO = ["bg-amber-400 text-amber-950", "bg-slate-300 text-slate-800", "bg-[#C08457] text-white"];

function Posicao({ rank }: { rank: number }) {
  if (rank > CORES_DO_PODIO.length) {
    return <span className="w-9 shrink-0 text-center text-[0.95rem] font-black text-emerald-500">{rank}</span>;
  }
  return (
    <span className="flex w-9 shrink-0 justify-center">
      <span
        className={cn("flex h-8 w-6 justify-center rounded-t-[5px] pt-1 text-xs font-black", CORES_DO_PODIO[rank - 1])}
        // A ponta em V no pé da fitinha.
        style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 72%, 0 100%)" }}
      >
        {rank}
      </span>
    </span>
  );
}

function LideresContent() {
  const { perfil } = usePerfil();
  const xp = perfil?.xp ?? 0;
  const atual = [...DIVISOES].reverse().find((divisao) => xp >= divisao.minXp) ?? DIVISOES[0];
  const [ligaSelecionada, setLigaSelecionada] = useState(RANK_IDS[atual.id]);
  const [ranking, setRanking] = useState<{ entries: RankEntry[]; me: { rank: number | null } } | null>(null);
  const { status: meuStatus } = useStatusEscolhido();
  const [folhaAberta, setFolhaAberta] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    fetchComTimeout(`${API_BASE_URL}/leaderboard?league=${ligaSelecionada}`, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.ok ? res.json() : null).then(setRanking).catch(() => setRanking(null));
  }, [ligaSelecionada]);

  const divisao = DIVISOES.find((item) => RANK_IDS[item.id] === ligaSelecionada) ?? atual;
  const alvo = DIVISOES.find((item) => item.minXp > xp) ?? null;
  const faltam = alvo ? Math.max(0, alvo.minXp - xp) : 0;
  const percentual = alvo ? Math.max(0, Math.min(100, Math.round(((xp - atual.minXp) / Math.max(1, alvo.minXp - atual.minXp)) * 100))) : 100;
  const minhaPosicao = ranking?.me.rank ?? null;

  return <div className="mx-auto max-w-[640px] pt-3">
    {/* A busca só existe aqui embaixo de lg: do lg pra cima ela vive no painel
        da direita, e mostrar as duas ao mesmo tempo duplicava o campo. O card
        de status não vem junto — no celular ele é a folha que sobe pelo
        balãozinho, logo abaixo. */}
    <div className="mb-5 lg:hidden"><PesquisaLideres /></div>

    <div className="flex origin-top scale-[0.72] flex-wrap items-end justify-center gap-3 sm:scale-100">{DIVISOES.map((item) => { const selecionada = RANK_IDS[item.id] === ligaSelecionada; return <button type="button" key={item.id} onClick={() => setLigaSelecionada(RANK_IDS[item.id])} className={`flex size-14 items-center justify-center rounded-[16px_16px_26px_26px] shadow-[inset_0_-4px_0_rgba(0,0,0,.18)] transition-all hover:-translate-y-1 ${selecionada ? `${item.cor} scale-110 ring-2 ring-primary/40` : "bg-muted"}`}><Trophy className={selecionada ? "size-8 text-white" : "size-6 text-muted-foreground/60"} /></button>; })}</div>

    {/* Cabeçalho centrado: nome da divisão, a regra de verdade pra subir e a
        sua posição em destaque. */}
    <header className="mt-3 text-center">
      <h1 className="text-2xl font-black tracking-tight sm:text-[1.75rem]">Divisão {divisao.nome}</h1>
      <p className="mx-auto mt-2 max-w-md text-[0.95rem] leading-snug text-muted-foreground">
        {alvo
          ? `Some ${faltam.toLocaleString("pt-BR")} XP pra subir pra divisão ${alvo.nome}.`
          : "Você chegou à divisão Mestre — não há nível acima deste."}
      </p>
      {minhaPosicao !== null && (
        <p className="mt-2 text-sm font-black text-amber-500">
          Sua posição: {minhaPosicao}º
        </p>
      )}
    </header>

    {/* Progresso de XP até a próxima divisão — o número que decide a subida. */}
    <div className="my-5 rounded-[20px] border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3 text-sm font-black">
        <span className="min-w-0 truncate">Do seu elo {atual.nome} até {alvo?.nome ?? "Mestre"}</span>
        <span className="shrink-0 text-primary">{xp.toLocaleString("pt-BR")} XP</span>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${percentual}%` }} />
      </div>
    </div>

    <ul className="mt-1 pb-4">
      {ranking?.entries.map((item, indice) => {
        const souEu = item.id === perfil?.id;
        return (
          <li key={item.id} className="animate-fade-in-up" style={{ animationDelay: `${indice * 30}ms` }}>
            <div
              className={cn(
                "flex items-center gap-4 rounded-2xl px-3 py-2.5 transition-colors duration-150",
                souEu ? "bg-primary/10" : "hover:bg-muted/60"
              )}
            >
              <Posicao rank={item.rank} />

              {/* Todo mundo mostra o balão: o status vem do backend junto de
                  cada pessoa. Na sua própria linha ele também é o botão que
                  abre a folha de escolha no celular — por isso fica fora do
                  link do perfil, e não dentro dele. */}
              {souEu ? (
                <button type="button" onClick={() => setFolhaAberta(true)} aria-label="Escolher o seu status" className="lg:pointer-events-none">
                  <AvatarComStatus status={meuStatus} pequeno vazio>
                    <UserAvatar iniciais={item.name.slice(0, 2).toUpperCase()} avatarId={item.avatarId} bannerColor={item.bannerColor} size="sm" className={AVATAR_REDONDO} />
                  </AvatarComStatus>
                </button>
              ) : (
                <AvatarComStatus status={statusPorId(item.statusId)} pequeno>
                  <UserAvatar iniciais={item.name.slice(0, 2).toUpperCase()} avatarId={item.avatarId} bannerColor={item.bannerColor} size="sm" className={AVATAR_REDONDO} />
                </AvatarComStatus>
              )}

              <Link href={`/perfil/${item.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                <span className={cn("min-w-0 flex-1 truncate text-[0.95rem] font-black", souEu && "text-primary")}>
                  {item.name}{item.isVerified && <SeloVerificado className="ml-1 text-[0.95rem]" />}
                  {souEu && <span className="ml-1.5 text-xs font-black opacity-70">(você)</span>}
                </span>
                <span className={cn("shrink-0 text-[0.95rem] font-black", souEu ? "text-primary" : "text-muted-foreground")}>
                  {item.xp.toLocaleString("pt-BR")} XP
                </span>
              </Link>
            </div>
          </li>
        );
      })}
    </ul>

    {/* A API devolve os 15 primeiros: quem está fora disso vê a própria
        colocação aqui, pra não sumir da tela. */}
    {ranking?.me.rank && ranking.me.rank > ranking.entries.length && (
      <div className="mb-6 rounded-2xl bg-primary/10 px-4 py-3 text-center text-sm font-black text-primary">
        Sua posição: {ranking.me.rank}º
      </div>
    )}

    {folhaAberta && <FolhaDeStatus onClose={() => setFolhaAberta(false)} />}

    {ranking && !ranking.entries.length && (
      <p className="py-10 text-center text-sm text-muted-foreground">Ninguém chegou à divisão {divisao.nome} ainda.</p>
    )}
  </div>;
}

export default function TabelaLideresPage() { useRequireAuth(); return <AppShell rightPanel={<><PesquisaLideres /><EscolhaDeStatus /><SideFooter /></>}><LideresContent /></AppShell>; }
