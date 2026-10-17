"use client";

import { Command, Play, Plus, RefreshCw, Square, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

/** A barra de cima: o nome do projeto e as ações que não podem custar um
 *  atalho decorado — começar um projeto, rodar, ligar o "rodar sozinho" e abrir
 *  a paleta. Todo o resto mora na paleta de propósito; é o que mantém a tela
 *  sendo código. O "Rodar" é o botão grosso do app, em verde. */
export function BarraSuperior({
  nome, sujo, rodando, rodarSozinho, podeParar, comRodarSozinho = true,
  aoRenomear, aoRodar, aoParar, aoAlternarSozinho, aoAbrirPaleta, aoNovo,
}: {
  nome: string;
  /** Há mudança que ainda não foi para o preview. */
  sujo: boolean;
  rodando: boolean;
  rodarSozinho: boolean;
  podeParar: boolean;
  /** Em Python não há "rodar sozinho": cada tecla rodaria um código pela metade. */
  comRodarSozinho?: boolean;
  aoRenomear: () => void;
  aoRodar: () => void;
  aoParar: () => void;
  aoAlternarSozinho: () => void;
  aoAbrirPaleta: () => void;
  aoNovo: () => void;
}) {
  return (
    <header className="zc-pg-barra zc-pg-borda flex h-12 shrink-0 items-center gap-1.5 border-b px-2.5">
      <button
        type="button"
        onClick={aoRenomear}
        title="Renomear o projeto"
        className="zc-pg-botao min-w-0 max-w-[40%] px-1.5 py-1 text-[0.9rem] font-black [color:var(--pg-texto)]"
      >
        <span className="truncate">{nome}</span>
        {sujo && (
          <span
            aria-label="há mudança não executada"
            className="size-2 shrink-0 rounded-full"
            style={{ background: "var(--pg-acento)" }}
          />
        )}
      </button>

      <div className="flex-1" />

      <button
        type="button"
        onClick={aoNovo}
        title="Novo projeto"
        className="zc-pg-botao h-8 gap-1.5 px-2 text-[0.75rem] font-bold"
      >
        <Plus className="size-4" />
        <span className="hidden sm:inline">Novo</span>
      </button>

      <button
        type="button"
        onClick={aoAbrirPaleta}
        title="Todos os comandos (Ctrl+K)"
        className="zc-pg-botao h-8 gap-1.5 px-2 text-[0.75rem] font-bold"
      >
        <Command className="size-4" />
        <span className="hidden sm:inline">Comandos</span>
        <kbd className="zc-pg-mono hidden text-[0.65rem] opacity-70 md:inline">Ctrl K</kbd>
      </button>

      {comRodarSozinho && (
        <button
          type="button"
          onClick={aoAlternarSozinho}
          aria-pressed={rodarSozinho}
          title={rodarSozinho
            ? "Rodando sozinho: atualiza pouco depois de você parar de digitar"
            : "Rodar sozinho está desligado"}
          className="zc-pg-botao size-8"
        >
          <Zap className={cn("size-4", rodarSozinho && "fill-current")} />
        </button>
      )}

      {podeParar && (
        <button
          type="button"
          onClick={aoParar}
          title="Parar"
          aria-label="Parar"
          className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#ff4b4b] text-white shadow-[0_3px_0_#ea2b2b] transition-transform active:translate-y-[3px] active:shadow-none"
        >
          <Square className="size-3.5 fill-current" />
        </button>
      )}

      <button
        type="button"
        onClick={aoRodar}
        className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-[#22c55e] px-3.5 text-[0.78rem] font-black uppercase tracking-[0.05em] text-white shadow-[0_3px_0_#15913f] transition-transform active:translate-y-[3px] active:shadow-none"
        title="Rodar (Ctrl+Enter)"
      >
        {rodando
          ? <RefreshCw className="size-4 animate-spin" />
          : <Play className="size-4 fill-current" />}
        <span className="hidden sm:inline">Rodar</span>
      </button>
    </header>
  );
}
