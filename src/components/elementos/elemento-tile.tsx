"use client";

import { useRef, useState } from "react";
import { ElementoGlossario } from "@/lib/types/elemento";
import { ElementoPopup } from "./elemento-popup";

interface ElementoTileProps {
  elemento: ElementoGlossario;
}

export function ElementoTile({ elemento }: ElementoTileProps) {
  const [aberto, setAberto] = useState(false);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const botaoRef = useRef<HTMLButtonElement>(null);

  const abrir = () => {
    setAnchor(botaoRef.current?.getBoundingClientRect() ?? null);
    setAberto(true);
  };

  return (
    <>
      <button
        ref={botaoRef}
        type="button"
        onClick={abrir}
        className="flex flex-col items-center gap-1.5 rounded-2xl border-2 border-border bg-card px-4 py-5 text-center transition-colors duration-150 hover:border-primary/40"
      >
        <span className="font-mono text-lg font-black text-foreground">{elemento.term}</span>
        <span className="text-[0.68rem] font-black uppercase tracking-[0.05em] text-muted-foreground">
          {elemento.label}
        </span>
      </button>

      {aberto && anchor && (
        <ElementoPopup elemento={elemento} anchor={anchor} onClose={() => setAberto(false)} />
      )}
    </>
  );
}
