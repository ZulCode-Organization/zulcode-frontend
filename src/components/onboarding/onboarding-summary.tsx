"use client";

import { Button } from "@/components/ui/button";
import { OnboardingSubmission } from "@/lib/onboarding/types";

interface OnboardingSummaryProps {
  payload: OnboardingSubmission;
  onContinue: () => void;
}

export function OnboardingSummary({ payload, onContinue }: OnboardingSummaryProps) {
  return (
    <div className="flex flex-col gap-6 px-4 pb-8 pt-2">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="text-5xl">🎉</span>
        <h1 className="text-2xl font-extrabold text-foreground">Tudo pronto!</h1>
        <p className="text-sm text-muted-foreground">
          Montamos seu plano de aprendizado com base nas suas respostas.
        </p>
      </div>

      {process.env.NODE_ENV !== "production" && (
        <pre className="max-h-64 overflow-auto rounded-xl bg-muted p-4 text-xs text-muted-foreground">
          {JSON.stringify(payload, null, 2)}
        </pre>
      )}

      <Button onClick={onContinue} size="lg" className="w-full">
        Começar a aprender
      </Button>
    </div>
  );
}