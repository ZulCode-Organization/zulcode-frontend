"use client";

import Link from "next/link";
import { Trophy } from "lucide-react";
import { usePerfil } from "@/hooks/use-perfil";

/**
 * Não existe divisão/liga/ranking no backend — nenhum model, nenhuma rota.
 * O único dado real aqui é o xp do usuário (GET /user, via usePerfil). O
 * "alvo" de 100 XP é só uma referência visual local pra dar sentido à barra
 * de progresso; o "ainda bloqueada" continua sendo a verdade honesta:
 * ninguém entra numa disputa que ainda não existe.
 */
const XP_ALVO = 100;

export function LeaderboardWidget() {
  const { perfil, loading } = usePerfil();
  const xpAtual = perfil?.xp ?? 0;
  const pct = Math.min(100, Math.round((xpAtual / XP_ALVO) * 100));
  const faltam = Math.max(0, XP_ALVO - xpAtual);

  return (
    <div className="animate-fade-in-up rounded-[20px] border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-base font-black text-foreground">Divisão Bronze</h3>
        <Link
          href="/tabela-lideres"
          className="shrink-0 text-[0.75rem] font-black uppercase tracking-[0.06em] text-primary"
        >
          Ver divisão
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <span className="flex h-[66px] w-[58px] shrink-0 items-center justify-center rounded-[14px_14px_22px_22px] bg-[#C08457] text-white shadow-[inset_0_-3px_0_rgba(0,0,0,0.18)]">
          <Trophy className="size-6.5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[0.95rem] font-extrabold text-foreground">Ainda bloqueada</p>
          <p className="mt-1 text-[0.85rem] leading-snug text-muted-foreground">
            {loading
              ? "Carregando…"
              : faltam > 0
                ? `Faltam ${faltam} XP pra você entrar na disputa.`
                : "Você já tem XP de sobra — a disputa de verdade ainda não abriu."}
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
