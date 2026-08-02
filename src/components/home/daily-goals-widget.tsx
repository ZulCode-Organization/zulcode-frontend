import { Progress } from "@/components/ui/progress";
import { MetaDiaria } from "@/data/painel-lateral";

interface DailyGoalsWidgetProps {
  metas: MetaDiaria[];
}

export function DailyGoalsWidget({ metas }: DailyGoalsWidgetProps) {
  return (
    <div className="animate-fade-in-up rounded-2xl border border-border bg-card p-5" style={{ animationDelay: "60ms" }}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-foreground">Metas Diárias</h3>
        <span className="text-xs font-semibold text-primary">Ver todas</span>
      </div>

      <div className="flex flex-col gap-4">
        {metas.map((meta) => (
          <div key={meta.id} className="flex flex-col gap-1.5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-foreground">{meta.titulo}</p>
              <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                {meta.atual}/{meta.meta}
              </span>
            </div>
            <Progress value={(meta.atual / meta.meta) * 100} className="h-1.5" />
          </div>
        ))}
      </div>
    </div>
  );
}
