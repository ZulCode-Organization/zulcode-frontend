"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePerfil } from "@/hooks/use-perfil";

const OPTIONS = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
] as const;

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { perfil, salvarDados } = usePerfil();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || (resolvedTheme !== "light" && resolvedTheme !== "dark") || perfil?.themeMode === resolvedTheme) return;
    void salvarDados({ themeMode: resolvedTheme });
  }, [mounted, perfil?.themeMode, resolvedTheme, salvarDados]);

  return (
    <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/50 p-1">
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const active = mounted && resolvedTheme === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => { setTheme(option.value); void salvarDados({ themeMode: option.value }); }}
            aria-pressed={active}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors duration-150",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-3.5" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
