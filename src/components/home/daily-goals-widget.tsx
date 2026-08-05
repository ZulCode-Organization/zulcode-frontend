import Link from "next/link";
import { Target } from "lucide-react";

export function DailyGoalsWidget() {
  return (
    <Link
      href="/metas"
      className="animate-fade-in-up flex items-center gap-3 rounded-2xl border border-border bg-card p-5 transition-colors duration-150 hover:border-primary/40"
      style={{ animationDelay: "60ms" }}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Target className="size-4.5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="text-sm font-extrabold text-foreground">Metas Diárias</h3>
        <p className="text-xs text-muted-foreground">Em breve, acompanhe suas metas do dia por aqui.</p>
      </div>
    </Link>
  );
}
