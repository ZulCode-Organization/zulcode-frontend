"use client";

import { Clock, Target, Timer, Zap } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { AppShell } from "@/components/app-shell/app-shell";
import { SideFooter } from "@/components/shared/side-footer";
import { useMetasDiarias } from "@/hooks/use-metas-diarias";

const ICONES = { PERFECT_LESSONS: Target, XP_EARNED: Zap, LESSONS_COMPLETED: Timer };
const CORES = { PERFECT_LESSONS: "text-emerald-500", XP_EARNED: "text-sky-500", LESSONS_COMPLETED: "text-amber-500" };
const BAUS = ["bg-[#C08457]", "bg-slate-400", "bg-amber-400"];
const PERIODOS = { DAILY: "Diária", WEEKLY: "Semanal", MONTHLY: "Mensal" } as const;
const PERIODOS_PLURAL = { DAILY: "diárias", WEEKLY: "semanais", MONTHLY: "mensais" } as const;

function MetaItem({ meta, index, onClaim }: { meta: ReturnType<typeof useMetasDiarias>["metas"][number]; index: number; onClaim:(id:string)=>void }) {
  const Icon = ICONES[meta.type]; const cor = CORES[meta.type]; const pct = Math.min(100, Math.round((meta.current / meta.target) * 100));
  return <div className="flex items-center gap-3 border-b border-border py-4 last:border-b-0 sm:gap-4.5 sm:py-5.5">
    <span className={`flex size-9 shrink-0 items-center justify-center sm:size-11 ${cor}`}><Icon className="size-7 sm:size-9" /></span>
    <div className="min-w-0 flex-1"><p className="text-[0.92rem] font-extrabold text-foreground text-pretty sm:text-base">{meta.title}</p><div className="mt-2.5 flex items-center gap-2.5 sm:mt-3 sm:gap-3"><div className="relative h-5 flex-1 overflow-hidden rounded-xl bg-muted sm:h-[22px]"><div className={`absolute inset-y-0 left-0 rounded-xl ${cor.replace("text-", "bg-")}`} style={{ width: `${pct}%` }} /><span className="absolute inset-0 flex items-center justify-center text-[0.78rem] font-black text-foreground drop-shadow-[0_1px_0_rgba(255,255,255,0.7)]">{meta.current} / {meta.target}</span></div>{meta.claimable ? <button onClick={()=>onClaim(meta.id)} className="zc-press zc-press-shadow shrink-0 rounded-xl bg-amber-400 px-3 py-2 text-[0.66rem] font-black uppercase text-amber-950">Resgatar +{meta.coinReward}</button> : <span className={`flex h-7 w-8 shrink-0 items-center justify-center rounded-[6px_6px_8px_8px] shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)] sm:h-[34px] sm:w-9.5 ${BAUS[index % BAUS.length]}`}><span className="text-[0.65rem] font-black text-amber-950">+{meta.coinReward}</span></span>}</div></div>
  </div>;
}

function MetasContent() {
  const { metas, conectada, resgatar } = useMetasDiarias();
  const [moedas, setMoedas] = useState(0);
  const resgatarMeta = async (id:string) => { const ganho=await resgatar(id); if(ganho){setMoedas(ganho); window.setTimeout(()=>setMoedas(0),1800);} };
  const concluidas = metas.filter((meta) => meta.completed).length;

  return (
    <div className="pt-3">
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
      {moedas > 0 && <div className="animate-pop-in fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-2xl bg-amber-400 px-6 py-3 text-lg font-black text-amber-950 shadow-xl">+{moedas} moedas ✦</div>}

      {(["DAILY", "WEEKLY", "MONTHLY"] as const).map(periodo => {
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
