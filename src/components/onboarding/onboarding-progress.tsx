"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface OnboardingProgressProps {
  progress: number;
  canGoBack: boolean;
  onBack: () => void;
  stepIndex?: number;
  totalSteps?: number;
  className?: string;
}

export function OnboardingProgress({
  progress,
  canGoBack,
  onBack,
  stepIndex,
  totalSteps,
  className,
}: OnboardingProgressProps) {
  const showCount = typeof stepIndex === "number" && typeof totalSteps === "number" && totalSteps > 0;

  return (
    <div
      className={cn(
        "sticky top-0 z-10 flex items-center gap-3 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-md lg:px-8 lg:py-4",
        className
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onBack}
        disabled={!canGoBack}
        aria-label="Voltar"
        className={cn("shrink-0", !canGoBack && "opacity-0 pointer-events-none")}
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <Progress value={progress} className="h-2.5 flex-1 lg:h-3" />
      {showCount && (
        <span className="w-10 shrink-0 text-right text-xs font-bold tabular-nums text-muted-foreground">
          {Math.min(stepIndex + 1, totalSteps)}/{totalSteps}
        </span>
      )}
    </div>
  );
}