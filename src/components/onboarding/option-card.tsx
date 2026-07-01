"use client";

import { cn } from "@/lib/utils";

interface OptionCardProps {
  label: string;
  emoji?: string;
  disabled?: boolean;
  onClick: () => void;
}

export function OptionCard({ label, emoji, disabled, onClick }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border-2 border-border bg-card px-4 py-4 text-left",
        "text-base font-medium text-card-foreground transition-colors",
        "hover:border-primary/60 hover:bg-primary/5",
        "active:scale-[0.98] active:transition-transform",
        "disabled:opacity-40 disabled:pointer-events-none"
      )}
    >
      {emoji && <span className="text-2xl leading-none">{emoji}</span>}
      <span className="flex-1">{label}</span>
      {disabled && (
        <span className="text-xs font-semibold uppercase text-muted-foreground">Em breve</span>
      )}
    </button>
  );
}