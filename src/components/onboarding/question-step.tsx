"use client";

import { OnboardingQuestion } from "@/lib/onboarding/types";
import { OptionCard } from "./option-card";

interface QuestionStepProps {
  question: OnboardingQuestion;
  title: string;
  selectedOptionId?: string;
  onAnswer: (optionId: string) => void;
}

export function QuestionStep({ question, title, selectedOptionId, onAnswer }: QuestionStepProps) {
  return (
    <div className="flex flex-col gap-6 px-4 pb-8 pt-2">
      <h1 className="text-2xl font-extrabold leading-tight text-foreground">{title}</h1>

      {question.subtitle && (
        <p className="-mt-4 text-sm text-muted-foreground">{question.subtitle}</p>
      )}

      <div className="flex flex-col gap-3">
        {question.options.map((option) => (
          <OptionCard
            key={option.id}
            label={option.label}
            emoji={option.emoji}
            disabled={option.disabled}
            onClick={() => onAnswer(option.id)}
          />
        ))}
      </div>

      {selectedOptionId && (
        <p className="sr-only" aria-live="polite">
          Resposta selecionada: {selectedOptionId}
        </p>
      )}
    </div>
  );
}