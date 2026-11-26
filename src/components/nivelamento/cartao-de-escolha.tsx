"use client";

import { ReactNode } from "react";
import { Check } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

interface CartaoDeEscolhaProps {
  titulo: ReactNode;
  texto?: ReactNode;
  icone?: ReactNode;
  /** Algo à direita no lugar da marcação (as chamas do tempo por dia). */
  extra?: ReactNode;
  selecionado: boolean;
  /** "varias": a marcação é um quadradinho que liga e desliga (os motivos). */
  tipo?: "uma" | "varias";
  onClick: () => void;
  /** A posição na lista: os cartões entram um depois do outro. */
  ordem?: number;
  className?: string;
}

/**
 * Um cartão de resposta do nivelamento: corpo com base (como os botões do
 * app), ícone à esquerda e a marcação que salta quando é escolhido. Fica
 * levemente translúcido para o fundo animado aparecer por trás.
 */
export function CartaoDeEscolha({ titulo, texto, icone, extra, selecionado, tipo = "uma", onClick, ordem = 0, className }: CartaoDeEscolhaProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selecionado}
      className={cn(
        "animate-fade-in-up flex w-full items-center gap-3 rounded-2xl border-2 border-b-[5px] px-3.5 py-3 text-left transition-[border-color,background-color,transform] duration-150 active:translate-y-[2px]",
        selecionado ? "border-primary bg-primary/12" : "border-border bg-card/90 hover:border-primary/50",
        className,
      )}
      style={{ animationDelay: `${80 + ordem * 60}ms` }}
    >
      {icone && (
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
            selecionado ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
          )}
        >
          {icone}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-[0.95rem] font-black leading-snug text-foreground">{titulo}</span>
        {texto && <span className="mt-0.5 block text-xs font-semibold text-muted-foreground">{texto}</span>}
      </span>
      {extra}
      <span
        aria-hidden
        className={cn(
          "relative flex size-6 shrink-0 items-center justify-center border-2 border-border",
          tipo === "varias" ? "rounded-lg" : "rounded-full",
        )}
      >
        <span
          className={cn(
            "absolute -inset-[2px] flex items-center justify-center bg-primary text-primary-foreground transition-transform duration-300 [transition-timing-function:cubic-bezier(.3,1.7,.5,1)]",
            tipo === "varias" ? "rounded-lg" : "rounded-full",
            selecionado ? "scale-100" : "scale-0",
          )}
        >
          <Check className="size-3.5" weight="bold" />
        </span>
      </span>
    </button>
  );
}
