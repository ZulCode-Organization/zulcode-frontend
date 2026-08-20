import Link from "next/link";
import { ArrowRight, Flame } from "lucide-react";

/**
 * Faixa do PRO na Loja. Leva pra página dedicada (/pro) — é lá que fica a
 * comparação com o plano grátis. Roxo, e não o azul da marca, pelo mesmo
 * motivo do card da Jornada: o PRO precisa se destacar do resto do app.
 */
export function ProBanner() {
  return (
    <Link
      href="/pro"
      className="animate-fade-in-up flex flex-wrap items-center gap-4 rounded-3xl bg-violet-600 p-5 text-white shadow-lg shadow-violet-600/25 transition-transform duration-150 hover:scale-[1.01] sm:gap-6 sm:p-7"
    >
      <div className="min-w-[200px] flex-1 basis-65">
        <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-[0.65rem] font-extrabold uppercase tracking-wide">
          Chegando
        </span>
        <h2 className="mt-3.5 text-lg font-black leading-snug text-pretty sm:text-[1.45rem]">
          O ZulCode PRO tá saindo do forno
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/80">
          Vidas ilimitadas, XP em dobro e zero anúncios. Veja o que muda em
          relação ao plano grátis.
        </p>
        <span className="mt-3.5 inline-flex items-center gap-1.5 text-[0.8rem] font-black uppercase tracking-[0.06em]">
          Conhecer o PRO
          <ArrowRight className="size-4" />
        </span>
      </div>

      <div className="flex h-[100px] min-w-[90px] max-w-[130px] flex-1 basis-30 items-center justify-center rounded-[20px] bg-white/10 sm:h-[140px] sm:min-w-[120px] sm:max-w-[170px] sm:basis-37.5">
        <Flame className="size-8 sm:size-10" />
      </div>
    </Link>
  );
}
