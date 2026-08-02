import { Check, Lock, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { LicaoTrilha } from "@/lib/types/trilha";

interface LessonNodeProps {
  licao: LicaoTrilha;
}

export function LessonNode({ licao }: LessonNodeProps) {
  const { estado } = licao;
  const interativa = estado !== "bloqueada";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        disabled={!interativa}
        aria-label={licao.titulo}
        className={cn(
          "relative flex size-18 shrink-0 items-center justify-center rounded-2xl transition-transform duration-150 sm:size-20",
          interativa && "active:scale-95",
          estado === "concluida" && "bg-primary text-primary-foreground shadow-lg shadow-primary/25",
          estado === "atual" &&
            "bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-primary/20",
          estado === "disponivel" &&
            "border-2 border-primary bg-card text-primary hover:bg-primary/5",
          estado === "bloqueada" && "cursor-not-allowed bg-muted text-muted-foreground/60"
        )}
      >
        {estado === "concluida" && <Check className="size-7" strokeWidth={2.5} />}
        {estado === "atual" && <Check className="size-7" strokeWidth={2.5} />}
        {estado === "disponivel" && <Play className="size-6 fill-current" />}
        {estado === "bloqueada" && <Lock className="size-6" />}

        {estado === "atual" && (
          <span className="absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full bg-yellow-400 text-yellow-950 ring-4 ring-background">
            <Check className="size-3.5" strokeWidth={3} />
          </span>
        )}
      </button>

      <div className="flex flex-col items-center gap-0.5 text-center">
        <span
          className={cn(
            "text-xs font-extrabold uppercase tracking-wide",
            estado === "atual" && "text-primary",
            estado === "concluida" && "text-foreground",
            estado === "disponivel" && "text-foreground",
            estado === "bloqueada" && "text-muted-foreground/50"
          )}
        >
          {estado === "atual" ? "Começar" : licao.titulo}
        </span>
        <span className="text-[0.7rem] text-muted-foreground">{licao.subtitulo}</span>
        {estado !== "bloqueada" && (
          <span className="text-[0.7rem] font-semibold text-primary">+{licao.xp} XP</span>
        )}
      </div>
    </div>
  );
}
