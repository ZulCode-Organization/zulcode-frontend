"use client";

import { useRef, useState } from "react";
import { CodeXml, Lock, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { LicaoTrilha } from "@/lib/types/trilha";
import { LessonPopup } from "./lesson-popup";

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
  const [popupAberto, setPopupAberto] = useState(false);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const botaoRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    if (bloqueada) {
      onLockedTap?.();
      return;
    }
    setAnchor(botaoRef.current?.getBoundingClientRect() ?? null);
    setPopupAberto(true);
  };

  return (
    <div className="flex w-[136px] flex-col items-center gap-2">
      {estado === "atual" && (
        // Balão "Começar" flutuando por cima do nó (animate-float), bem
        // colado nele. Some com uma transição quando o popup abre, e volta
        // a aparecer, com a mesma transição, quando o popup fecha.
        <div
          className={cn(
            "-mb-3 transition-all duration-200 ease-out",
            popupAberto ? "pointer-events-none scale-75 opacity-0" : "scale-100 opacity-100"
          )}
        >
          <div className="animate-float relative">
            <span className="block rounded-xl border-2 border-primary bg-card px-4.5 py-2 text-[0.75rem] font-black uppercase tracking-[0.09em] text-primary shadow-sm">
              Começar
            </span>
            <span
              className="absolute -bottom-[7px] left-1/2 size-3 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-primary bg-card"
              aria-hidden
            />
          </div>
        </div>
      )}

      {/* Pilha de 3 camadas: anel externo (só no nó atual), sombra sólida e a
          face clicável. No :active a face desce até a sombra, então o nó afunda
          de verdade em vez de só escurecer. Raio fixo em px (não o token
          --radius, que escala com rem) pra manter a proporção sempre igual —
          arredondado o bastante pra não parecer quadrado, sem virar círculo. */}
      <div className="relative size-[96px] h-[104px]">
        {/* Anel só aparece durante o pulso de destaque (voltar pra lição
            atual) — antes ficava sempre visível e virava uma sombra
            esbranquiçada atrás do nó o tempo todo. */}
        {estado === "atual" && highlighted && (
          <span
            className="absolute left-0 top-0 size-[96px] rounded-[34px] bg-foreground/10 animate-pulse-ring"
            aria-hidden
          />
        )}

        <span
          className={cn(
            "absolute left-[8px] top-[17px] size-[80px] rounded-[30px]",
            preenchido ? "bg-primary brightness-75" : "bg-border"
          )}
          aria-hidden
        />

        <button
          ref={botaoRef}
          type="button"
          aria-label={bloqueada ? `${licao.titulo} — bloqueada` : licao.titulo}
          aria-disabled={bloqueada}
          onClick={handleClick}
          className={cn(
            "absolute left-[8px] top-[8px] flex size-[80px] items-center justify-center rounded-[30px] transition-[top] duration-100 active:top-[15px]",
            preenchido && "bg-primary text-primary-foreground",
            estado === "disponivel" && "border-2 border-primary bg-card text-primary",
            bloqueada && "cursor-not-allowed border-2 border-border bg-muted text-muted-foreground/60",
            shaking && "animate-shake"
          )}
        >
          {bloqueada ? (
            <Lock className="size-7" />
          ) : (
            <CodeXml className="size-8" strokeWidth={2.75} />
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
      {licao.subtitulo && (
        <span className="text-center text-[0.78rem] text-muted-foreground">{licao.subtitulo}</span>
      )}
      {!bloqueada && (
        <span className="text-[0.8rem] font-extrabold text-primary">+{licao.xp} XP</span>
      )}

      {popupAberto && anchor && (
        <LessonPopup licao={licao} anchor={anchor} onClose={() => setPopupAberto(false)} />
      )}
    </div>
  );
}
