"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface OnboardingProgressProps {
  progress: number;
  canGoBack: boolean;
  onBack: () => void;
  className?: string;
}

export function OnboardingProgress({ progress, canGoBack, onBack, className }: OnboardingProgressProps) {
  return (
    <div
      className={cn(
        "sticky top-0 z-10 flex items-center gap-3 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-md",
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
      <Progress value={progress} className="h-2.5 flex-1" />
    </div>
  );
}