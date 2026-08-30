"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Target, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { obterPerguntasNivelamento } from "@/lib/nivelamento/perguntas";
import { RespostaNivelamento, ResultadoNivelamento } from "@/lib/nivelamento-local";
import { LanguageIcon } from "./language-icon";

interface NivelamentoQuizProps {
  languageSlug: string;
  languageName: string;
  onFinish: (resultado: ResultadoNivelamento) => void;
}

/** A, B, C… no lugar dos ids crus das alternativas. */
const LETRAS = ["A", "B", "C", "D", "E"];

/**
 * Teste de nivelamento: as perguntas técnicas da linguagem escolhida, uma de
 * cada vez, com acerto e erro na hora e a pontuação no fim.
 *
 * Todo mundo responde o banco inteiro da linguagem, independente do nível que
 * declarou — antes quem dizia "sei um pouco" recebia só as 3 primeiras, o que
 * media menos e dava um resultado difícil de comparar entre pessoas.
 *
 * Cada pergunta tem dois momentos: responder e conferir. Depois de responder,
 * as alternativas travam e a certa aparece marcada — só o botão "Continuar"
 * avança. Isso, além de dar o retorno que faltava, elimina o avanço duplo:
 * antes um clique repetido empilhava duas respostas e pulava uma pergunta, ou
 * passava do fim da lista e deixava a tela parada.
 *
 * As respostas não vão pro POST /onboarding/submit — quem envia o resultado
 * é o `onFinish`, via submitPlacement (ver lib/nivelamento-local).
 */
export function NivelamentoQuiz({ languageSlug, languageName, onFinish }: NivelamentoQuizProps) {
  const perguntas = obterPerguntasNivelamento(languageSlug);

  const [indice, setIndice] = useState(0);
  const [respostas, setRespostas] = useState<RespostaNivelamento[]>([]);
  /** Alternativa escolhida na pergunta atual, antes de avançar. */
  const [escolhida, setEscolhida] = useState<string | null>(null);
  const [mostrandoPontuacao, setMostrandoPontuacao] = useState(false);

  const semPerguntas = perguntas.length === 0;

  // Linguagem sem banco de perguntas (um curso criado pelo administrativo,
  // por exemplo): encerra sem travar. Vai num efeito, e não no corpo do
  // componente — chamar o onFinish durante o render dispara setState no pai no
  // meio da renderização do filho, que era o que deixava a tela em branco.
  useEffect(() => {
    if (!semPerguntas) return;
    onFinish({ languageSlug, respostas: [], acertos: 0, total: 0, concluidoEm: new Date().toISOString() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semPerguntas]);

  if (semPerguntas) return null;

  const pergunta = perguntas[indice];
  const acertos = respostas.filter((r) => r.correta).length;
  const respondida = escolhida !== null;
  const acertouAgora = respondida && escolhida === pergunta.corretaId;
  const ultima = indice + 1 >= perguntas.length;

  const responder = (alternativaId: string) => {
    if (respondida) return; // ignora cliques repetidos em vez de empilhar
    setEscolhida(alternativaId);
    setRespostas((anteriores) => [
      ...anteriores.filter((r) => r.perguntaId !== pergunta.id),
      { perguntaId: pergunta.id, alternativaId, correta: alternativaId === pergunta.corretaId },
    ]);
  };

  const continuar = () => {
    if (!respondida) return;
    setEscolhida(null);
    if (ultima) return setMostrandoPontuacao(true);
    setIndice((i) => i + 1);
  };

  const voltar = () => {
    if (indice === 0 || respondida) return;
    const anterior = perguntas[indice - 1];
    setRespostas((prev) => prev.filter((r) => r.perguntaId !== anterior.id));
    setIndice((i) => i - 1);
  };

  /* ---------------------------------------------------------------- */
  /* Tela final: a pontuação                                           */
  /* ---------------------------------------------------------------- */
  if (mostrandoPontuacao) {
    const percentual = Math.round((acertos / perguntas.length) * 100);
    const recado =
      percentual >= 80 ? "Mandou bem! Você já tem base sólida."
      : percentual >= 50 ? "Bom começo — dá pra avançar rápido daqui."
      : "Tranquilo: a jornada começa do princípio e te leva lá.";

    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-12">
        <div className="animate-fade-in-up w-full max-w-lg">
          <div className="flex flex-col items-center text-center">
            {/* Anel de progresso: o percentual desenhado, não só escrito. */}
            <div
              className="grid size-36 place-items-center rounded-full"
              style={{
                background: `conic-gradient(var(--primary) ${percentual * 3.6}deg, var(--muted) 0deg)`,
              }}
            >
              <div className="grid size-28 place-items-center rounded-full bg-background">
                <span className="text-4xl font-black tabular-nums text-foreground">{percentual}%</span>
              </div>
            </div>

            <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-foreground">
              {acertos} de {perguntas.length} certas
            </h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <LanguageIcon id={languageSlug} name={languageName} className="size-4" />
              Nivelamento de {languageName}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">{recado}</p>
          </div>

          {/* Espelho das perguntas: o que você marcou e qual era a certa. */}
          <div className="mt-8 flex flex-col gap-2">
            {perguntas.map((item, posicao) => {
              const resposta = respostas.find((r) => r.perguntaId === item.id);
              const certa = resposta?.correta ?? false;
              const marcada = item.alternativas.find((a) => a.id === resposta?.alternativaId);
              const correta = item.alternativas.find((a) => a.id === item.corretaId);

              return (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-2xl border px-4 py-3",
                    certa ? "border-emerald-500/40 bg-emerald-500/5" : "border-destructive/40 bg-destructive/5"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-white",
                        certa ? "bg-emerald-500" : "bg-destructive"
                      )}
                    >
                      {certa ? <Check className="size-3.5" strokeWidth={3} /> : <X className="size-3.5" strokeWidth={3} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold leading-snug text-foreground">
                        {posicao + 1}. {item.enunciado}
                      </p>
                      {!certa && (
                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                          Você marcou <b className="text-destructive">{marcada?.texto ?? "nada"}</b> — a certa era{" "}
                          <b className="text-emerald-500">{correta?.texto}</b>.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Button
            size="lg"
            onClick={() =>
              onFinish({
                languageSlug,
                respostas,
                acertos,
                total: respostas.length,
                concluidoEm: new Date().toISOString(),
              })
            }
            className="mt-8 w-full"
          >
            Continuar
          </Button>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Perguntas                                                         */
  /* ---------------------------------------------------------------- */
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Topo: passo a passo em blocos, um por pergunta, já pintados de verde
          ou vermelho conforme você responde. Substitui a barra corrida, que
          não dizia como você estava indo. */}
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 py-3 lg:py-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={voltar}
            disabled={indice === 0 || respondida}
            aria-label="Voltar"
            className={cn("shrink-0", (indice === 0 || respondida) && "pointer-events-none opacity-0")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex flex-1 gap-1.5">
            {perguntas.map((item, posicao) => {
              const resposta = respostas.find((r) => r.perguntaId === item.id);
              return (
                <span
                  key={item.id}
                  className={cn(
                    "h-2 flex-1 rounded-full transition-colors duration-300",
                    resposta ? (resposta.correta ? "bg-emerald-500" : "bg-destructive")
                      : posicao === indice ? "bg-primary"
                      : "bg-muted"
                  )}
                />
              );
            })}
          </div>

          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-black tabular-nums text-emerald-500">
            <Target className="size-3.5" />
            {acertos}/{perguntas.length}
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-32 pt-6 lg:justify-center lg:pb-40">
        <div key={pergunta.id} className="animate-slide-in-right">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
              <LanguageIcon id={languageSlug} name={languageName} className="size-5" />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.08em] text-primary">
                {languageName}
              </p>
              <p className="text-xs text-muted-foreground">
                Pergunta {indice + 1} de {perguntas.length}
              </p>
            </div>
          </div>

          <h1 className="mt-5 text-2xl font-extrabold leading-tight text-foreground lg:text-[2rem]">
            {pergunta.enunciado}
          </h1>

          <div className="mt-7 flex flex-col gap-3">
            {pergunta.alternativas.map((alternativa, index) => {
              const estaCerta = alternativa.id === pergunta.corretaId;
              const foiEscolhida = escolhida === alternativa.id;
              // Depois de responder: a certa fica verde sempre, a escolhida
              // errada fica vermelha, e as outras apagam.
              const estado = !respondida ? "aberta" : estaCerta ? "certa" : foiEscolhida ? "errada" : "neutra";

              return (
                <button
                  key={alternativa.id}
                  type="button"
                  onClick={() => responder(alternativa.id)}
                  disabled={respondida}
                  className={cn(
                    "animate-fade-in-up group flex w-full items-center gap-3.5 rounded-2xl border-2 px-4 py-4 text-left",
                    "text-base font-medium transition-all duration-150",
                    estado === "aberta" && "border-border bg-card hover:border-primary/50 hover:bg-primary/5 active:scale-[0.99]",
                    estado === "certa" && "border-emerald-500 bg-emerald-500/10",
                    estado === "errada" && "border-destructive bg-destructive/10",
                    estado === "neutra" && "border-border bg-card opacity-45"
                  )}
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  {/* Letra da alternativa, como numa prova. */}
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-black transition-colors duration-150",
                      estado === "aberta" && "bg-muted text-muted-foreground group-hover:bg-primary/15 group-hover:text-primary",
                      estado === "certa" && "bg-emerald-500 text-white",
                      estado === "errada" && "bg-destructive text-white",
                      estado === "neutra" && "bg-muted text-muted-foreground"
                    )}
                  >
                    {estado === "certa" ? <Check className="size-4.5" strokeWidth={3} />
                      : estado === "errada" ? <X className="size-4.5" strokeWidth={3} />
                      : LETRAS[index] ?? index + 1}
                  </span>

                  <span className="flex-1 text-card-foreground">{alternativa.texto}</span>
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* Faixa de retorno: aparece só depois de responder e é o único caminho
          pra próxima pergunta. */}
      {respondida && (
        <div
          className={cn(
            "animate-fade-in-up fixed inset-x-0 bottom-0 border-t backdrop-blur-md",
            acertouAgora ? "border-emerald-500/30 bg-emerald-500/10" : "border-destructive/30 bg-destructive/10"
          )}
        >
          <div className="mx-auto flex w-full max-w-2xl flex-wrap items-center justify-between gap-3 px-4 py-4">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full text-white",
                  acertouAgora ? "bg-emerald-500" : "bg-destructive"
                )}
              >
                {acertouAgora ? <Check className="size-5" strokeWidth={3} /> : <X className="size-5" strokeWidth={3} />}
              </span>
              <div className="min-w-0">
                <p className={cn("font-black", acertouAgora ? "text-emerald-500" : "text-destructive")}>
                  {acertouAgora ? "Acertou!" : "Não foi dessa vez"}
                </p>
                {!acertouAgora && (
                  <p className="text-xs text-muted-foreground">
                    Certa: <b className="text-foreground">
                      {pergunta.alternativas.find((a) => a.id === pergunta.corretaId)?.texto}
                    </b>
                  </p>
                )}
              </div>
            </div>

            <Button onClick={continuar} size="lg" className="ml-auto shrink-0 gap-2">
              {ultima ? "Ver resultado" : "Continuar"}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
