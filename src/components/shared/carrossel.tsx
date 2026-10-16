"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Uma fileira que rola para o lado: com o dedo, a roda do mouse ou as setas
 * do título. As setas só aparecem quando há o que rolar e somem no começo e
 * no fim. Cada filho encaixa no começo ao soltar.
 */
export function Carrossel({ titulo, children, className }: { titulo: ReactNode; children: ReactNode; className?: string }) {
  const trilho = useRef<HTMLDivElement>(null);
  const [bordas, setBordas] = useState({ inicio: true, fim: true });

  useEffect(() => {
    const el = trilho.current;
    if (!el) return;
    const medir = () => setBordas({ inicio: el.scrollLeft < 4, fim: el.scrollLeft + el.clientWidth > el.scrollWidth - 4 });
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    el.addEventListener("scroll", medir, { passive: true });
    return () => {
      observador.disconnect();
      el.removeEventListener("scroll", medir);
    };
  }, []);

  const andar = (lado: 1 | -1) => trilho.current?.scrollBy({ left: lado * trilho.current.clientWidth * 0.8, behavior: "smooth" });
  const seta = "grid size-8 place-items-center rounded-full border border-border bg-card text-foreground transition-opacity duration-200 disabled:pointer-events-none disabled:opacity-30";
  const rola = !(bordas.inicio && bordas.fim);

  return (
    <section className={className}>
      <div className="mb-2.5 flex items-center justify-between gap-2">
        {titulo}
        {rola && (
          <div className="flex gap-1.5">
            <button type="button" aria-label="Voltar" className={seta} disabled={bordas.inicio} onClick={() => andar(-1)}>
              <ChevronLeft className="size-4" />
            </button>
            <button type="button" aria-label="Avançar" className={seta} disabled={bordas.fim} onClick={() => andar(1)}>
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </div>
      <div ref={trilho} className={cn("zc-scroll-hidden flex snap-x snap-mandatory gap-2.5 overflow-x-auto overscroll-x-contain pb-1")}>
        {children}
      </div>
    </section>
  );
}
