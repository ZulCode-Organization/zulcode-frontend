import Link from "next/link";
import { Target, Timer, Zap } from "lucide-react";
import { metasDiarias } from "@/data/painel-lateral";

const ICONES = [Target, Zap, Timer];
const CORES = ["text-emerald-500", "text-sky-500", "text-amber-500"];
const BAUS = ["bg-[#C08457]", "bg-slate-400", "bg-amber-400"];

export function DailyGoalsWidget() {
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

      <div className="flex flex-col gap-5">
        {metasDiarias.map((meta, index) => {
          const Icon = ICONES[index % ICONES.length];
          const pct = Math.min(100, Math.round((meta.atual / meta.meta) * 100));

          return (
            <div key={meta.id} className="flex items-center gap-4">
              <span
                className={`flex size-10.5 shrink-0 items-center justify-center ${CORES[index % CORES.length]}`}
              >
                <Icon className="size-7.5" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-[0.86rem] font-extrabold leading-snug text-foreground text-pretty">
                  {meta.titulo}
                </p>
                {/* O rótulo fica centralizado por cima da barra, como no
                    redesign — a barra preenche por baixo sem empurrar o texto. */}
                <div className="relative mt-2 h-5 overflow-hidden rounded-[10px] bg-muted">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-[10px] ${CORES[index % CORES.length].replace("text-", "bg-")}`}
                    style={{ width: `${pct}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[0.65rem] font-black text-muted-foreground">
                    {meta.atual} / {meta.meta}
                  </span>
                </div>
              </div>

              <span
                className={`flex h-8 w-9 shrink-0 items-center justify-center rounded-[5px_5px_7px_7px] shadow-[inset_0_-3px_0_rgba(0,0,0,0.2)] ${BAUS[index % BAUS.length]}`}
                aria-hidden
              >
                <span className="h-3 w-2.5 rounded-sm bg-black/30" />
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
