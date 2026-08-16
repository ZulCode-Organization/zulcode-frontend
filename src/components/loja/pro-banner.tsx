import { Wrench } from "lucide-react";

export function ProBanner() {
  return (
    <div className="animate-fade-in-up flex flex-wrap items-center gap-4 rounded-3xl bg-gradient-to-br from-primary via-primary to-[#0a63b8] p-5 text-primary-foreground shadow-lg shadow-primary/25 sm:gap-6 sm:p-7">
      <div className="min-w-[200px] flex-1 basis-65">
        <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-[0.65rem] font-extrabold uppercase tracking-wide">
          Construindo agora
        </span>
        <h2 className="mt-3.5 text-lg font-black leading-snug text-pretty sm:text-[1.45rem]">
          O ZulCode PRO ainda tá no forno
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-primary-foreground/80">
          Vidas ilimitadas, XP em dobro e mais uns mimos — a gente prefere lançar bem feito do que
          lançar rápido. Assim que estiver pronto, você é a primeira pessoa a saber.
        </p>
      </div>

      <div className="flex h-[100px] min-w-[90px] max-w-[130px] flex-1 basis-30 items-center justify-center rounded-[20px] border border-dashed border-white/30 bg-white/10 sm:h-[140px] sm:min-w-[120px] sm:max-w-[170px] sm:basis-37.5">
        <Wrench className="size-7 sm:size-9" />
      </div>
    </div>
  );
}
