import { Lock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface LeaderboardWidgetProps {
  xpAtual: number;
  xpNecessario: number;
}

export function LeaderboardWidget({ xpAtual, xpNecessario }: LeaderboardWidgetProps) {
  return (
    <div className="animate-fade-in-up rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-foreground">Tabela de Líderes</h3>
        <span className="text-xs font-semibold text-primary">Ver</span>
      </div>

      <div className="flex items-center gap-3 rounded-xl bg-muted p-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-background text-muted-foreground">
          <Lock className="size-4" />
        </span>
        <p className="text-sm text-muted-foreground">Alcance {xpNecessario} XP para desbloquear</p>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <Progress value={(xpAtual / xpNecessario) * 100} className="h-1.5 flex-1" />
        <span className="shrink-0 text-xs font-semibold text-muted-foreground">
          {xpAtual} / {xpNecessario} XP
        </span>
      </div>
    </div>
  );
}
