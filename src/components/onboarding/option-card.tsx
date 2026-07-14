"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { OptionIcon } from "./option-icon";

interface OptionCardProps {
  label: string;
  emoji?: string;
  disabled?: boolean;
  selected?: boolean;
  onClick: () => void;
}

export function OptionCard({ label, emoji, disabled, selected, onClick }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "group relative flex w-full items-center gap-3 rounded-2xl border-2 bg-card px-4 py-4 text-left",
        "text-base font-medium text-card-foreground transition-colors duration-150",
        "hover:border-primary/50 hover:bg-primary/5",
        "active:scale-[0.99]",
        "disabled:opacity-40 disabled:pointer-events-none",
        selected ? "border-primary bg-primary/5" : "border-border"
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors duration-200",
          "group-hover:bg-primary/10 group-hover:text-primary",
          selected && "bg-primary/15 text-primary"
        )}
      >
        <OptionIcon emoji={emoji} className="size-5" />
      </span>

      <span className="flex-1">{label}</span>

      {disabled && (
        <span className="text-xs font-semibold uppercase text-muted-foreground">Em breve</span>
      )}

      {selected && !disabled && (
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-3.5" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}
