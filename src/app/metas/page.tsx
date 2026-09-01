"use client";

import { Award, Clock, Coins, Flag, Trophy, Zap } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { AppShell } from "@/components/app-shell/app-shell";
import { SideFooter } from "@/components/shared/side-footer";
import { useMetasDiarias } from "@/hooks/use-metas-diarias";
import { AvisoDemora, EsqueletoMeta } from "@/components/shared/esqueleto";

const PERIODOS = { DAILY: "Diária", WEEKLY: "Semanal", MONTHLY: "Mensal" } as const;
const PERIODOS_PLURAL = { DAILY: "diárias", WEEKLY: "semanais", MONTHLY: "mensais" } as const;

function MetaItem({ meta, index, onClaim }: { meta: ReturnType<typeof useMetasDiarias>["metas"][number]; index: number; onClaim:(id:string)=>void }) {
  // Metas recorrentes sempre pagam moedas: o ícone comunica a recompensa,
  // não a atividade necessária para ganhá-la.
  const Icon = Coins; const cor = "text-amber-500"; const pct = Math.min(100, Math.round((meta.current / meta.target) * 100));
  const concluida = meta.completed;
  return <div className={`flex items-center gap-3 border-b border-border py-4 last:border-b-0 sm:gap-4.5 sm:py-5.5 ${concluida ? "opacity-55 grayscale" : ""}`}>
    <span className={`relative flex size-9 shrink-0 items-center justify-center sm:size-11 ${concluida ? "text-muted-foreground" : cor}`}><Icon className="size-7 sm:size-9" /><span className="absolute -bottom-1 -right-1 grid min-w-5 place-items-center rounded-full bg-amber-400 px-1 py-0.5 text-[0.58rem] font-black leading-none text-amber-950 shadow-sm">+{meta.coinReward}</span></span>
    <div className="min-w-0 flex-1"><p className={`text-[0.92rem] font-extrabold text-foreground text-pretty sm:text-base ${concluida ? "line-through" : ""}`}>{meta.title}</p>{meta.type === "DAILY_MINUTES" && <p className="mt-1 text-xs font-semibold text-muted-foreground">Faltam {Math.max(0, meta.target - meta.current)} min para sua meta de hoje.</p>}<div className="mt-2.5 flex items-center gap-2.5 sm:mt-3 sm:gap-3"><div className="relative h-5 flex-1 overflow-hidden rounded-xl bg-muted sm:h-[22px]"><div className={`absolute inset-y-0 left-0 rounded-xl ${concluida ? "bg-muted-foreground" : cor.replace("text-", "bg-")}`} style={{ width: `${pct}%` }} /><span className="absolute inset-0 flex items-center justify-center text-[0.78rem] font-black text-foreground drop-shadow-[0_1px_0_rgba(255,255,255,0.7)]">{meta.current} / {meta.target}{meta.type === "DAILY_MINUTES" ? " min" : ""}</span></div>{meta.claimable && !meta.isRankJourney && <button onClick={()=>onClaim(meta.id)} className="zc-press zc-press-shadow shrink-0 rounded-xl bg-amber-400 px-3 py-2 text-[0.66rem] font-black uppercase text-amber-950">Resgatar</button>}</div></div>
  </div>;
}

function MetasContent() {
  const { metas, especiais, conectada, carregando, resgatar } = useMetasDiarias();
  const [moedas, setMoedas] = useState(0);
  const [aba, setAba] = useState<"metas"|"especiais">("metas");
  const resgatarMeta = async (id:string) => { const ganho=await resgatar(id); if(ganho){setMoedas(ganho); window.setTimeout(()=>setMoedas(0),1800);} };
  const concluidas = metas.filter((meta) => meta.completed).length;

  return (
    <div className="pt-1">
      <div className="animate-fade-in-up flex flex-wrap items-center gap-4 rounded-3xl bg-primary p-5 text-primary-foreground shadow-lg shadow-primary/20 sm:gap-6 sm:p-7">
        <div className="min-w-[200px] flex-1 basis-65">
          <h1 className="text-xl font-black text-pretty sm:text-2xl">Ganhe recompensas com as metas!</h1>
          <p className="mt-2.5 text-[0.9rem] opacity-90 sm:text-[0.95rem]">
            {conectada ? (
              <>
                Você fez{" "}
                <span className="font-black">
                  {concluidas} de {metas.length}
                </span>{" "}
                metas ativas.
              </>
            ) : (
              <>
                A contagem do dia ainda não vem do servidor, então as metas
                abaixo aparecem zeradas.
              </>
            )}
          </p>
        </div>

        <div className="flex h-[100px] min-w-[90px] max-w-[110px] flex-1 basis-27.5 items-center justify-center p-2 sm:h-[130px] sm:min-w-[120px] sm:max-w-[150px] sm:basis-35">
          <img src="/mascot.png" alt="" className="size-full object-contain" />
        </div>
      </div>
      {moedas > 0 && <div className="animate-pop-in fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-2xl bg-amber-400 px-6 py-3 text-lg font-black text-amber-950 shadow-xl">+{moedas} moedas</div>}

      <div className="mt-7 flex gap-2 border-b border-border"><button onClick={()=>setAba("metas")} className={`px-4 py-3 text-sm font-black ${aba === "metas" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>Metas</button><button onClick={()=>setAba("especiais")} className={`px-4 py-3 text-sm font-black ${aba === "especiais" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>Missões especiais</button></div>
      {carregando ? (
        <section className="mt-5 rounded-[20px] border border-border bg-card px-4">
          {[0, 1, 2, 3].map((i) => <EsqueletoMeta key={i} />)}
          <AvisoDemora>Buscando suas metas… isso pode levar alguns segundos.</AvisoDemora>
        </section>
      ) : aba === "especiais" ? <section className="mt-5"><h2 className="text-lg font-black">Missões especiais</h2><p className="mt-1 text-sm text-muted-foreground">Desafios públicos permanentes que marcam sua jornada. As secretas só aparecem quando você as encontra.</p><div className="mt-3 rounded-[20px] border border-border bg-card px-4">{especiais.map(m => { const Icon=m.icon === "rank" ? Trophy : m.icon === "unit" ? Flag : Award; const pct=Math.min(100,Math.round(m.current/m.target*100)); return <div key={m.id} className={`flex gap-4 border-b border-border py-5 last:border-0 ${m.unavailable ? "opacity-55" : ""}`}><Icon className="mt-1 size-8 shrink-0 text-violet-500"/><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-black">{m.title}</p>{m.unavailable && <span className="rounded-full bg-muted px-2 py-0.5 text-[0.62rem] font-black uppercase tracking-wide text-muted-foreground">Esgotada</span>}</div><p className="mt-1 text-sm text-muted-foreground">{m.description}</p>{m.rewardLabel && <p className="mt-2 text-xs font-black text-amber-500">Presente: {m.rewardLabel}</p>}<div className="relative mt-3 h-5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-violet-500" style={{width:`${pct}%`}}/><span className="absolute inset-0 flex items-center justify-center text-xs font-black">{m.current}/{m.target}</span></div></div></div>})}</div></section> : (["DAILY", "WEEKLY", "MONTHLY"] as const).map(periodo => {
        const grupo = metas.filter(meta => meta.period === periodo); if (!grupo.length) return null;
        return <section key={periodo} className="mt-7"><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-black text-foreground sm:text-xl">Metas {PERIODOS_PLURAL[periodo]}</h2>{periodo === "DAILY" && <span className="flex shrink-0 items-center gap-1.5 text-[0.7rem] font-black uppercase tracking-[0.06em] text-amber-500"><Clock className="size-3.5" />Renova à meia-noite</span>}</div><div className="mt-3 rounded-[20px] border border-border bg-card px-4 py-1 sm:px-5.5 sm:py-1.5">{grupo.map((meta,index)=><MetaItem key={meta.id} meta={meta} index={index} onClaim={resgatarMeta} />)}</div></section>;
      })}
    </div>
  );
}

function PainelMetas() {
  return (
    <div className="animate-fade-in-up rounded-[20px] border border-border bg-card p-4 sm:p-5.5">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-[0.97rem] font-black leading-snug text-foreground text-pretty">
            Os desafios do mês vão começar em breve!
          </h3>
          <p className="mt-2.5 text-[0.85rem] leading-relaxed text-muted-foreground">
            Complete o desafio do mês pra ganhar medalhas exclusivas.
          </p>
        </div>
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-amber-400 text-amber-950 shadow-[inset_0_-4px_0_rgba(0,0,0,0.18)] sm:size-16">
          <Zap className="size-6 fill-current sm:size-7" strokeWidth={0} />
        </span>
      </div>

      <Link
        href="/home"
        className="mt-5 block rounded-[14px] border-2 border-border py-3.5 text-center text-[0.78rem] font-black uppercase tracking-[0.06em] text-primary"
      >
        Começar uma lição
      </Link>
    </div>
  );
}

export default function MetasPage() {
  useRequireAuth();

  return (
    <AppShell
      rightPanel={
        <>
          <PainelMetas />
          <SideFooter />
        </>
      }
    >
      <MetasContent />
    </AppShell>
  );
}
