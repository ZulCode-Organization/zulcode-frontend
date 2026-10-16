import { Check, X } from "lucide-react";
import { Pergunta } from "@/data/atividades";
import { ZulDaAula } from "./zul-da-aula";

export interface RespostaDaProva {
  resposta: string | null;
  correto: boolean;
}

interface GabaritoDaProvaProps {
  perguntas: Pergunta[];
  respostas: Record<string, RespostaDaProva>;
  /** Nota mínima em % (só na prova da unidade). */
  minimo?: number;
  onContinuar: () => void;
  onTentarDeNovo: () => void;
  /** O texto da resposta dada e da certa, para mostrar na lista. */
  descrever: (pergunta: Pergunta, resposta: string | null) => { dada: string; certa: string; porque: string | null };
}

/** O fim da prova: a nota e, questão por questão, o que era certo e por quê. */
export function GabaritoDaProva({ perguntas, respostas, minimo, onContinuar, onTentarDeNovo, descrever }: GabaritoDaProvaProps) {
  const certas = perguntas.filter((p) => respostas[p.id]?.correto).length;
  const nota = perguntas.length ? Math.round((certas / perguntas.length) * 100) : 0;
  const passou = minimo === undefined || nota >= minimo;

  return (
    <div className="zc-aula flex min-h-dvh flex-col bg-background">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-4 pb-6 pt-[calc(2rem+env(safe-area-inset-top))]">
        <div className="flex flex-col items-center gap-2 text-center">
          <ZulDaAula pose={passou ? "comemorando" : "derretido"} caiu className="size-36" />
          <h1 className="text-3xl font-black text-foreground">{passou ? `Aprovado: ${nota}%` : `Faltou pouco: ${nota}%`}</h1>
          <p className="text-sm font-bold text-muted-foreground">
            {minimo !== undefined ? `Mínimo para passar: ${minimo}%. ` : ""}Você acertou {certas} de {perguntas.length}.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <p className="text-[0.72rem] font-black uppercase tracking-[0.08em] text-muted-foreground">Gabarito comentado</p>
          {perguntas.map((pergunta, k) => {
            const r = respostas[pergunta.id];
            const { dada, certa, porque } = descrever(pergunta, r?.resposta ?? null);
            return (
              <div key={pergunta.id} className="rounded-2xl border-2 border-border p-3.5">
                <p className="flex items-start gap-2 text-[0.9rem] font-black leading-snug text-foreground">
                  <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-white ${r?.correto ? "bg-[#22c55e]" : "bg-[#ff4b4b]"}`}>
                    {r?.correto ? <Check className="size-3.5" strokeWidth={3.5} /> : <X className="size-3.5" strokeWidth={3.5} />}
                  </span>
                  {k + 1}. {pergunta.enunciado}
                </p>
                {!r?.correto && (
                  <p className="mt-2 text-[0.82rem] font-bold text-[#ea2b2b] dark:text-[#ff8a8a]">Sua resposta: {dada || "em branco"}</p>
                )}
                <p className="mt-1 text-[0.82rem] font-bold text-[#16a34a] dark:text-[#4ade80]">Certa: {certa}</p>
                {porque && <p className="mt-1.5 text-[0.82rem] font-medium leading-relaxed text-foreground/75">{porque}</p>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="sticky bottom-0 mx-auto w-full max-w-xl bg-background px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3">
        {passou ? (
          <button type="button" onClick={onContinuar} data-cor="verde" className="zc-aula-botao">
            Continuar
          </button>
        ) : (
          <div className="flex gap-3">
            <button type="button" onClick={onContinuar} data-cor="contorno" className="zc-aula-botao flex-1">
              Sair
            </button>
            <button type="button" onClick={onTentarDeNovo} className="zc-aula-botao flex-1">
              Tentar de novo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
