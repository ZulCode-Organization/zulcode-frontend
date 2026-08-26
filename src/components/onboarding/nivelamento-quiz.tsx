"use client";

import { useState } from "react";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { obterPerguntasNivelamento } from "@/lib/nivelamento/perguntas";
import { RespostaNivelamento, ResultadoNivelamento } from "@/lib/nivelamento-local";
import { OptionCard } from "./option-card";

interface NivelamentoQuizProps {
  languageSlug: string;
  languageName: string;
  onFinish: (resultado: ResultadoNivelamento) => void;
  level: "some_experience" | "confident" | "expert";
}

/**
 * Teste de nivelamento: 5 perguntas técnicas sobre a linguagem escolhida no
 * questionário anterior, uma de cada vez — mesma mecânica de clique-avança
 * das perguntas do onboarding, sem revelar acerto/erro na hora (é só
 * coleta de dado por enquanto, não gate de nada). Fora do fluxo genérico
 * de `useOnboarding` de propósito: essas perguntas não vão pro
 * POST /onboarding/submit (não existe model pra isso no backend ainda) —
 * o resultado é só salvo local (ver lib/nivelamento-local.ts).
 */
export function NivelamentoQuiz({ languageSlug, languageName, onFinish, level }: NivelamentoQuizProps) {
  const todasPerguntas = obterPerguntasNivelamento(languageSlug);
  // Quem disse que sabe um pouco começa por diagnóstico básico; os níveis
  // maiores respondem itens que cobrem mais da jornada.
  const perguntas = level === "some_experience" ? todasPerguntas.slice(0, 3) : todasPerguntas;
  const [indice, setIndice] = useState(0);
  const [respostas, setRespostas] = useState<RespostaNivelamento[]>([]);

  if (perguntas.length === 0) {
    // Não deveria acontecer com as linguagens semeadas hoje, mas cobre o
    // caso sem travar o onboarding numa tela vazia.
    onFinish({
      languageSlug,
      respostas: [],
      acertos: 0,
      total: 0,
      concluidoEm: new Date().toISOString(),
    });
    return null;
  }

  const pergunta = perguntas[indice];
  const progresso = Math.round((indice / perguntas.length) * 100);
  const respostaSelecionada = respostas.find((r) => r.perguntaId === pergunta.id)?.alternativaId;

  const handleResponder = (alternativaId: string) => {
    const resposta: RespostaNivelamento = {
      perguntaId: pergunta.id,
      alternativaId,
      correta: alternativaId === pergunta.corretaId,
    };
    const novasRespostas = [...respostas, resposta];

    if (indice + 1 >= perguntas.length) {
      onFinish({
        languageSlug,
        respostas: novasRespostas,
        acertos: novasRespostas.filter((r) => r.correta).length,
        total: novasRespostas.length,
        concluidoEm: new Date().toISOString(),
      });
      return;
    }

    setRespostas(novasRespostas);
    setIndice((i) => i + 1);
  };

  const voltar = () => {
    if (indice === 0) return;
    setRespostas((prev) => prev.slice(0, -1));
    setIndice((i) => i - 1);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background lg:flex-row">
      <div className="hidden items-center justify-center border-r border-border/60 bg-secondary/40 px-16 lg:flex lg:w-2/5">
        <div className="flex max-w-md flex-col items-center gap-6 text-center">
          <span className="animate-float flex size-20 items-center justify-center rounded-full bg-primary/10">
            <GraduationCap className="size-9 text-primary" strokeWidth={1.75} />
          </span>
          <div className="flex flex-col gap-3">
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground">
              Vamos medir seu <span className="text-primary">nível</span>.
            </h1>
            <p className="text-lg text-muted-foreground">
              5 perguntas rápidas de {languageName} pra calibrar por onde você começa.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-md lg:px-8 lg:py-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={voltar}
            disabled={indice === 0}
            aria-label="Voltar"
            className={cn("shrink-0", indice === 0 && "pointer-events-none opacity-0")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Progress value={progresso} className="h-2.5 flex-1 lg:h-3" />
          <span className="w-10 shrink-0 text-right text-xs font-bold tabular-nums text-muted-foreground">
            {indice + 1}/{perguntas.length}
          </span>
        </div>

        <main className="flex flex-1 flex-col items-center overflow-y-auto px-0 py-4 lg:justify-center lg:px-12">
          <div key={pergunta.id} className="w-full max-w-md lg:max-w-lg">
            <div className="animate-slide-in-right flex flex-col gap-6 px-4 pb-8 pt-2 lg:px-0">
              <span className="text-xs font-black uppercase tracking-[0.08em] text-primary">
                Nivelamento de {languageName}
              </span>
              <h1 className="text-2xl font-extrabold leading-tight text-foreground lg:text-3xl">
                {pergunta.enunciado}
              </h1>

              <div className="flex flex-col gap-3">
                {pergunta.alternativas.map((alternativa, index) => (
                  <div
                    key={alternativa.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <OptionCard
                      label={alternativa.texto}
                      optionId={alternativa.id}
                      selected={respostaSelecionada === alternativa.id}
                      onClick={() => handleResponder(alternativa.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
