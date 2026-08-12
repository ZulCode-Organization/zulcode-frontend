import Link from "next/link";
import { Trophy } from "lucide-react";
import { tabelaLideresBloqueio } from "@/data/painel-lateral";

export function LeaderboardWidget() {
  const { xpAtual, xpNecessario } = tabelaLideresBloqueio;
  const pct = Math.min(100, Math.round((xpAtual / xpNecessario) * 100));

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

      {/* Cor bronze real da divisão (a mesma de /tabela-lideres) — todo mundo
          começa nela, então não é dado inventado, só o "ainda bloqueada" que
          continua real (o ranking por posição não existe no backend ainda). */}
      <div className="flex items-center gap-4">
        <span className="flex h-[66px] w-[58px] shrink-0 items-center justify-center rounded-[14px_14px_22px_22px] bg-[#C08457] text-white shadow-[inset_0_-3px_0_rgba(0,0,0,0.18)]">
          <Trophy className="size-6.5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[0.95rem] font-extrabold text-foreground">Ainda bloqueada</p>
          <p className="mt-1 text-[0.85rem] leading-snug text-muted-foreground">
            Faltam {xpNecessario - xpAtual} XP pra você entrar na disputa.
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
