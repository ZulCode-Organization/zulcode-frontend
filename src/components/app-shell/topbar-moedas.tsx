"use client";

import Link from "next/link";
import { Coins } from "lucide-react";

/**
 * Tela das moedas: mostra o saldo e leva pra Loja, que é onde elas são
 * gastas de verdade. Nada de saldo ou oferta inventada aqui — o número vem
 * do perfil e o resto é a Loja que já existe.
 */
export function PainelMoedas({ moedas, onNavegar }: { moedas: number | null; onNavegar?: () => void }) {
  return (
    <div className="mx-auto w-full max-w-md pb-2">
      <div className="relative overflow-hidden rounded-[20px] border border-border bg-card px-5 py-6">
        <Coins className="pointer-events-none absolute -right-3 top-1/2 size-32 -translate-y-1/2 text-yellow-500/15" aria-hidden />
        <p className="relative text-5xl font-black leading-none text-yellow-500">
          {moedas === null ? "—" : moedas.toLocaleString("pt-BR")}
        </p>
        <p className="relative mt-1.5 text-lg font-black">
          {moedas === 1 ? "moeda" : "moedas"}
        </p>
        <p className="relative mt-1 text-[0.85rem] leading-snug text-muted-foreground">
          Troque por power-ups, temas, avatares e banners.
        </p>
      </div>

      <Link
        href="/loja"
        onClick={onNavegar}
        className="zc-press zc-press-shadow mt-4 block rounded-[16px] bg-primary py-4 text-center text-[0.85rem] font-black uppercase tracking-[0.06em] text-primary-foreground"
        style={{ ["--zc-press-color" as string]: "rgba(0,0,0,0.32)" }}
      >
        Ir para a loja
      </Link>
    </div>
  );
}
