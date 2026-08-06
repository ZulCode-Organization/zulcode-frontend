"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { LicaoTrilha } from "@/lib/types/trilha";
import { LessonNode } from "./lesson-node";

interface LessonTrailProps {
  licoes: LicaoTrilha[];
}

const SHAKE_MS = 400;
const HIGHLIGHT_MS = 900;

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
    // overflow-x-hidden evita que o zigue-zague dos nós crie uma barra de
    // rolagem horizontal na página; o padding lateral garante espaço pro
    // deslocamento sem cortar os nós das pontas.
    <div className="relative overflow-x-hidden px-16 py-8 sm:px-24">
      <div className="relative mx-auto flex max-w-md flex-col items-center gap-12">
        {/* inset-y-0 (em vez de h-full) faz a linha acompanhar a altura real
            do container mesmo com altura automática, então ela sempre vai do
            primeiro ao último nó — sem sobrar nem faltar no final. */}
        <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-border" aria-hidden />

        {licoes.map((licao, index) => (
          <div
            key={licao.id}
            ref={(el) => {
              nodeRefs.current[licao.id] = el;
            }}
            className={cn(
              "animate-fade-in-up relative z-10",
              index % 2 === 0 ? "translate-x-14 sm:translate-x-20" : "-translate-x-14 sm:-translate-x-20"
            )}
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
    </div>
  );
}
