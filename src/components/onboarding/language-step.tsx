"use client";

import { LanguageOption } from "@/lib/onboarding/types";
import { cn } from "@/lib/utils";

interface LanguageStepProps {
  languages: LanguageOption[];
  onSelect: (languageId: string) => void;
}

export function LanguageStep({ languages, onSelect }: LanguageStepProps) {
  return (
    <div className="flex flex-col gap-6 px-4 pb-8 pt-2">
      <h1 className="text-2xl font-extrabold leading-tight text-foreground">
        Qual linguagem você quer aprender primeiro?
      </h1>

      <div className="grid grid-cols-2 gap-3">
        {languages.map((lang) => (
          <button
            key={lang.id}
            type="button"
            onClick={() => onSelect(lang.id)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-2xl border-2 border-border bg-card px-4 py-6",
              "transition-colors hover:border-primary/60 hover:bg-primary/5",
              "active:scale-[0.98] active:transition-transform"
            )}
          >
            <span className="text-3xl leading-none">{lang.emoji}</span>
            <span className="text-sm font-semibold text-card-foreground">{lang.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}