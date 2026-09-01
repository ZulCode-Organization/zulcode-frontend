"use client";

import Link from "next/link";
import { usePerfil } from "@/hooks/use-perfil";

/**
 * Card PRO do painel direito (formato do redesign), levando pra Loja.
 * Roxo sólido próprio (violet-600), separado do --primary azul do resto do
 * app — é assim que o card se destaca como "premium" em vez de se misturar
 * com qualquer outro botão azul da tela.
 */
export function ProCard() {
  const { perfil } = usePerfil();

  // Quem ja assinou nao ve mais o anuncio: vender de novo o que a pessoa
  // ja comprou so ocupa o lugar de algo util no painel. A guarda mora aqui,
  // e nao na pagina, porque o painel direito e montado fora do
  // PerfilProvider -- la o usePerfil nem existiria.
  if (perfil?.isPro) return null;

  return (
    <Link
      href="/pro"
      className="animate-fade-in-up block rounded-[20px] border border-border bg-card p-6 transition-colors duration-150 hover:border-violet-500/40"
    >
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <span className="inline-block rounded-md bg-violet-600 px-2.5 py-1 text-[0.75rem] font-black uppercase tracking-[0.12em] text-white">
            Pro
          </span>
          <h3 className="mt-2.5 text-base font-black text-foreground">
            O ZulCode PRO tá chegando
          </h3>
          <p className="mt-1 text-[0.85rem] leading-snug text-muted-foreground">
            Vidas ilimitadas, XP em dobro e zero anúncios.
          </p>
        </div>

        <div className="flex size-[68px] shrink-0 items-center justify-center">
          <img src="/mascot.png" alt="" className="size-full object-contain" />
        </div>
      </div>

      <span
        className="zc-press zc-press-shadow mt-4 block rounded-[13px] bg-violet-600 py-4 text-center text-[0.82rem] font-black uppercase tracking-[0.06em] text-white"
        style={{ ["--zc-press-color" as string]: "rgba(0,0,0,0.32)" }}
      >
        Conhecer o PRO
      </span>
    </Link>
  );
}
