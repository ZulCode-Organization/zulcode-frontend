"use client";

import Link from "next/link";
import { Trophy } from "lucide-react";
import { usePerfil } from "@/hooks/use-perfil";
import { divisaoDoXp, proximaDivisao } from "@/lib/divisoes";
import { cn } from "@/lib/utils";

/**
 * A divisão em que a pessoa está, no painel da Jornada.
 *
 * A divisão sai do XP, pelas mesmas faixas do backend
 * (leaderboard.service.ts), através do `lib/divisoes`. Antes esta tela dizia
 * "Divisão Bronze" fixo, com o escudo cor de bronze e 300 XP de alvo — quem
 * passava de Prata continuava vendo Bronze pra sempre, porque nome, cor e alvo
 * estavam escritos à mão em vez de virem do XP.
 *
 * A barra mede o trecho entre uma divisão e a seguinte, e não o XP total: em
 * Ouro, que começa em 1000 e vai até 3000, uma barra sobre o total já nasceria
 * quase cheia e nunca mais se mexeria de forma perceptível.
 */
export function LeaderboardWidget() {
  const { perfil, loading } = usePerfil();
  const xp = perfil?.xp ?? 0;

  const atual = divisaoDoXp(xp);
  const proxima = proximaDivisao(xp);

  const faltam = proxima ? Math.max(0, proxima.minXp - xp) : 0;
  const percentual = proxima
    ? Math.min(100, Math.round(((xp - atual.minXp) / (proxima.minXp - atual.minXp)) * 100))
    : 100;

  return (
    <div className="animate-fade-in-up rounded-[20px] border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-base font-black text-foreground">Divisão {atual.nome}</h3>
        <Link
          href="/tabela-lideres"
          className="shrink-0 text-[0.75rem] font-black uppercase tracking-[0.06em] text-primary"
        >
          Ver divisão
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {/* O escudo pega a cor da divisão atual — é o sinal mais rápido de que
            a pessoa mudou de faixa, antes mesmo de ler o nome. */}
        <span
          className={cn(
            "flex h-[66px] w-[58px] shrink-0 items-center justify-center rounded-[14px_14px_22px_22px] text-white shadow-[inset_0_-3px_0_rgba(0,0,0,0.18)] transition-colors duration-300",
            atual.cor
          )}
        >
          <Trophy className="size-6.5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[0.95rem] font-extrabold text-foreground">
            {proxima ? "Em progresso" : "Divisão máxima"}
          </p>
          <p className="mt-1 text-[0.85rem] leading-snug text-muted-foreground">
            {loading
              ? "Carregando…"
              : proxima
                ? `Faltam ${faltam.toLocaleString("pt-BR")} XP para chegar à divisão ${proxima.nome}.`
                : "Você chegou à divisão mais alta do ZulCode."}
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-[width] duration-300", atual.cor)}
              style={{ width: `${percentual}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
