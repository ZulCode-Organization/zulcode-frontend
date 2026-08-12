import { Zap } from "lucide-react";

export function MissionBanner() {
  return (
    <div className="animate-fade-in-up rounded-3xl bg-primary p-7 text-primary-foreground shadow-lg shadow-primary/20">
      <p className="text-xs font-extrabold uppercase tracking-[0.06em] opacity-85">
        No desenho ainda
      </p>
      <h2 className="mt-1.5 text-[1.35rem] font-black text-pretty">
        Metinhas diárias pra sua sequência nunca morrer
      </h2>

      <p className="mt-4 max-w-md text-sm leading-relaxed text-primary-foreground/85">
        A ideia é simples: uma missão curta por dia, recompensa na hora. Ainda estamos ajustando os
        detalhes pra isso valer a pena de verdade.
      </p>

      <div className="mt-5.5 flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-1.5 rounded-xl bg-white/20 px-3.5 py-2 text-[0.8rem] font-extrabold">
          <Zap className="size-4 fill-current" strokeWidth={0} />
          +50 XP por dia
        </span>
      </div>
    </div>
  );
}
