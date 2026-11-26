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

/** As perguntas feitas depois da escolha da linguagem, nesta ordem. */
export const ORDEM_DAS_PERGUNTAS = ["language_level", "language_reason", "commitment", "how_heard"];

/** Perguntas que a pessoa pode pular. */
export const PERGUNTAS_OPCIONAIS = ["how_heard"];

/**
 * Os dados e as respostas do nivelamento. Quem anda pelas páginas é a tela;
 * aqui ficam as perguntas da API, a linguagem escolhida, as respostas (uma por
 * pergunta, ou várias nas de múltipla escolha) e o envio.
 */
export function useOnboarding() {
  const [questions, setQuestions] = useState<OnboardingQuestion[]>([]);
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [languageId, setLanguageId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [multiplas, setMultiplas] = useState<Record<string, string[]>>({});

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    payload: OnboardingSubmission;
    response: OnboardingSubmissionResult;
  } | null>(null);

  const buscar = useCallback(() => {
    return Promise.all([getOnboardingQuestions(), getAvailableLanguages()])
      .then(([q, l]) => {
        // Resposta 200 com array vazio não é erro de rede, mas sem perguntas
        // não há o que exibir — trata como falha pra não travar no loading.
        if (q.length === 0) {
          setLoadError(true);
          return;
        }
        setQuestions(q);
        setLanguages(l);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  // A primeira busca já começa com "carregando" no estado inicial.
  useEffect(() => {
    void buscar();
  }, [buscar]);

  const loadData = useCallback(() => {
    setLoading(true);
    setLoadError(false);
    void buscar();
  }, [buscar]);

  // Perguntas que a API devolva fora desta lista não entram; "interest" é
  // feita dentro do passo da linguagem, no "Não sei qual escolher".
  const perguntas = useMemo(() => {
    const porSlug = new Map(questions.map((q) => [q.id, q]));
    return ORDEM_DAS_PERGUNTAS.map((slug) => porSlug.get(slug)).filter((q): q is OnboardingQuestion => Boolean(q));
  }, [questions]);

  const interesse = useMemo(() => questions.find((q) => q.id === "interest"), [questions]);
  const selectedLanguage = languages.find((l) => l.id === languageId) ?? null;

  const responder = useCallback((questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }, []);

  /** Marca ou desmarca uma opção numa pergunta de múltipla escolha. */
  const alternar = useCallback((questionId: string, optionId: string) => {
    setMultiplas((prev) => {
      const atuais = prev[questionId] ?? [];
      const novas = atuais.includes(optionId) ? atuais.filter((o) => o !== optionId) : [...atuais, optionId];
      return { ...prev, [questionId]: novas };
    });
  }, []);

  /** O gosto do "Não sei qual escolher": vai junto com as outras respostas. */
  const guardarInteresse = useCallback((optionId: string) => {
    setAnswers((prev) => ({ ...prev, interest: optionId }));
  }, []);

  const finish = useCallback(async () => {
    setSubmitting(true);
    try {
      const answerList: OnboardingAnswer[] = [
        ...Object.entries(answers).map(([questionId, optionId]) => ({ questionId, optionId })),
        ...Object.entries(multiplas).flatMap(([questionId, opcoes]) => opcoes.map((optionId) => ({ questionId, optionId }))),
      ];
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
  }, [answers, multiplas, languageId]);

  return {
    loading,
    loadError,
    retry: loadData,
    languages,
    interesse,
    perguntas,
    selectedLanguage,
    languageId,
    escolherLinguagem: setLanguageId,
    answers,
    multiplas,
    responder,
    alternar,
    guardarInteresse,
    submitting,
    result,
    finish,
  };
}
