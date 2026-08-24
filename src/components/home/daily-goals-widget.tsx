"use client";

import Link from "next/link";
import { Coins } from "lucide-react";
import { useMetasDiarias } from "@/hooks/use-metas-diarias";


export function DailyGoalsWidget() {
  const { metas, conectada, resgatar } = useMetasDiarias();
  const metasVisiveis = metas.filter((meta) => meta.period === "DAILY" && !meta.completed);

  return (
    <div
      className="animate-fade-in-up rounded-[20px] border border-border bg-card p-6"
      style={{ animationDelay: "60ms" }}
    >
      <div className="mb-5 flex items-center justify-between gap-2">
        <h3 className="text-base font-black text-foreground">Metas do dia</h3>
        <Link
          href="/metas"
          className="shrink-0 text-[0.75rem] font-black uppercase tracking-[0.06em] text-primary"
        >
          Ver todas
        </Link>
      </div>

      {!conectada && (
        <p className="mb-5 rounded-xl bg-muted px-3.5 py-2.5 text-[0.78rem] leading-snug text-muted-foreground">
          A contagem do dia ainda não vem do servidor — por isso as barras
          estão zeradas.
        </p>
      )}

      <div className="flex flex-col gap-5">
        {metasVisiveis.map((meta) => {
          const feito = meta.current;
          const pct = Math.min(100, Math.round((feito / meta.target) * 100));

          return (
            <div key={meta.id} className="flex items-center gap-4 py-1">
              <span className="relative flex size-10.5 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-500">
                <Coins className="size-6" />
                <span className="absolute -bottom-1 -right-1 grid min-w-5 place-items-center rounded-full bg-amber-400 px-1 py-0.5 text-[0.58rem] font-black leading-none text-amber-950 shadow-sm">+{meta.coinReward}</span>
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-[0.86rem] font-extrabold leading-snug text-foreground text-pretty">
                  {meta.title}
                </p>
                {/* O rótulo fica centralizado por cima da barra, como no
                    redesign — a barra preenche por baixo sem empurrar o texto. */}
                <div className="relative mt-2 h-5 overflow-hidden rounded-[10px] bg-muted">
                  <div
                    className="absolute inset-y-0 left-0 rounded-[10px] bg-primary"
                    style={{ width: `${pct}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[0.65rem] font-black text-muted-foreground">
                    {feito} / {meta.target}
                  </span>
                </div>
                {meta.claimable && <button onClick={() => resgatar(meta.id)} className="zc-press zc-press-shadow mt-2 w-full rounded-xl bg-amber-400 px-3 py-2 text-[0.68rem] font-black uppercase text-amber-950">Resgatar</button>}
              </div>
            </div>
          );
        })}
        {conectada && metasVisiveis.length === 0 && <p className="rounded-xl bg-primary/10 px-4 py-3 text-center text-sm font-bold text-primary">Você concluiu todas as metas de hoje! ✦</p>}
      </div>
    </div>
  );
}
