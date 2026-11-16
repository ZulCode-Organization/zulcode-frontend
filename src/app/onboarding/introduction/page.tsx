"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding, PERGUNTAS_OPCIONAIS } from "@/hooks/use-onboarding";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { Button } from "@/components/ui/button";
import type { PoseDoZul } from "@/components/atividade/zul-da-aula";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { OnboardingShowcase } from "@/components/onboarding/onboarding-showcase";
import { QuestionStep } from "@/components/onboarding/question-step";
import { LanguageStep, type Fase } from "@/components/onboarding/language-step";
import { OnboardingSummary, type InicioDaTrilha } from "@/components/onboarding/onboarding-summary";
import { NivelamentoQuiz } from "@/components/onboarding/nivelamento-quiz";
import { ResultadoNivelamento } from "@/lib/nivelamento-local";
import { submitPlacement } from "@/lib/onboarding/service";

/** O que o Zul diz ao lado de cada passo, no computador. Reage à resposta anterior. */
function falaDoZul(passo: string, fase: Fase, respostas: Record<string, string>, linguagem: string): { pose: PoseDoZul; fala: string } {
  if (passo === "language-select") {
    if (fase.tipo === "gosto") return { pose: "equilibrio", fala: "Me conta do que você gosta que eu te ajudo a escolher." };
    if (fase.tipo === "sugestao") return { pose: "oculos", fala: "Acho que essa combina com você!" };
    return { pose: "lupa", fala: "Oi, eu sou o Zul! Vamos escolher por onde começar?" };
  }
  if (passo === "language_level") return { pose: "lendo", fala: `Boa escolha! Vou montar sua trilha de ${linguagem}.` };
  if (passo === "language_reason") {
    return respostas.language_level === "beginner"
      ? { pose: "escrevendo", fala: "Começar do zero é o melhor jeito. Eu vou junto." }
      : { pose: "escrevendo", fala: "Legal! Daqui a pouco a gente vê onde você começa." };
  }
  if (passo === "commitment") return { pose: "forte", fala: "Pouco por dia já faz diferença. A ofensiva conta cada dia." };
  if (passo === "how_heard") return { pose: "coco", fala: "Última pergunta! Essa você pode pular." };
  return { pose: "lupa", fala: "Vamos lá!" };
}

export default function IntroducaoPage() {
  useRequireAuth();
  const router = useRouter();
  const {
    loading,
    loadError,
    retry,
    languages,
    interesse,
    selectedLanguage,
    currentStep,
    interpolatedTitle,
    progress,
    canGoBack,
    isLastStep,
    submitting,
    result,
    answers,
    goBack,
    answerQuestion,
    selectLanguage,
    guardarInteresse,
    finish,
  } = useOnboarding();

  const [faseLinguagem, setFaseLinguagem] = useState<Fase>({ tipo: "lista" });
  // O nivelamento vem depois do envio das respostas (que já marca a pessoa como
  // nivelada). Ele só adianta unidades; se falhar, a pessoa começa do início.
  const [nivelamentoConcluido, setNivelamentoConcluido] = useState(false);
  const [inicio, setInicio] = useState<InicioDaTrilha>(null);

  if (loadError) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-muted-foreground">
          Não foi possível carregar as perguntas. Verifique sua conexão e tente de novo.
        </p>
        <Button onClick={retry}>Tentar novamente</Button>
      </div>
    );
  }

  if (loading || !currentStep) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3">
        <span className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
        <span className="text-sm text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  const nivel = answers.language_level;
  const linguagem = result ? languages.find((l) => l.id === result.payload.languageId) : undefined;

  if (result && nivel && nivel !== "beginner" && !nivelamentoConcluido) {
    return (
      <NivelamentoQuiz
        languageSlug={result.payload.languageId}
        languageName={linguagem?.name ?? "programação"}
        onFinish={async (resultado: ResultadoNivelamento) => {
          try {
            const resposta = await submitPlacement(resultado.languageSlug, nivel, resultado.acertos, Math.max(resultado.total, 1));
            setInicio({ unidade: resposta.startUnitNumber ?? 1, titulo: resposta.startUnitTitle ?? null, xp: resposta.xpEarned ?? 0 });
          } catch {
            /* segue para o resumo começando do início */
          }
          setNivelamentoConcluido(true);
        }}
      />
    );
  }

  if (result) {
    const meta = Number.parseInt(answers.commitment ?? "", 10);
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-2 py-10">
        <div className="w-full max-w-md">
          <OnboardingSummary
            languageSlug={result.payload.languageId}
            languageName={linguagem?.name ?? result.payload.languageId}
            metaMinutos={Number.isFinite(meta) ? meta : null}
            inicio={inicio}
            onContinue={() => router.push("/home")}
          />
        </div>
      </div>
    );
  }

  const passo = currentStep.kind === "question" ? currentStep.question.id : "language-select";
  const opcional = currentStep.kind === "question" && PERGUNTAS_OPCIONAIS.includes(currentStep.question.id);
  const zul = falaDoZul(passo, faseLinguagem, answers, selectedLanguage?.name ?? "programação");

  const handleAnswer = async (optionId: string) => {
    if (currentStep.kind !== "question") return;
    const questionId = currentStep.question.id;
    if (isLastStep) {
      await finish({ questionId, optionId });
      return;
    }
    answerQuestion(questionId, optionId);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background lg:flex-row">
      <div className="hidden items-center justify-center border-r border-border/60 bg-secondary/40 px-16 lg:flex lg:w-2/5">
        <OnboardingShowcase pose={zul.pose} fala={zul.fala} progress={progress} />
      </div>

      <div className="flex flex-1 flex-col">
        <OnboardingProgress progress={progress} canGoBack={canGoBack} onBack={goBack} />

        <main className="flex flex-1 flex-col items-center overflow-y-auto px-0 py-4 lg:justify-center lg:px-12">
          <div key={passo} className="w-full max-w-md lg:max-w-lg">
            {currentStep.kind === "question" && (
              <QuestionStep
                question={currentStep.question}
                title={interpolatedTitle}
                selectedOptionId={answers[currentStep.question.id]}
                onAnswer={handleAnswer}
                onSkip={opcional ? () => void finish() : undefined}
              />
            )}

            {currentStep.kind === "language-select" && (
              <LanguageStep
                languages={languages}
                interesse={interesse}
                onSelect={selectLanguage}
                onInteresse={guardarInteresse}
                onFase={setFaseLinguagem}
              />
            )}
          </div>
        </main>

        {submitting && <div className="px-4 pb-4 text-center text-sm text-muted-foreground">Salvando suas respostas...</div>}
      </div>
    </div>
  );
}
