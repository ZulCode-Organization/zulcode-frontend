"use client";

import { PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OnboardingSubmission } from "@/lib/onboarding/types";

interface OnboardingSummaryProps {
  payload: OnboardingSubmission;
  onContinue: () => void;
}

export function OnboardingSummary({ payload, onContinue }: OnboardingSummaryProps) {
  return (
    <div className="flex flex-col gap-6 px-4 pb-8 pt-2">
      <div className="animate-pop-in flex flex-col items-center gap-4 text-center">
        <span className="flex size-20 items-center justify-center rounded-full bg-primary/10">
          <PartyPopper className="size-9 text-primary" strokeWidth={1.75} />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-extrabold text-foreground">Tudo pronto!</h1>
          <p className="text-sm text-muted-foreground">
            Montamos seu plano de aprendizado com base nas suas respostas.
          </p>
        </div>
      </div>

      {process.env.NODE_ENV !== "production" && (
        <pre className="max-h-64 overflow-auto rounded-xl border border-border bg-muted p-4 text-xs text-muted-foreground">
          {JSON.stringify(payload, null, 2)}
        </pre>
      )}

      <Button onClick={onContinue} size="lg" className="w-full">
        Começar a aprender
      </Button>
    </div>
  );
}