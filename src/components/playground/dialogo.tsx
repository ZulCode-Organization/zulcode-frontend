"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/** A caixa em que todos os painéis do playground aparecem.
 *
 *  Borda de 1px, canto de 6px, sem sombra difusa nem desfoque: é a mesma
 *  linguagem das barras. O conteúdo rola por dentro, então um painel com
 *  quarenta itens não empurra a tela. */
export function Dialogo({
  titulo, descricao, aoFechar, largura = "media", children,
}: {
  titulo: string;
  descricao?: string;
  aoFechar: () => void;
  largura?: "estreita" | "media" | "larga";
  children: React.ReactNode;
}) {
  const caixa = useRef<HTMLDivElement | null>(null);
  const idTitulo = useId();

  useEffect(() => {
    // Foco na caixa: sem isto, o Esc e o leitor de tela continuariam na página
    // atrás do painel.
    caixa.current?.focus();
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        evento.stopPropagation();
        aoFechar();
      }
    };
    document.addEventListener("keydown", aoTeclar, true);
    return () => document.removeEventListener("keydown", aoTeclar, true);
  }, [aoFechar]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 p-4 pt-[8vh]"
      onPointerDown={(evento) => {
        if (evento.target === evento.currentTarget) aoFechar();
      }}
    >
      <div
        ref={caixa}
        role="dialog"
        aria-modal
        aria-labelledby={idTitulo}
        tabIndex={-1}
        className={cn(
          "zc-pg zc-pg-barra zc-pg-borda flex max-h-[80vh] w-full flex-col overflow-hidden rounded-md border outline-none",
          largura === "estreita" ? "max-w-md" : largura === "larga" ? "max-w-3xl" : "max-w-xl",
        )}
      >
        <header className="zc-pg-borda flex shrink-0 items-start gap-3 border-b px-3 py-2">
          <div className="min-w-0 flex-1">
            <h2 id={idTitulo} className="text-[0.8rem] font-bold">{titulo}</h2>
            {descricao && <p className="zc-pg-apagado mt-0.5 text-[0.72rem] leading-4">{descricao}</p>}
          </div>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="zc-pg-botao size-6 shrink-0"
          >
            <X className="size-3.5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

/** Uma linha de lista dentro de um painel. */
export function LinhaPainel({
  children, aoClicar, ativo, className,
}: {
  children: React.ReactNode;
  aoClicar?: () => void;
  ativo?: boolean;
  className?: string;
}) {
  const classe = cn(
    "zc-pg-borda flex w-full items-center gap-3 border-b px-3 py-2 text-left text-[0.78rem] last:border-b-0",
    aoClicar && "hover:[background:var(--pg-ativo)]",
    ativo && "[background:var(--pg-ativo)]",
    className,
  );
  if (!aoClicar) return <div className={classe}>{children}</div>;
  return (
    <button type="button" onClick={aoClicar} className={classe}>
      {children}
    </button>
  );
}
