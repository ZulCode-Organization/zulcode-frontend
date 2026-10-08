"use client";

import Link from "next/link";
import { usePerfil } from "@/hooks/use-perfil";
import { SeloPro } from "@/components/shared/selo-pro";
import { DIAS_DE_TESTE } from "@/lib/pro/planos";

/**
 * Card PRO do painel direito.
 *
 * É o mesmo banner da tela de Rupees do celular — mesmo degradê, mesmo texto,
 * mesmo botão branco. O PRO aparece em vários cantos do app, e ter uma cara
 * diferente em cada um faz parecer que são ofertas diferentes.
 *
 * O degradê vai em `style` porque tem quatro paradas de cor; classe arbitrária
 * desse tipo nem sempre vira CSS, e aqui o erro seria silencioso — o card
 * ficaria transparente, com texto branco sobre o fundo da página.
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
      className="animate-fade-in-up block overflow-hidden rounded-[20px] p-5"
      style={{ background: "linear-gradient(120deg, #4f63e3 0%, #8a63e6 48%, #bd73e9 100%)" }}
    >
      <SeloPro className="h-6" />
      <p className="mt-3 text-[1.25rem] font-black leading-tight text-white">
        Tudo pra você aprender mais rápido
      </p>
      <p className="mt-1.5 text-[0.85rem] leading-snug text-white/80">
        Penas ilimitadas, XP e rupees em dobro.
      </p>
      <span className="zc-press mt-4 block rounded-[14px] bg-white py-3.5 text-center text-[0.8rem] font-black uppercase tracking-[0.06em] text-violet-700">
        Teste {DIAS_DE_TESTE} dias grátis
      </span>
    </Link>
  );
}
