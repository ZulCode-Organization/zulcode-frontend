"use client";

import { OnboardingQuestion } from "@/lib/onboarding/types";
import { OptionCard } from "./option-card";

interface QuestionStepProps {
  question: OnboardingQuestion;
  title: string;
  selectedOptionId?: string;
  onAnswer: (optionId: string) => void;
  /** Perguntas opcionais ganham um "Pular". */
  onSkip?: () => void;
}

export function QuestionStep({ question, title, selectedOptionId, onAnswer, onSkip }: QuestionStepProps) {
  return (
    <div className="animate-slide-in-right flex flex-col gap-6 px-4 pb-8 pt-2 lg:px-0">
      <div>
        <h1 className="text-2xl font-extrabold leading-tight text-foreground lg:text-3xl">{title}</h1>
        {question.subtitle && <p className="mt-2 text-sm text-muted-foreground lg:text-base">{question.subtitle}</p>}
      </div>

      <div className="flex flex-col gap-3">
        {question.options.map((option, index) => (
          <div key={option.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
            <OptionCard
              label={option.label}
              optionId={option.id}
              disabled={option.disabled}
              selected={selectedOptionId === option.id}
              onClick={() => onAnswer(option.id)}
            />
          </div>
        ))}
      </div>

      {onSkip && (
        <button
          type="button"
          onClick={onSkip}
          className="mx-auto text-sm font-bold text-muted-foreground transition-colors hover:text-primary"
        >
          Pular esta pergunta
        </button>
      )}

      {selectedOptionId && (
        <p className="sr-only" aria-live="polite">
          Resposta selecionada: {selectedOptionId}
        </p>
      )}
    </div>
  );
}
