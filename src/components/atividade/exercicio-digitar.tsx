"use client";

import { cn } from "@/lib/utils";
import { PerguntaDigitar } from "@/data/atividades";

interface ExercicioDigitarProps {
  pergunta: PerguntaDigitar;
  resposta: string | null;
  onDigitar: (texto: string) => void;
  /** Enter no campo verifica, como o botão. */
  onEnviar: () => void;
  verificado: boolean;
  correto: boolean;
}

/** Compara sem reprovar por detalhe que não importa: espaços sobrando e acento decomposto. */
export function respostaDigitadaConfere(pergunta: PerguntaDigitar, texto: string) {
  const limpar = (s: string) => s.normalize("NFC").trim().replace(/\s+/g, " ");
  const dada = limpar(texto);
  return [pergunta.respostaCorreta, ...(pergunta.aceitas ?? [])].some((certa) => limpar(certa) === dada);
}

/** Digitar o que o código mostra no console. */
export function ExercicioDigitar({ pergunta, resposta, onDigitar, onEnviar, verificado, correto }: ExercicioDigitarProps) {
  return (
    <>
      <h1 className="text-xl font-black leading-snug text-foreground sm:text-2xl">{pergunta.enunciado}</h1>

      {pergunta.codigo && (
        <pre className="mt-4 overflow-x-auto rounded-2xl border-2 border-border bg-muted/50 px-4 py-3.5 font-mono text-[0.85rem] leading-relaxed text-foreground">
          {pergunta.codigo}
        </pre>
      )}

      <label className="mt-5 block text-[0.7rem] font-black uppercase tracking-[0.08em] text-muted-foreground" htmlFor="zc-resposta-digitada">
        O console mostra
      </label>
      <input
        id="zc-resposta-digitada"
        value={resposta ?? ""}
        onChange={(e) => onDigitar(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !verificado && resposta?.trim() && onEnviar()}
        disabled={verificado}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder="Digite a saída"
        className={cn(
          "mt-2 w-full rounded-2xl border-2 bg-card px-4 py-3.5 font-mono text-[0.95rem] font-bold text-foreground outline-none transition-colors placeholder:font-sans placeholder:font-semibold placeholder:text-muted-foreground/60",
          !verificado && "border-border focus:border-[#1892ff]",
          verificado && correto && "border-[#22c55e] bg-[#22c55e]/10",
          verificado && !correto && "zc-aula-treme border-[#ff4b4b] bg-[#ff4b4b]/10"
        )}
      />
    </>
  );
}
