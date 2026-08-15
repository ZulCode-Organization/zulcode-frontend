import { cn } from "@/lib/utils";
import { PerguntaCompletar } from "@/data/atividades";
import { TextoDestacado } from "./selo-pergunta";

interface ExercicioCompletarProps {
  pergunta: PerguntaCompletar;
  resposta: string | null;
  onEscolherBloco: (bloco: string | null) => void;
  verificado: boolean;
}

/** Preencher com blocos: toca num bloco pra encaixar no espaço vazio do
 * código, toca no espaço preenchido pra desfazer. */
export function ExercicioCompletar({ pergunta, resposta, onEscolherBloco, verificado }: ExercicioCompletarProps) {
  const correto = resposta === pergunta.respostaCorreta;

  return (
    <>
      <h1 className="mt-2 text-xl font-black text-foreground sm:text-2xl">{pergunta.enunciado}</h1>

      <div className="mt-5 rounded-xl border border-border bg-muted/50 px-4 py-4 font-mono text-[0.95rem] leading-relaxed text-foreground">
        {pergunta.codigoAntes}
        <button
          type="button"
          disabled={verificado || !resposta}
          onClick={() => onEscolherBloco(null)}
          className={cn(
            "mx-1 inline-flex min-w-[52px] items-center justify-center rounded-lg border-b-4 px-2.5 py-0.5 align-middle font-bold transition-colors duration-150",
            !resposta && "border-dashed border-muted-foreground/40",
            resposta &&
              !verificado &&
              "border-primary bg-primary/10 text-primary",
            verificado && correto && "border-emerald-500 bg-emerald-500/10 text-emerald-600",
            verificado && !correto && "border-red-500 bg-red-500/10 text-red-600"
          )}
        >
          {resposta ?? "    "}
        </button>
        <TextoDestacado texto={pergunta.codigoDepois} termo={pergunta.termoDestacado} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2.5">
        {pergunta.blocos.map((bloco, indice) => {
          const emUso = bloco === resposta;
          return (
            <button
              key={indice}
              type="button"
              disabled={verificado || emUso}
              onClick={() => onEscolherBloco(bloco)}
              className={cn(
                "rounded-xl border-2 border-border bg-card px-4 py-2.5 font-mono text-[0.9rem] font-bold text-foreground transition-opacity duration-150",
                emUso && "pointer-events-none opacity-0"
              )}
            >
              {bloco}
            </button>
          );
        })}
      </div>
    </>
  );
}
