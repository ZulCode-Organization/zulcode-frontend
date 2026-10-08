"use client";

import { Command, Play, RefreshCw, Square, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

/** A barra de cima: o nome do projeto e as três ações que não podem custar um
 *  atalho decorado — rodar, ligar o "rodar sozinho" e abrir a paleta. Todo o
 *  resto mora na paleta de propósito; é o que mantém a tela sendo código. */
export function BarraSuperior({
  nome, sujo, rodando, rodarSozinho, podeParar,
  aoRenomear, aoRodar, aoParar, aoAlternarSozinho, aoAbrirPaleta,
}: {
  nome: string;
  /** Há mudança que ainda não foi para o preview. */
  sujo: boolean;
  rodando: boolean;
  rodarSozinho: boolean;
  podeParar: boolean;
  aoRenomear: () => void;
  aoRodar: () => void;
  aoParar: () => void;
  aoAlternarSozinho: () => void;
  aoAbrirPaleta: () => void;
}) {
  return (
    <header className="zc-pg-barra zc-pg-borda flex h-9 shrink-0 items-center gap-1 border-b px-2">
      <button
        type="button"
        onClick={aoRenomear}
        title="Renomear o projeto"
        className="zc-pg-botao min-w-0 max-w-[45%] px-1.5 py-1 text-[0.78rem] font-bold [color:var(--pg-texto)]"
      >
        <span className="truncate">{nome}</span>
        {sujo && (
          <span
            aria-label="há mudança não executada"
            className="size-1.5 shrink-0 rounded-full"
            style={{ background: "var(--pg-acento)" }}
          />
        )}
      </button>

      <div className="flex-1" />

      <button
        type="button"
        onClick={aoAbrirPaleta}
        title="Todos os comandos (Ctrl+K)"
        className="zc-pg-botao h-7 gap-1.5 px-2 text-[0.72rem]"
      >
        <Command className="size-3.5" />
        <span className="hidden sm:inline">Comandos</span>
        <kbd className="zc-pg-mono hidden text-[0.65rem] opacity-70 md:inline">Ctrl K</kbd>
      </button>

      <button
        type="button"
        onClick={aoAlternarSozinho}
        aria-pressed={rodarSozinho}
        title={rodarSozinho
          ? "Rodando sozinho: atualiza pouco depois de você parar de digitar"
          : "Rodar sozinho está desligado"}
        className="zc-pg-botao size-7"
      >
        <Zap className={cn("size-3.5", rodarSozinho && "fill-current")} />
      </button>

      {podeParar && (
        <button
          type="button"
          onClick={aoParar}
          title="Encerrar o preview"
          aria-label="Encerrar o preview"
          className="zc-pg-botao size-7"
        >
          <Square className="size-3.5" />
        </button>
      )}

      <button
        type="button"
        onClick={aoRodar}
        className="flex h-7 shrink-0 items-center gap-1.5 rounded-sm px-2.5 text-[0.75rem] font-bold text-white"
        style={{ background: "var(--pg-acento)" }}
        title="Rodar (Ctrl+Enter)"
      >
        {rodando
          ? <RefreshCw className="size-3.5 animate-spin" />
          : <Play className="size-3.5 fill-current" />}
        <span className="hidden sm:inline">Rodar</span>
      </button>
    </header>
  );
}
