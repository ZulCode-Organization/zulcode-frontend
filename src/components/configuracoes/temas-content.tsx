"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";

/**
 * A tela de aparência: só o claro/escuro. As paletas de cor (os temas da loja e
 * os de PRO, equipe e pioneiro) saíram do app.
 */
export function TemasContent() {
  return (
    <div className="pt-5 sm:pt-6">
      <Link
        href="/configuracoes"
        className="inline-flex items-center gap-2 text-sm font-black text-muted-foreground transition-colors duration-150 hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Configurações
      </Link>

      <h1 className="mt-4 text-2xl font-black sm:text-3xl">Aparência</h1>

      <section className="mt-6 rounded-[20px] border border-border bg-card p-5">
        <h2 className="text-[0.95rem] font-black">Claro ou escuro</h2>
        <p className="mt-1 text-[0.82rem] text-muted-foreground">Muda o fundo e o contraste do aplicativo.</p>
        <div className="mt-4">
          <ThemeToggle />
        </div>
      </section>
    </div>
  );
}
