import { Target } from "lucide-react";

export function MissionBanner() {
  return (
    <div className="animate-fade-in-up relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-500 p-6 text-white shadow-lg shadow-violet-500/25">
      <span
        className="absolute -right-7 -top-7 flex size-28 items-center justify-center rounded-full bg-white/10"
        aria-hidden
      >
        <Target className="size-9" />
      </span>

      <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-[0.65rem] font-extrabold uppercase tracking-wide">
        No desenho ainda
      </span>
      <h2 className="relative mt-3 max-w-xs text-lg font-extrabold leading-snug sm:text-xl">
        Metinhas diárias pra sua sequência nunca morrer
      </h2>
      <p className="relative mt-1 max-w-xs text-sm text-white/85">
        A ideia é simples: uma missão curta por dia, recompensa na hora. Ainda estamos
        ajustando os detalhes pra isso valer a pena de verdade.
      </p>
    </div>
  );
}
