import Link from "next/link";
import { Trophy } from "lucide-react";

export function LeaderboardWidget() {
  return (
    <Link
      href="/tabela-lideres"
      className="animate-fade-in-up flex items-center gap-3 rounded-2xl border border-border bg-card p-5 transition-colors duration-150 hover:border-primary/40"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Trophy className="size-4.5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="text-sm font-extrabold text-foreground">Tabela de Líderes</h3>
        <p className="text-xs text-muted-foreground">Em breve, dispute o ranking com outros alunos.</p>
      </div>
    </Link>
  );
}
