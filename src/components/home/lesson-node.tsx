import { Lock, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { LicaoTrilha } from "@/lib/types/trilha";

interface LessonNodeProps {
  licao: LicaoTrilha;
  /** Toque num nó bloqueado sacode ele e devolve o usuário pra lição atual. */
  shaking?: boolean;
  /** Pulso de destaque quando o scroll volta pra essa lição (a "atual"). */
  highlighted?: boolean;
  onLockedTap?: () => void;
}

export function LessonNode({ licao, shaking, highlighted, onLockedTap }: LessonNodeProps) {
  const { estado } = licao;
  const bloqueada = estado === "bloqueada";
  const preenchido = estado === "concluida" || estado === "atual";

  return (
    <div className="flex w-[136px] flex-col items-center gap-2">
      {estado === "atual" && (
        <span className="mb-1 rounded-xl border-2 border-primary bg-card px-4.5 py-2 text-[0.75rem] font-black uppercase tracking-[0.09em] text-primary">
          Começar
        </span>
      )}

      {/* Pilha de 3 camadas: anel externo (só no nó atual), sombra sólida e a
          face clicável. No :active a face desce até a sombra, então o nó afunda
          de verdade em vez de só escurecer. Raio fixo em px (não o token
          --radius, que escala com rem) pra manter o quadrado arredondado
          sempre com a mesma proporção, do jeito que era pra ser. */}
      <div className="relative size-[96px] h-[104px]">
        {estado === "atual" && (
          <span
            className={cn(
              "absolute left-0 top-0 size-[96px] rounded-[24px] bg-foreground/10",
              highlighted && "animate-pulse-ring"
            )}
            aria-hidden
          />
        )}

        <span
          className={cn(
            "absolute left-[8px] top-[17px] size-[80px] rounded-[20px]",
            preenchido ? "bg-primary brightness-75" : "bg-border"
          )}
          aria-hidden
        />

        <button
          type="button"
          aria-label={bloqueada ? `${licao.titulo} — bloqueada` : licao.titulo}
          aria-disabled={bloqueada}
          onClick={bloqueada ? onLockedTap : undefined}
          className={cn(
            "absolute left-[8px] top-[8px] flex size-[80px] items-center justify-center rounded-[20px] transition-[top] duration-100 active:top-[15px]",
            preenchido && "bg-primary text-primary-foreground",
            estado === "disponivel" && "border-2 border-primary bg-card text-primary",
            bloqueada && "cursor-not-allowed border-2 border-border bg-muted text-muted-foreground/60",
            shaking && "animate-shake"
          )}
        >
          {bloqueada ? (
            <Lock className="size-7" />
          ) : (
            <Star className="size-8.5 fill-current" strokeWidth={0} />
          )}

          {estado === "concluida" && (
            <span className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full bg-amber-400 text-amber-950 ring-[3px] ring-background">
              <Star className="size-3.5 fill-current" strokeWidth={0} />
            </span>
          )}
        </button>
      </div>

      <span
        className={cn(
          "text-center text-[0.88rem] font-extrabold text-pretty",
          bloqueada ? "text-muted-foreground/60" : "text-primary"
        )}
      >
        {licao.titulo}
      </span>
      <span className="text-center text-[0.78rem] text-muted-foreground">{licao.subtitulo}</span>
      {!bloqueada && (
        <span className="text-[0.8rem] font-extrabold text-primary">+{licao.xp} XP</span>
      )}
    </div>
  );
}
