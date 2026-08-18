"use client";

import { Clock, Target, Timer, Zap } from "lucide-react";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { AppShell } from "@/components/app-shell/app-shell";
import { SideFooter } from "@/components/shared/side-footer";
import { useMetasDiarias } from "@/hooks/use-metas-diarias";

const ICONES = [Target, Zap, Timer];
const CORES = ["text-emerald-500", "text-sky-500", "text-amber-500"];
const BAUS = ["bg-[#C08457]", "bg-slate-400", "bg-amber-400"];

function MetasContent() {
  const { metas, conectada } = useMetasDiarias();
  const concluidas = metas.filter((meta) => (meta.atual ?? 0) >= meta.meta).length;

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
                metas hoje.
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

      <div className="mt-6 flex items-center justify-between gap-3 sm:mt-7">
        <h2 className="text-lg font-black text-foreground sm:text-xl">Metas do dia</h2>
        <span className="flex shrink-0 items-center gap-1.5 text-[0.7rem] font-black uppercase tracking-[0.06em] text-amber-500 sm:text-[0.78rem]">
          <Clock className="size-3.5 sm:size-4" />
          Renova à meia-noite
        </span>
      </div>

      <div className="mt-3 rounded-[20px] border border-border bg-card px-4 py-1 sm:px-5.5 sm:py-1.5">
        {metas.map((meta, index) => {
          const Icon = ICONES[index % ICONES.length];
          const cor = CORES[index % CORES.length];
          const feito = meta.atual ?? 0;
          const pct = Math.min(100, Math.round((feito / meta.meta) * 100));

          return (
            <div
              key={meta.id}
              className="flex items-center gap-3 border-b border-border py-4 last:border-b-0 sm:gap-4.5 sm:py-5.5"
            >
              <span className={`flex size-9 shrink-0 items-center justify-center sm:size-11 ${cor}`}>
                <Icon className="size-7 sm:size-9" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-[0.92rem] font-extrabold text-foreground text-pretty sm:text-base">
                  {meta.titulo}
                </p>
                <div className="mt-2.5 flex items-center gap-2.5 sm:mt-3 sm:gap-3">
                  <div className="relative h-5 flex-1 overflow-hidden rounded-xl bg-muted sm:h-[22px]">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-xl ${cor.replace("text-", "bg-")}`}
                      style={{ width: `${pct}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-[0.68rem] font-black text-muted-foreground sm:text-[0.72rem]">
                      {feito} / {meta.meta}
                    </span>
                  </div>
                  <span
                    className={`flex h-7 w-8 shrink-0 items-center justify-center rounded-[6px_6px_8px_8px] shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)] sm:h-[34px] sm:w-9.5 ${BAUS[index % BAUS.length]}`}
                    aria-hidden
                  >
                    <span className="h-2.5 w-2 rounded-sm bg-black/30 sm:h-3" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
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
