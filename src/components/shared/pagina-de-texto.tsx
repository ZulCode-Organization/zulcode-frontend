"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";

export type Secao = { titulo: string; paragrafos: ReactNode[] };

/** Uma página de leitura (termos, privacidade, créditos): abre sem conta e volta para onde a pessoa estava. */
export function PaginaDeTexto({ titulo, atualizadoEm, secoes }: { titulo: string; atualizadoEm?: string; secoes: Secao[] }) {
  const router = useRouter();
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b-2 border-border bg-background pt-[env(safe-area-inset-top)]">
        <div className="mx-auto grid h-14 max-w-2xl grid-cols-[2.5rem_1fr_2.5rem] items-center px-4">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
            aria-label="Voltar"
            className="-ml-2 flex size-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="size-6" strokeWidth={2.8} />
          </button>
          <h1 className="text-center text-[1.1rem] font-black text-muted-foreground">{titulo}</h1>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 pb-[calc(3rem+env(safe-area-inset-bottom))] pt-6">
        {atualizadoEm && <p className="text-[0.8rem] font-bold text-muted-foreground">Atualizado em {atualizadoEm}</p>}
        {secoes.map((secao) => (
          <section key={secao.titulo} className="mt-7 first:mt-4">
            <h2 className="text-[1.15rem] font-black">{secao.titulo}</h2>
            {secao.paragrafos.map((p, i) => (
              <p key={i} className="mt-2.5 text-[0.95rem] font-medium leading-relaxed text-foreground/80">{p}</p>
            ))}
          </section>
        ))}
      </main>
    </div>
  );
}
