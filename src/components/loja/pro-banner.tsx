import { Sparkles } from "lucide-react";

export function ProBanner() {
  return (
    <div className="animate-fade-in-up relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-[#0a63b8] p-6 text-primary-foreground shadow-lg shadow-primary/25">
      <span
        className="absolute -right-8 -top-8 flex size-32 items-center justify-center rounded-full bg-white/10"
        aria-hidden
      >
        <Sparkles className="size-10" />
      </span>

      <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-[0.65rem] font-extrabold uppercase tracking-wide">
        Em breve
      </span>
      <h2 className="relative mt-3 max-w-xs text-lg font-extrabold leading-snug sm:text-xl">
        ZulCode PRO vai trazer vantagens exclusivas pra sua jornada
      </h2>
      <p className="relative mt-1 max-w-xs text-sm text-primary-foreground/80">
        Vidas ilimitadas, XP em dobro e muito mais — estamos preparando tudo.
      </p>
    </div>
  );
}
