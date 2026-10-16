"use client";

import { KeyboardEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EditorDeCodigoProps {
  valor: string;
  onMudar: (valor: string) => void;
  /** O nome do arquivo no rodapé do editor. */
  rotulo?: string;
  /** O botão do rodapé (Testar, Rodar). */
  acao?: ReactNode;
  className?: string;
}

/** O editor das aulas: números de linha ao lado, e o Tab põe dois espaços em vez de sair do campo. */
export function EditorDeCodigo({ valor, onMudar, rotulo, acao, className }: EditorDeCodigoProps) {
  const linhas = Math.max(3, valor.split("\n").length);

  const teclar = (evento: KeyboardEvent<HTMLTextAreaElement>) => {
    if (evento.key !== "Tab" || evento.shiftKey) return;
    evento.preventDefault();
    const campo = evento.currentTarget;
    const { selectionStart: inicio, selectionEnd: fim } = campo;
    const novo = `${valor.slice(0, inicio)}  ${valor.slice(fim)}`;
    onMudar(novo);
    requestAnimationFrame(() => campo.setSelectionRange(inicio + 2, inicio + 2));
  };

  return (
    <div className={cn("overflow-hidden rounded-2xl border-2 border-border bg-muted/40", className)}>
      <div className="flex">
        <div aria-hidden className="select-none whitespace-pre py-3 pl-3 pr-1 text-right font-mono text-[0.8rem] leading-[1.6] text-muted-foreground/50">
          {Array.from({ length: linhas }, (_, k) => k + 1).join("\n")}
        </div>
        <textarea
          value={valor}
          onChange={(e) => onMudar(e.target.value)}
          onKeyDown={teclar}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          rows={linhas}
          aria-label="Seu código"
          className="min-w-0 flex-1 resize-none bg-transparent px-3 py-3 font-mono text-[0.82rem] leading-[1.6] text-foreground caret-[#1892ff] outline-none"
        />
      </div>
      {(rotulo || acao) && (
        <div className="flex items-center justify-between gap-3 border-t-2 border-border px-3 py-2">
          <span className="text-[0.7rem] font-black uppercase tracking-[0.08em] text-muted-foreground">{rotulo}</span>
          {acao}
        </div>
      )}
    </div>
  );
}
