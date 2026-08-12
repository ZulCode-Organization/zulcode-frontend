"use client";

import { useRef, useState } from "react";
import { LicaoTrilha } from "@/lib/types/trilha";
import { LessonNode } from "./lesson-node";

interface LessonTrailProps {
  licoes: LicaoTrilha[];
}

const SHAKE_MS = 400;
const HIGHLIGHT_MS = 900;

/** Zigue-zague do redesign: começa à esquerda, vai pra direita e volta. */
const ALINHAMENTO = ["justify-start", "justify-end", "justify-center"] as const;

export function LessonTrail({ licoes }: LessonTrailProps) {
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [shakingId, setShakingId] = useState<string | null>(null);
  const [highlightAtual, setHighlightAtual] = useState(false);

  const licaoAtual = licoes.find((licao) => licao.estado === "atual");

  // Toque numa lição bloqueada não abre nada: sacode o nó tocado e leva o
  // usuário de volta, com scroll suave, pra lição que ele realmente pode fazer.
  const handleLockedTap = (id: string) => {
    setShakingId(id);
    window.setTimeout(() => setShakingId((atual) => (atual === id ? null : atual)), SHAKE_MS);

    if (!licaoAtual) return;
    nodeRefs.current[licaoAtual.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightAtual(true);
    window.setTimeout(() => setHighlightAtual(false), HIGHLIGHT_MS);
  };

  return (
    // Coluna estreita (290px) centralizada: o deslocamento dos nós acontece
    // dentro dela, então a trilha nunca gera scroll horizontal na página.
    <div className="mx-auto mt-7 flex max-w-[290px] flex-col items-center gap-4 pb-3">
      {licoes.map((licao, index) => (
        <div
          key={licao.id}
          ref={(el) => {
            nodeRefs.current[licao.id] = el;
          }}
          className={`animate-fade-in-up flex w-full ${ALINHAMENTO[index % 3]}`}
          style={{ animationDelay: `${index * 80}ms` }}
        >
          <LessonNode
            licao={licao}
            shaking={shakingId === licao.id}
            highlighted={highlightAtual && licao.estado === "atual"}
            onLockedTap={() => handleLockedTap(licao.id)}
          />
        </div>
      ))}
    </div>
  );
}
