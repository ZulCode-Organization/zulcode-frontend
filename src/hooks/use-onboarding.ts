"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  OnboardingAnswer,
  OnboardingQuestion,
  OnboardingSubmission,
  OnboardingSubmissionResult,
  LanguageOption,
} from "@/lib/onboarding/types";
import { getAvailableLanguages, getOnboardingQuestions, submitOnboarding } from "@/lib/onboarding/service";

type Step =
  | { kind: "question"; question: OnboardingQuestion }
  | { kind: "language-select" };

export function useOnboarding() {
  const [questions, setQuestions] = useState<OnboardingQuestion[]>([]);
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [languageId, setLanguageId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [stepIndex, setStepIndex] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    payload: OnboardingSubmission;
    response: OnboardingSubmissionResult;
  } | null>(null);

  useEffect(() => {
    Promise.all([getOnboardingQuestions(), getAvailableLanguages()])
      .then(([q, l]) => {
        setQuestions(q);
        setLanguages(l);
      })
      .finally(() => setLoading(false));
  }, []);

  const steps: Step[] = useMemo(() => {
    const result: Step[] = [];
    questions.forEach((q) => {
      result.push({ kind: "question", question: q });
      if (q.id === "learn_goal") {
        result.push({ kind: "language-select" });
      }
    });
    return result;
  }, [questions]);

  const totalSteps = steps.length;
  const currentStep = steps[stepIndex] ?? null;
  const progress = totalSteps > 0 ? Math.round((stepIndex / totalSteps) * 100) : 0;
  const canGoBack = stepIndex > 0;
  const isLastStep = stepIndex === totalSteps - 1;

  const selectedLanguage = languages.find((l) => l.id === languageId) ?? null;

  const interpolatedTitle = useMemo(() => {
    if (!currentStep || currentStep.kind !== "question") return "";
    return currentStep.question.title.replace("{{language}}", selectedLanguage?.name ?? "");
  }, [currentStep, selectedLanguage]);

  const goNext = useCallback(() => {
    setStepIndex((i) => Math.min(i + 1, Math.max(totalSteps - 1, 0)));
  }, [totalSteps]);

  const goBack = useCallback(() => {
    setStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  const answerQuestion = useCallback(
    (questionId: string, optionId: string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
      goNext();
    },
    [goNext]
  );

  const selectLanguage = useCallback(
    (id: string) => {
      setLanguageId(id);
      goNext();
    },
    [goNext]
  );

  const finish = useCallback(
    async (pendingAnswer?: OnboardingAnswer) => {
      setSubmitting(true);
      try {
        const merged = pendingAnswer
          ? { ...answers, [pendingAnswer.questionId]: pendingAnswer.optionId }
          : answers;

        const answerList: OnboardingAnswer[] = Object.entries(merged).map(
          ([questionId, optionId]) => ({ questionId, optionId })
        );

        const payload: OnboardingSubmission = {
          languageId: languageId ?? "",
          answers: answerList,
          completedAt: new Date().toISOString(),
        };

        const response = await submitOnboarding(payload);
        setResult({ payload, response });
        return { payload, response };
      } finally {
        setSubmitting(false);
      }
    },
    [answers, languageId]
  );

  return {
    loading,
    languages,
    steps,
    stepIndex,
    totalSteps,
    currentStep,
    interpolatedTitle,
    selectedLanguage,
    progress,
    canGoBack,
    isLastStep,
    submitting,
    result,
    answers,
    languageId,
    goBack,
    answerQuestion,
    selectLanguage,
    finish,
  };
}