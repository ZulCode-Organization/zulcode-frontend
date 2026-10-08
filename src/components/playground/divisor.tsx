"use client";

import { cn } from "@/lib/utils";

/** A alça entre dois painéis. É só um traço de 1px — a área de toque maior vem
 *  do ::after em globals.css, para não exigir precisão de cirurgião. */
export function Divisor({
  eixo, arrastando, aoPegar, aoTeclar, rotulo,
}: {
  eixo: "horizontal" | "vertical";
  arrastando: boolean;
  aoPegar: (evento: React.PointerEvent<HTMLDivElement>) => void;
  aoTeclar: (evento: React.KeyboardEvent<HTMLDivElement>) => void;
  rotulo: string;
}) {
  return (
    <div
      role="separator"
      aria-orientation={eixo === "horizontal" ? "vertical" : "horizontal"}
      aria-label={rotulo}
      tabIndex={0}
      data-arrastando={arrastando}
      onPointerDown={aoPegar}
      onKeyDown={aoTeclar}
      className={cn(
        "zc-pg-divisor focus-visible:outline-2 focus-visible:outline-offset-0",
        eixo === "horizontal" ? "zc-pg-divisor-v" : "zc-pg-divisor-h",
      )}
      style={{ outlineColor: "var(--pg-acento)" }}
    />
  );
}
