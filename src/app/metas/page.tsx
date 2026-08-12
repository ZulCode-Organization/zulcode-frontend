"use client";

import { Clock, Target, Timer, Zap } from "lucide-react";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { AppShell } from "@/components/app-shell/app-shell";
import { SideFooter } from "@/components/shared/side-footer";
import { metasDiarias } from "@/data/painel-lateral";

const ICONES = [Target, Zap, Timer];
const CORES = ["text-emerald-500", "text-sky-500", "text-amber-500"];
const BAUS = ["bg-[#C08457]", "bg-slate-400", "bg-amber-400"];

function MetasContent() {
  const concluidas = metasDiarias.filter((meta) => meta.atual >= meta.meta).length;

  return (
    <div className="pt-3">
      <div className="animate-fade-in-up flex flex-wrap items-center gap-6 rounded-3xl bg-primary p-7 text-primary-foreground shadow-lg shadow-primary/20">
        <div className="min-w-[200px] flex-1 basis-65">
          <h1 className="text-2xl font-black text-pretty">Ganhe recompensas com as metas!</h1>
          <p className="mt-2.5 text-[0.95rem] opacity-90">
            Você fez{" "}
            <span className="font-black">
              {concluidas} de {metasDiarias.length}
            </span>{" "}
            metas hoje.
          </p>
        </div>

        <div className="flex h-[130px] min-w-[120px] max-w-[150px] flex-1 basis-35 items-center justify-center p-2">
          <img src="/mascot.png" alt="" className="size-full object-contain" />
        </div>
      </div>

      <div className="mt-7 flex items-center justify-between gap-3">
        <h2 className="text-xl font-black text-foreground">Metas do dia</h2>
        <span className="flex shrink-0 items-center gap-1.5 text-[0.78rem] font-black uppercase tracking-[0.06em] text-amber-500">
          <Clock className="size-4" />
          Renova à meia-noite
        </span>
      </div>

      <div className="mt-3 rounded-[20px] border border-border bg-card px-5.5 py-1.5">
        {metasDiarias.map((meta, index) => {
          const Icon = ICONES[index % ICONES.length];
          const cor = CORES[index % CORES.length];
          const pct = Math.min(100, Math.round((meta.atual / meta.meta) * 100));

          return (
            <div
              key={meta.id}
              className="flex items-center gap-4.5 border-b border-border py-5.5 last:border-b-0"
            >
              <span className={`flex size-11 shrink-0 items-center justify-center ${cor}`}>
                <Icon className="size-9" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-base font-extrabold text-foreground text-pretty">
                  {meta.titulo}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="relative h-[22px] flex-1 overflow-hidden rounded-xl bg-muted">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-xl ${cor.replace("text-", "bg-")}`}
                      style={{ width: `${pct}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-[0.72rem] font-black text-muted-foreground">
                      {meta.atual} / {meta.meta}
                    </span>
                  </div>
                  <span
                    className={`flex h-[34px] w-9.5 shrink-0 items-center justify-center rounded-[6px_6px_8px_8px] shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)] ${BAUS[index % BAUS.length]}`}
                    aria-hidden
                  >
                    <span className="h-3 w-2 rounded-sm bg-black/30" />
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
    <div className="animate-fade-in-up rounded-[20px] border border-border bg-card p-5.5">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-[0.97rem] font-black leading-snug text-foreground text-pretty">
            Os desafios do mês vão começar em breve!
          </h3>
          <p className="mt-2.5 text-[0.85rem] leading-relaxed text-muted-foreground">
            Complete o desafio do mês pra ganhar medalhas exclusivas.
          </p>
        </div>
        <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-amber-400 text-amber-950 shadow-[inset_0_-4px_0_rgba(0,0,0,0.18)]">
          <Zap className="size-7 fill-current" strokeWidth={0} />
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
