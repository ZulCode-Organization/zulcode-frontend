import { Wrench } from "lucide-react";

export function ProBanner() {
  return (
    <div className="animate-fade-in-up flex flex-wrap items-center gap-6 rounded-3xl bg-gradient-to-br from-primary via-primary to-[#0a63b8] p-7 text-primary-foreground shadow-lg shadow-primary/25">
      <div className="min-w-[200px] flex-1 basis-65">
        <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-[0.65rem] font-extrabold uppercase tracking-wide">
          Construindo agora
        </span>
        <h2 className="mt-3.5 text-xl font-black leading-snug text-pretty sm:text-[1.45rem]">
          O ZulCode PRO ainda tá no forno
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-primary-foreground/80">
          Vidas ilimitadas, XP em dobro e mais uns mimos — a gente prefere lançar bem feito do que
          lançar rápido. Assim que estiver pronto, você é a primeira pessoa a saber.
        </p>
      </div>

      <div className="flex h-[140px] min-w-[120px] max-w-[170px] flex-1 basis-37.5 items-center justify-center rounded-[20px] border border-dashed border-white/30 bg-white/10">
        <Wrench className="size-9" />
      </div>
    </div>
  );
}
