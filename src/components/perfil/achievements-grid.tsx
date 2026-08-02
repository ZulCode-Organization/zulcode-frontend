import { cn } from "@/lib/utils";
import { Conquista } from "@/lib/types/usuario";
import { ConquistaIcon } from "./conquista-icon";

interface AchievementsGridProps {
  conquistas: Conquista[];
}

export function AchievementsGrid({ conquistas }: AchievementsGridProps) {
  const desbloqueadas = conquistas.filter((c) => c.desbloqueada).length;

  return (
    <div
      className="animate-fade-in-up rounded-2xl border border-border bg-card p-5"
      style={{ animationDelay: "120ms" }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-foreground">Conquistas</h3>
        <span className="text-xs font-semibold text-muted-foreground">
          {desbloqueadas}/{conquistas.length}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {conquistas.map((conquista) => (
          <div
            key={conquista.id}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center",
              conquista.desbloqueada
                ? "border-primary/30 bg-primary/5 text-foreground"
                : "border-border bg-muted/40 text-muted-foreground/50"
            )}
          >
            <ConquistaIcon icone={conquista.icone} className="size-5" />
            <span className="text-[0.7rem] font-semibold leading-tight">{conquista.titulo}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
