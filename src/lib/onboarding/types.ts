export type OptionId = string;
export type QuestionId = string;

export interface OnboardingOption {
  id: OptionId;
  label: string;
  emoji?: string;
  disabled?: boolean;
}

/** "multiple-choice": a pessoa marca quantas quiser (os motivos). */
export type QuestionType = "single-choice" | "multiple-choice";

export interface OnboardingQuestion {
  id: QuestionId;
  title: string;
  subtitle?: string;
  type: QuestionType;
  options: OnboardingOption[];
}

export interface LanguageOption {
  id: string;
  name: string;
  emoji: string;
}

export interface OnboardingAnswer {
  questionId: QuestionId;
  optionId: OptionId;
}

export interface OnboardingSubmission {
  userId?: string;
  languageId: string;
  answers: OnboardingAnswer[];
  completedAt: string;
}

export interface OnboardingSubmissionResult {
  success: boolean;
  mock?: boolean;
  [key: string]: unknown;
}