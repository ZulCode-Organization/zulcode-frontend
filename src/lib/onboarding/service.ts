import { LanguageOption, OnboardingQuestion, OnboardingSubmission, OnboardingSubmissionResult } from "./types";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";

function mockDelay<T>(value: T, ms = 500): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function getOnboardingQuestions(): Promise<OnboardingQuestion[]> {
  const res = await fetchComTimeout(`${API_BASE_URL}/onboarding/questions`);
  if (!res.ok) throw new Error("Falha ao buscar perguntas do nivelamento");
  return res.json();
}

export async function getAvailableLanguages(): Promise<LanguageOption[]> {
  const res = await fetchComTimeout(`${API_BASE_URL}/languages`);
  if (!res.ok) throw new Error("Falha ao buscar linguagens");
  return res.json();
}

export async function submitOnboarding( payload: OnboardingSubmission ): Promise<OnboardingSubmissionResult> {
  const token = localStorage.getItem("accessToken");

  const res = await fetchComTimeout(`${API_BASE_URL}/onboarding/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Falha ao enviar respostas do nivelamento");
  return res.json();
}