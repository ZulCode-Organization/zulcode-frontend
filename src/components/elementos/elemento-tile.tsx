"use client";

import { useRef, useState } from "react";
import { ElementoGlossario } from "@/data/elementos";
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
        <span className="font-mono text-lg font-black text-foreground">{elemento.termo}</span>
        <span className="text-[0.68rem] font-black uppercase tracking-[0.05em] text-muted-foreground">
          {elemento.apelido}
        </span>
      </button>

      {aberto && anchor && (
        <ElementoPopup elemento={elemento} anchor={anchor} onClose={() => setAberto(false)} />
      )}
    </>
  );
}
