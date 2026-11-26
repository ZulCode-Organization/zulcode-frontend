"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { obterPerguntasNivelamento } from "@/lib/nivelamento/perguntas";
import { RespostaNivelamento, ResultadoNivelamento } from "@/lib/nivelamento-local";
import type { PerguntaAlternativa } from "@/data/atividades";
import { BarraDaAula } from "@/components/atividade/barra-da-aula";
import { ExercicioAlternativa } from "@/components/atividade/exercicio-alternativa";
import { FaixaDaResposta } from "@/components/atividade/faixa-da-resposta";
import { FalaDoZul } from "@/components/atividade/zul-da-aula";
import { reagir } from "@/lib/reacoes";
import "@/components/atividade/aula.css";

interface NivelamentoQuizProps {
  languageSlug: string;
  languageName: string;
  onFinish: (resultado: ResultadoNivelamento) => void | Promise<void>;
  /** Sem o fundo próprio: deixa aparecer o fundo animado de quem o mostra. */
  semFundo?: boolean;
}

/**
 * O teste de nivelamento, feito igual a uma aula: a mesma barra que enche,
 * as alternativas numeradas de 1 a 4, escolher e tocar em Verificar, e a
 * faixa que sobe com o resultado e o Continuar. A diferença é que não gasta
 * pena nem repete a questão errada: cada unidade tem uma pergunta, na ordem,
 * e quem acerta as N primeiras seguidas começa na unidade N+1 — é esse
 * número que vai em `acertos`. O X encerra o teste com o que já respondeu.
 */
export function NivelamentoQuiz({ languageSlug, languageName, onFinish, semFundo = false }: NivelamentoQuizProps) {
  const perguntas = obterPerguntasNivelamento(languageSlug);
  const [indice, setIndice] = useState(0);
  const [respostas, setRespostas] = useState<RespostaNivelamento[]>([]);
  const [escolhida, setEscolhida] = useState<string | null>(null);
  const [verificado, setVerificado] = useState(false);
  const [correto, setCorreto] = useState(false);
  const [seguidas, setSeguidas] = useState(0);
  const [enviando, setEnviando] = useState(false);

  const semPerguntas = perguntas.length === 0;

  // Linguagem sem banco de perguntas (um curso novo, por exemplo): encerra sem
  // travar, num efeito — chamar o onFinish durante o render quebrava a tela.
  useEffect(() => {
    if (!semPerguntas) return;
    onFinish({ languageSlug, respostas: [], acertos: 0, total: 0, concluidoEm: new Date().toISOString() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semPerguntas]);

  const pergunta = perguntas[indice];
  // A pergunta do nivelamento no formato da aula: com código, é do tipo "lógica".
  const comoNaAula = useMemo<PerguntaAlternativa | null>(
    () =>
      pergunta
        ? {
            id: pergunta.id,
            tipo: pergunta.codigo ? "logica" : "alternativa",
            enunciado: pergunta.enunciado,
            codigo: pergunta.codigo,
            alternativas: pergunta.alternativas,
            respostaCorretaId: pergunta.corretaId,
          }
        : null,
    [pergunta],
  );

  if (semPerguntas || !pergunta || !comoNaAula) return null;

  const terminar = async (todas: RespostaNivelamento[]) => {
    setEnviando(true);
    // Acertos seguidos desde a primeira: é o que decide a unidade de início.
    let primeiras = 0;
    for (const p of perguntas) {
      if (todas.find((r) => r.perguntaId === p.id)?.correta) primeiras += 1;
      else break;
    }
    try {
      await onFinish({ languageSlug, respostas: todas, acertos: primeiras, total: perguntas.length, concluidoEm: new Date().toISOString() });
    } finally {
      setEnviando(false);
    }
  };

  const escolher = (id: string) => {
    if (verificado) return;
    if (id !== escolhida) reagir("toque");
    setEscolhida(id);
  };

  const verificar = () => {
    if (!escolhida || verificado) return;
    const ok = escolhida === pergunta.corretaId;
    reagir(ok ? "acerto" : "erro");
    setCorreto(ok);
    setVerificado(true);
    setSeguidas((s) => (ok ? s + 1 : 0));
    setRespostas((atuais) => [...atuais.filter((r) => r.perguntaId !== pergunta.id), { perguntaId: pergunta.id, alternativaId: escolhida, correta: ok }]);
  };

  const continuar = () => {
    if (indice + 1 >= perguntas.length) {
      void terminar(respostas);
      return;
    }
    setIndice((i) => i + 1);
    setEscolhida(null);
    setVerificado(false);
    setCorreto(false);
  };

  if (enviando) {
    return (
      <div className={cn("flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center", !semFundo && "bg-background")}>
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-base font-bold text-foreground">Montando sua trilha de {languageName}…</p>
      </div>
    );
  }

  const progresso = Math.round(((indice + (verificado ? 1 : 0)) / perguntas.length) * 100);
  const certa = pergunta.alternativas.find((a) => a.id === pergunta.corretaId);
  const fala = verificado && !correto
    ? "Sem problema! É só para eu saber onde você começa."
    : indice === 0
      ? `Vamos ver onde você começa em ${languageName}. Escolha uma resposta e toque em Verificar.`
      : `Questão ${indice + 1} de ${perguntas.length}.`;

  return (
    <div className={cn("zc-aula relative flex min-h-dvh flex-col", !semFundo && "bg-background")}>
      <BarraDaAula progresso={progresso} seguidas={seguidas} vidas={0} semVidas onSair={() => void terminar(respostas)} />

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pb-[env(safe-area-inset-bottom)]">
        <div className="flex flex-1 flex-col justify-center py-4">
          <div key={pergunta.id} className="zc-aula-entra flex flex-col">
            <FalaDoZul pose={verificado && !correto ? "derretido" : indice === 0 ? "lupa" : "oculos"} className="mb-4">
              {fala}
            </FalaDoZul>
            <ExercicioAlternativa pergunta={comoNaAula} selecionada={escolhida} onSelecionar={escolher} verificado={verificado} />
          </div>
        </div>

        {verificado ? (
          <FaixaDaResposta correto={correto}>
            <p className="zc-aula-faixa-titulo flex items-center gap-2.5 text-xl font-black">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--faixa-cor)] text-white">
                {correto ? <Check className="size-5" strokeWidth={3.5} /> : <X className="size-5" strokeWidth={3.5} />}
              </span>
              {correto ? "Mandou bem!" : "Quase!"}
            </p>
            {!correto && certa && <p className="zc-aula-faixa-porque mt-2 text-[0.95rem] font-bold leading-relaxed">A resposta certa era: {certa.texto}</p>}
            <button type="button" onClick={continuar} data-cor={correto ? "verde" : "vermelho"} className="zc-aula-botao mt-4">
              Continuar
            </button>
          </FaixaDaResposta>
        ) : (
          <div className="py-5">
            <button type="button" disabled={!escolhida} onClick={verificar} className="zc-aula-botao">
              Verificar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
