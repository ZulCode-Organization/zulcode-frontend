import { cn } from "@/lib/utils";
import { PerguntaAlternativa } from "@/data/atividades";
import { TextoDestacado } from "./selo-pergunta";

interface ExercicioAlternativaProps {
  pergunta: PerguntaAlternativa;
  selecionada: string | null;
  onSelecionar: (id: string) => void;
  verificado: boolean;
}

/** Múltipla escolha — usada tanto pro tipo "alternativa" quanto "logica"
 * (que só soma um trecho de código pra analisar antes das opções). */
export function ExercicioAlternativa({ pergunta, selecionada, onSelecionar, verificado }: ExercicioAlternativaProps) {
  const estiloAlternativa = (alternativaId: string) => {
    if (!verificado) {
      return selecionada === alternativaId
        ? "border-primary bg-accent text-foreground"
        : "border-border text-foreground hover:border-primary/40";
    }
    if (alternativaId === pergunta.respostaCorretaId) {
      return "border-emerald-500 bg-emerald-500/10 text-foreground";
    }
    if (alternativaId === selecionada) {
      return "border-red-500 bg-red-500/10 text-foreground";
    }
    return "border-border text-muted-foreground/60";
  };

  return (
    <>
      <h1 className="mt-2 text-xl font-black text-foreground sm:text-2xl">
        <TextoDestacado texto={pergunta.enunciado} termo={pergunta.termoDestacado} />
      </h1>

      {pergunta.codigo && (
        <pre className="mt-4 overflow-x-auto rounded-xl border border-border bg-muted/50 px-4 py-3.5 font-mono text-[0.85rem] leading-relaxed text-foreground">
          <TextoDestacado texto={pergunta.codigo} termo={pergunta.termoDestacado} />
        </pre>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {pergunta.alternativas.map((alt) => (
          <button
            key={alt.id}
            type="button"
            disabled={verificado}
            onClick={() => onSelecionar(alt.id)}
            className={cn(
              "rounded-2xl border-2 bg-card px-5 py-4 text-left text-[0.95rem] font-bold transition-colors duration-150",
              estiloAlternativa(alt.id)
            )}
          >
            {alt.texto}
          </button>
        ))}
      </div>
    </>
  );
}
