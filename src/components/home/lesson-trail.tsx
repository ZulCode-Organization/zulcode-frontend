"use client";

import { useEffect, useRef, useState } from "react";
import { UnidadeTrilha } from "@/lib/types/trilha";
import { CORES_UNIDADE } from "@/data/trilha";
import { LessonNode } from "./lesson-node";
import { UnitBanner } from "./unit-banner";
import { NextSectionLocked } from "./next-section-locked";

interface LessonTrailProps {
  unidades: UnidadeTrilha[];
}

const SHAKE_MS = 400;
const HIGHLIGHT_MS = 900;

/** Zigue-zague do redesign: começa à esquerda, vai pra direita e volta —
 * o índice roda por todas as unidades sem resetar, senão o desenho pulava
 * de forma estranha bem na virada de cada unidade. */
const ALINHAMENTO = ["justify-start", "justify-end", "justify-center"] as const;

/** Faixa fina perto do topo (abaixo da barra de status + cabeçalho fixo) —
 * a unidade cujo bloco cruza essa faixa vira a "ativa" no cabeçalho. */
const OBSERVER_ROOT_MARGIN = "-140px 0px -70% 0px";

export function LessonTrail({ unidades }: LessonTrailProps) {
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const unidadeRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [shakingId, setShakingId] = useState<string | null>(null);
  const [highlightAtual, setHighlightAtual] = useState(false);
  const [unidadeAtivaIndex, setUnidadeAtivaIndex] = useState(0);

  const licaoAtual = unidades.flatMap((u) => u.licoes).find((licao) => licao.estado === "atual");

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

  // Cabeçalho fixo "escuta" o scroll: a unidade cujo bloco está cruzando a
  // faixa de detecção vira a exibida ali em cima, com nome e cor trocando.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = Number(entry.target.getAttribute("data-unidade-index"));
          if (!Number.isNaN(index)) setUnidadeAtivaIndex(index);
        });
      },
      { rootMargin: OBSERVER_ROOT_MARGIN, threshold: 0 }
    );

    Object.values(unidadeRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [unidades]);

  // Um curso recém-criado pelo administrativo pode ainda não ter nenhuma
  // unidade. Não renderizamos o UnitBanner sem uma unidade válida.
  if (unidades.length === 0) {
    return (
      <div className="mt-7 rounded-3xl border border-dashed bg-card p-8 text-center">
        <h2 className="text-xl font-black">Este curso ainda está sendo preparado</h2>
        <p className="mt-2 text-sm text-muted-foreground">As aulas aparecerão aqui assim que a primeira unidade for cadastrada.</p>
      </div>
    );
  }

  const unidadeAtiva = unidades[unidadeAtivaIndex] ?? unidades[0];
  const corAtiva = CORES_UNIDADE[unidadeAtivaIndex % CORES_UNIDADE.length];
  const ultimaSecao = unidades[unidades.length - 1]?.secao ?? 1;

  let indiceGlobal = 0;

  return (
    <>
      <UnitBanner unidade={unidadeAtiva} cor={corAtiva} unidades={unidades} onUnidadeClick={(index) => unidadeRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" })} />

      {/* Coluna estreita (290px) centralizada: o deslocamento dos nós acontece
          dentro dela, então a trilha nunca gera scroll horizontal na página. */}
      <div className="mx-auto mt-7 flex max-w-[290px] flex-col items-center gap-4 pb-3">
        {unidades.map((unidade, unidadeIndex) => (
          <div
            key={unidade.id}
            ref={(el) => {
              unidadeRefs.current[unidadeIndex] = el;
            }}
            data-unidade-index={unidadeIndex}
            className="flex w-full flex-col items-center gap-4"
          >
            {unidadeIndex > 0 && (
              // Linha cortando a trilha pra separar as unidades, com o
              // número da unidade no meio — como no Duolingo.
              <div className="relative flex w-full items-center justify-center py-2" aria-hidden={false}>
                <div className="absolute inset-x-0 top-1/2 h-px bg-border" aria-hidden />
                <span className="relative rounded-full border border-border bg-background px-4 py-1.5 text-[0.7rem] font-black uppercase tracking-[0.08em] text-muted-foreground">
                  Unidade {unidade.unidade}
                </span>
              </div>
            )}

            {unidade.licoes.map((licao) => {
              const alinhamento = ALINHAMENTO[indiceGlobal % 3];
              const delay = indiceGlobal * 80;
              indiceGlobal += 1;

              return (
                <div
                  key={licao.id}
                  ref={(el) => {
                    nodeRefs.current[licao.id] = el;
                  }}
                  className={`animate-fade-in-up flex w-full ${alinhamento}`}
                  style={{ animationDelay: `${delay}ms` }}
                >
                  <LessonNode
                    licao={licao}
                    shaking={shakingId === licao.id}
                    highlighted={highlightAtual && licao.estado === "atual"}
                    onLockedTap={() => handleLockedTap(licao.id)}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <NextSectionLocked secao={ultimaSecao + 1} />
    </>
  );
}
