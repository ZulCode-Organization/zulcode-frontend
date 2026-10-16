"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { PenaDesgastada, PenaInfinita } from "@/components/shared/pena-desgastada";
import { ChamaDupla } from "@/components/shared/chama-dupla";

interface BarraDaAulaProps {
  progresso: number;
  /** Acertos seguidos: a partir de 2 aparece o "N seguidas!", a partir de 3 a barra fica roxa. */
  seguidas: number;
  vidas: number;
  vidasIlimitadas?: boolean;
  onSair: () => void;
}

/**
 * A barra de cima da aula: enche como líquido (a onda anda por dentro e a ponta
 * balança quando ela sobe), brilha a cada passo e esquenta com acertos seguidos.
 */
export function BarraDaAula({ progresso, seguidas, vidas, vidasIlimitadas, onSair }: BarraDaAulaProps) {
  const cheio = useRef<HTMLDivElement>(null);
  const anterior = useRef(progresso);

  // Cada subida reinicia o balanço e o brilho, sem recriar a barra: assim a
  // largura continua deslizando do valor antigo para o novo.
  useEffect(() => {
    const el = cheio.current;
    if (el && progresso > anterior.current) {
      el.removeAttribute("data-anda");
      void el.offsetWidth;
      el.setAttribute("data-anda", "true");
    }
    anterior.current = progresso;
  }, [progresso]);

  return (
    <div className="flex items-center gap-4 px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] lg:px-8">
      <button
        type="button"
        onClick={onSair}
        aria-label="Sair da lição"
        className="flex size-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
      >
        <X className="size-6" strokeWidth={2.6} />
      </button>

      <div className="relative flex-1">
        <div
          className="zc-aula-barra"
          data-chamas={seguidas >= 3}
          role="progressbar"
          aria-valuenow={progresso}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div ref={cheio} className="zc-aula-barra-cheio" style={{ width: `${progresso}%` }}>
            <span className="zc-aula-barra-roxo" />
            <span className="zc-aula-barra-onda" />
            <span className="zc-aula-barra-onda" data-dois />
            <span className="zc-aula-barra-reflexo" />
          </div>
        </div>
        {seguidas >= 2 && (
          <span key={seguidas} className="zc-aula-combo">
            <ChamaDupla className="size-5" />
            {seguidas} seguidas!
          </span>
        )}
      </div>

      <span
        className="flex shrink-0 items-center gap-1.5 text-sm font-black text-rose-500"
        title={vidasIlimitadas ? "Penas ilimitadas" : `${vidas} penas restantes`}
      >
        {vidasIlimitadas ? (
          <PenaInfinita className="size-8" />
        ) : (
          <>
            <PenaDesgastada restantes={vidas} className="size-8" />
            {vidas}
          </>
        )}
      </span>
    </div>
  );
}
