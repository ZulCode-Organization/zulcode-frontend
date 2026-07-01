"use client";

import { useRouter } from "next/navigation";
import { useOnboarding } from "@/hooks/use-onboarding";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { QuestionStep } from "@/components/onboarding/question-step";
import { LanguageStep } from "@/components/onboarding/language-step";
import { OnboardingSummary } from "@/components/onboarding/onboarding-summary";

export default function IntroducaoPage() {
  const router = useRouter();
  const {
    loading,
    languages,
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
    finish,
  } = useOnboarding();

  if (loading || !currentStep) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <span className="text-sm text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  if (result) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center">
        <OnboardingSummary payload={result.payload} onContinue={() => router.push("/signup")} />
      </main>
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

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <OnboardingProgress progress={progress} canGoBack={canGoBack} onBack={goBack} />

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

      {submitting && (
        <div className="px-4 pb-4 text-center text-sm text-muted-foreground">Enviando respostas...</div>
      )}
    </main>
  );
}