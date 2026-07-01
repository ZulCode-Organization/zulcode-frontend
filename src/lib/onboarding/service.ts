// Único arquivo que precisa mudar quando o back estiver pronto.
// Troque USE_MOCK para false e ajuste a URL/headers (ex: token de auth)
// nas funções abaixo. Nada em componentes/hooks precisa mudar.

import { LanguageOption, OnboardingQuestion, OnboardingSubmission, OnboardingSubmissionResult } from "./types";
import { ONBOARDING_QUESTIONS, LANGUAGES } from "./introduction-data";

const USE_MOCK = true;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

function mockDelay<T>(value: T, ms = 500): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/** Busca as perguntas do nivelamento */
export async function getOnboardingQuestions(): Promise<OnboardingQuestion[]> {
  if (USE_MOCK) {
    return mockDelay(ONBOARDING_QUESTIONS);
  }

  const res = await fetch(`${API_BASE_URL}/onboarding/questions`);
  if (!res.ok) throw new Error("Falha ao buscar perguntas do nivelamento");
  return res.json();
}

/** Busca as linguagens disponíveis para seleção */
export async function getAvailableLanguages(): Promise<LanguageOption[]> {
  if (USE_MOCK) {
    return mockDelay(LANGUAGES);
  }

  const res = await fetch(`${API_BASE_URL}/languages`);
  if (!res.ok) throw new Error("Falha ao buscar linguagens");
  return res.json();
}

/** Envia as respostas do nivelamento para o backend */
export async function submitOnboarding(
  payload: OnboardingSubmission
): Promise<OnboardingSubmissionResult> {
  if (USE_MOCK) {
    console.log("[onboarding:mock] payload que seria enviado ao back:", payload);
    return mockDelay({ success: true, mock: true }, 600);
  }

  const res = await fetch(`${API_BASE_URL}/onboarding/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Falha ao enviar respostas do nivelamento");
  return res.json();
}