"use client";

import { LanguageOption } from "@/lib/onboarding/types";
import { cn } from "@/lib/utils";
import { LanguageIcon } from "./language-icon";

interface LanguageStepProps {
  languages: LanguageOption[];
  onSelect: (languageId: string) => void;
}

export function LanguageStep({ languages, onSelect }: LanguageStepProps) {
  return (
    <div className="flex flex-col gap-6 px-4 pb-8 pt-2">
      <h1 className="animate-fade-in-up text-2xl font-extrabold leading-tight text-foreground">
        Qual linguagem você quer aprender primeiro?
      </h1>

      <div className="grid grid-cols-2 gap-3">
        {languages.map((lang, index) => (
          <button
            key={lang.id}
            type="button"
            onClick={() => onSelect(lang.id)}
            className={cn(
              "group animate-fade-in-up flex flex-col items-center gap-3 rounded-2xl border-2 border-border bg-card px-4 py-6",
              "transition-colors duration-150 hover:border-primary/50 hover:bg-primary/5",
              "active:scale-[0.98]"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <span className="flex size-12 items-center justify-center rounded-xl bg-muted text-foreground transition-colors duration-200 group-hover:bg-primary/10">
              <LanguageIcon id={lang.id} name={lang.name} className="size-6" />
            </span>
            <span className="text-sm font-semibold text-card-foreground">{lang.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
