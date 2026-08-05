"use client";

import { Flame } from "lucide-react";
import { usePerfil } from "@/hooks/use-perfil";

export function StreakWidget() {
  const { perfil, loading } = usePerfil();

  return (
    <div className="animate-fade-in-up rounded-2xl border border-border bg-card p-5">
      <h3 className="mb-4 text-sm font-extrabold text-foreground">Sua sequência</h3>

      {loading || !perfil ? (
        <div className="flex items-center gap-3">
          <div className="size-11 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
            <div className="h-3 w-24 animate-pulse rounded-full bg-muted" />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
            <Flame className="size-5" />
          </span>
          <div className="flex flex-col">
            <span className="text-2xl font-extrabold text-foreground">{perfil.streakAtual} dias</span>
            <span className="text-xs text-muted-foreground">Recorde: {perfil.streakRecorde} dias</span>
          </div>
        </div>
      )}
    </div>
  );
}
