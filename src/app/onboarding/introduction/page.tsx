"use client";

import { useRouter } from "next/navigation";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { Button } from "@/components/ui/button";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { OnboardingShowcase } from "@/components/onboarding/onboarding-showcase";
import { QuestionStep } from "@/components/onboarding/question-step";
import { LanguageStep } from "@/components/onboarding/language-step";
import { OnboardingSummary } from "@/components/onboarding/onboarding-summary";

export default function IntroducaoPage() {
  useRequireAuth();
  const router = useRouter();
  const {
    loading,
    loadError,
    retry,
    languages,
    currentStep,
    stepIndex,
    totalSteps,
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
    finish,
  } = useOnboarding();

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

  if (result) {
    return (
      <div className="flex min-h-dvh flex-col bg-background lg:flex-row">
        <div className="hidden items-center justify-center bg-secondary/40 px-16 lg:flex lg:w-2/5">
          <OnboardingShowcase progress={100} stepIndex={totalSteps} totalSteps={totalSteps} />
        </div>
        <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <OnboardingSummary payload={result.payload} onContinue={() => router.push("/home")} />
          </div>
        </main>
      </div>
    );
  }

  const handleAnswer = async (optionId: string) => {
    if (currentStep.kind !== "question") return;
    const questionId = currentStep.question.id;

    if (isLastStep) {
      await finish({ questionId, optionId });
      return;
    }

    answerQuestion(questionId, optionId);
  };

  const stepKey = currentStep.kind === "question" ? currentStep.question.id : "language-select";

  return (
    <div className="flex min-h-dvh flex-col bg-background lg:flex-row">
      <div className="hidden items-center justify-center border-r border-border/60 bg-secondary/40 px-16 lg:flex lg:w-2/5">
        <OnboardingShowcase progress={progress} stepIndex={stepIndex} totalSteps={totalSteps} />
      </div>

      <div className="flex flex-1 flex-col">
        <OnboardingProgress
          progress={progress}
          canGoBack={canGoBack}
          onBack={goBack}
          stepIndex={stepIndex}
          totalSteps={totalSteps}
        />

        <main className="flex flex-1 flex-col items-center overflow-y-auto px-0 py-4 lg:justify-center lg:px-12">
          <div key={stepKey} className="w-full max-w-md lg:max-w-lg">
            {currentStep.kind === "question" && (
              <QuestionStep
                question={currentStep.question}
                title={interpolatedTitle}
                selectedOptionId={answers[currentStep.question.id]}
                onAnswer={handleAnswer}
              />
            )}

            {currentStep.kind === "language-select" && (
              <LanguageStep languages={languages} onSelect={selectLanguage} />
            )}
          </div>
        </main>

        {submitting && (
          <div className="px-4 pb-4 text-center text-sm text-muted-foreground">Enviando respostas...</div>
        )}
      </div>
    </div>
  );
}