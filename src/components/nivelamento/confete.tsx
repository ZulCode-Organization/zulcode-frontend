"use client";

import type { CSSProperties } from "react";
import "./nivelamento.css";

const CORES = ["var(--primary)", "#22c55e", "#fbbf24", "#f472b6", "#a78bfa", "#f97316"];

/** Pedaços fixos (o mesmo estouro sempre), espalhados em leque para baixo. */
const PEDACOS = Array.from({ length: 18 }, (_, i) => {
  const angulo = (i / 18) * Math.PI * 2 + (i % 3) * 0.3;
  const distancia = 120 + ((i * 37) % 120);
  return {
    cor: CORES[i % CORES.length],
    x: Math.round(Math.cos(angulo) * distancia + 60),
    y: Math.round(Math.sin(angulo) * distancia * 0.6 + 220),
    r: (i * 83) % 540,
  };
});

/**
 * Um estouro de confete saindo de um ponto. Para estourar de novo, quem usa
 * troca a `key`.
 */
export function Confete({ className }: { className?: string }) {
  return (
    <div aria-hidden className={className} style={{ width: 0, height: 0, pointerEvents: "none" }}>
      {PEDACOS.map((p, i) => (
        <span
          key={i}
          className="zc-niv-confete absolute h-3.5 w-2 rounded-[3px]"
          style={{ background: p.cor, "--x": `${p.x}px`, "--y": `${p.y}px`, "--r": `${p.r}deg` } as CSSProperties}
        />
      ))}
    </div>
  );
}
