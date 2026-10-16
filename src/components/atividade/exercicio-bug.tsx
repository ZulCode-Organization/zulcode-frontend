"use client";

import { cn } from "@/lib/utils";
import { PerguntaBug } from "@/data/atividades";

interface ExercicioBugProps {
  pergunta: PerguntaBug;
  /** A linha tocada, como texto ("1", "2"…), ou nada. */
  selecionada: string | null;
  onSelecionar: (linha: string) => void;
  verificado: boolean;
}

/** Achar o erro: o código aparece linha por linha e a pessoa toca na que está errada. */
export function ExercicioBug({ pergunta, selecionada, onSelecionar, verificado }: ExercicioBugProps) {
  const linhas = pergunta.codigo.split("\n");
  const certa = String(pergunta.linhaDoErro);

  const estado = (numero: string) => {
    if (!verificado) return selecionada === numero ? "escolhida" : undefined;
    if (numero === certa) return "certa";
    if (numero === selecionada) return "errada";
    return undefined;
  };

  return (
    <>
      <h1 className="text-xl font-black leading-snug text-foreground sm:text-2xl">{pergunta.enunciado}</h1>

      <div className="mt-5 overflow-hidden rounded-2xl border-2 border-border bg-muted/40 py-2" role="listbox" aria-label="Linhas do código">
        {linhas.map((texto, k) => {
          const numero = String(k + 1);
          const e = estado(numero);
          return (
            <button
              key={k}
              type="button"
              role="option"
              aria-selected={selecionada === numero}
              disabled={verificado || !texto.trim()}
              onClick={() => onSelecionar(numero)}
              className={cn(
                "flex w-full items-start gap-3 border-y-2 border-transparent px-3 py-1.5 text-left font-mono text-[0.82rem] leading-relaxed text-foreground transition-colors",
                !verificado && texto.trim() && "hover:bg-muted",
                e === "escolhida" && "border-[#1892ff] bg-[#1892ff]/10",
                e === "certa" && "border-[#22c55e] bg-[#22c55e]/10",
                e === "errada" && "zc-aula-treme border-[#ff4b4b] bg-[#ff4b4b]/10"
              )}
            >
              <span className="w-5 shrink-0 select-none text-right text-muted-foreground/60">{numero}</span>
              <span className="whitespace-pre-wrap break-words">{texto || " "}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
