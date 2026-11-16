"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { obterPerguntasNivelamento } from "@/lib/nivelamento/perguntas";
import { RespostaNivelamento, ResultadoNivelamento } from "@/lib/nivelamento-local";
import { FalaDoZul } from "@/components/atividade/zul-da-aula";
import { LanguageIcon } from "./language-icon";

interface NivelamentoQuizProps {
  languageSlug: string;
  languageName: string;
  onFinish: (resultado: ResultadoNivelamento) => void | Promise<void>;
}

/** A, B, C… no lugar dos ids crus das alternativas. */
const LETRAS = ["A", "B", "C", "D", "E"];
/** "Ainda não sei": conta como não saber, sem a pessoa precisar chutar. */
const NAO_SEI = "nao-sei";
/** Tempo para a escolha aparecer marcada antes de passar para a próxima. */
const PAUSA_MS = 320;

/**
 * Teste de nivelamento: uma pergunta por unidade da trilha, na ordem. Não é
 * prova: nada fica verde ou vermelho, a pessoa só escolhe e segue (ou diz que
 * ainda não sabe). Quem acerta as N primeiras seguidas começa na unidade N+1 —
 * é esse número que vai em `acertos`.
 *
 * Cada toque trava a tela até a próxima pergunta aparecer, para um clique
 * duplo não responder duas perguntas de uma vez.
 */
export function NivelamentoQuiz({ languageSlug, languageName, onFinish }: NivelamentoQuizProps) {
  const perguntas = obterPerguntasNivelamento(languageSlug);
  const [indice, setIndice] = useState(0);
  const [respostas, setRespostas] = useState<RespostaNivelamento[]>([]);
  const [escolhida, setEscolhida] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const timer = useRef<number | null>(null);

  const semPerguntas = perguntas.length === 0;

  // Linguagem sem banco de perguntas (um curso novo, por exemplo): encerra sem
  // travar, num efeito — chamar o onFinish durante o render quebrava a tela.
  useEffect(() => {
    if (!semPerguntas) return;
    onFinish({ languageSlug, respostas: [], acertos: 0, total: 0, concluidoEm: new Date().toISOString() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semPerguntas]);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  if (semPerguntas) return null;

  const pergunta = perguntas[indice];

  const terminar = async (todas: RespostaNivelamento[]) => {
    setEnviando(true);
    // Acertos seguidos desde a primeira: é o que decide a unidade de início.
    let seguidas = 0;
    for (const p of perguntas) {
      if (todas.find((r) => r.perguntaId === p.id)?.correta) seguidas += 1;
      else break;
    }
    try {
      await onFinish({ languageSlug, respostas: todas, acertos: seguidas, total: perguntas.length, concluidoEm: new Date().toISOString() });
    } finally {
      setEnviando(false);
    }
  };

  const responder = (alternativaId: string) => {
    if (escolhida || enviando) return;
    setEscolhida(alternativaId);
    const todas = [
      ...respostas.filter((r) => r.perguntaId !== pergunta.id),
      { perguntaId: pergunta.id, alternativaId, correta: alternativaId === pergunta.corretaId },
    ];
    setRespostas(todas);
    timer.current = window.setTimeout(() => {
      setEscolhida(null);
      if (indice + 1 >= perguntas.length) void terminar(todas);
      else setIndice((i) => i + 1);
    }, PAUSA_MS);
  };

  const voltar = () => {
    if (indice === 0 || escolhida || enviando) return;
    setIndice((i) => i - 1);
  };

  if (enviando) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-base font-bold text-foreground">Montando sua trilha de {languageName}…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] lg:pb-4 lg:pt-[calc(1rem+env(safe-area-inset-top))]">
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
          {/* Só o andamento: nada de placar de acertos, para não virar prova. */}
          <div className="flex flex-1 gap-1.5">
            {perguntas.map((item, posicao) => (
              <span
                key={item.id}
                className={cn(
                  "h-2 flex-1 rounded-full transition-colors duration-300",
                  posicao < indice ? "bg-primary" : posicao === indice ? "bg-primary/50" : "bg-muted"
                )}
              />
            ))}
          </div>
          <span className="w-10 shrink-0 text-right text-xs font-bold tabular-nums text-muted-foreground">
            {indice + 1}/{perguntas.length}
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-16 pt-6 lg:justify-center">
        {indice === 0 && (
          <FalaDoZul pose="lupa" className="animate-fade-in-up mb-6">
            Vamos ver onde você começa em {languageName}. Não é prova: se não souber, toque em “Ainda não sei”.
          </FalaDoZul>
        )}

        <div key={pergunta.id} className="animate-slide-in-right">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.08em] text-primary">
            <LanguageIcon id={languageSlug} name={languageName} className="size-4" />
            {languageName}
          </p>
          <h1 className="mt-3 text-2xl font-extrabold leading-tight text-foreground lg:text-[1.9rem]">{pergunta.enunciado}</h1>

          {pergunta.codigo && (
            <pre className="mt-5 overflow-x-auto rounded-2xl border-2 border-border bg-card px-5 py-4 font-mono text-[0.88rem] leading-relaxed text-foreground">
              <code>{pergunta.codigo}</code>
            </pre>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {pergunta.alternativas.map((alternativa, index) => {
              const marcada = escolhida === alternativa.id;
              return (
                <button
                  key={alternativa.id}
                  type="button"
                  onClick={() => responder(alternativa.id)}
                  disabled={!!escolhida}
                  className={cn(
                    "animate-fade-in-up group flex w-full items-center gap-3.5 rounded-2xl border-2 px-4 py-3.5 text-left font-mono text-[0.95rem] transition-all duration-150",
                    marcada ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/50 hover:bg-primary/5 active:scale-[0.99]"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-xl font-sans text-sm font-black transition-colors",
                      marcada ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/15 group-hover:text-primary"
                    )}
                  >
                    {LETRAS[index] ?? index + 1}
                  </span>
                  <span className="flex-1 text-card-foreground">{alternativa.texto}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => responder(NAO_SEI)}
            disabled={!!escolhida}
            className={cn(
              "mt-4 w-full rounded-2xl border-2 border-dashed px-4 py-3 text-sm font-bold transition-colors",
              escolhida === NAO_SEI ? "border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
            )}
          >
            Ainda não sei
          </button>
        </div>
      </main>
    </div>
  );
}
