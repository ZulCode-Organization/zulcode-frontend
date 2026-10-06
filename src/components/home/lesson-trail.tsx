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

/** Quantos nós cabem numa volta inteira da serpente. Oito dá os dois lados
 * com um meio-termo entre eles: centro, meio, ponta, meio, centro, e o mesmo
 * do outro lado. */
const PASSOS_DA_VOLTA = 8;
/** Afastamento máximo do centro, em px.
 *
 * O valor sai da proporção medida na referência: a amplitude é ~0,8 do passo
 * vertical entre dois nós. É essa razão que faz a trilha ler como serpente — e
 * ela é a mesma em qualquer tela, porque é a forma do desenho, não um limite de
 * espaço. Uma amplitude maior no computador transformava a curva num ziguezague
 * largo, com os nós soltos em vez de encadeados. */
const AMPLITUDE = 80;

/**
 * O deslocamento lateral de cada nó.
 *
 * Antes isto era uma lista de três alinhamentos (esquerda, direita, centro)
 * girando com %3. Como a lista reinicia, o nó saltava do centro direto pra
 * esquerda a cada três — o desenho virava uma escada, com degraus retos e um
 * pulo na volta.
 *
 * O seno não tem volta: ele passa pelos meios-termos nos dois sentidos e emenda
 * o fim do ciclo no começo sem degrau. É o que faz a trilha ler como uma
 * serpente em vez de uma escada.
 *
 * O índice corre por todas as unidades sem resetar, senão o desenho daria um
 * salto bem na virada de cada uma.
 */
function deslocamentoDoNo(indice: number) {
  return Math.round(Math.sin((indice / PASSOS_DA_VOLTA) * Math.PI * 2) * AMPLITUDE);
}

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

  // Onde cada unidade começa na contagem corrida de lições. A serpente e a
  // cascata de entrada dependem da posição global do nó, não da posição dele
  // dentro da unidade — senão o desenho reiniciaria a cada divisória.
  //
  // É calculado antes de desenhar, e não num contador incrementado no meio do
  // JSX: mutar variável durante o render quebra quando o React interrompe e
  // retoma uma renderização, e o mesmo nó sairia com índices diferentes.
  const inicioDaUnidade = unidades.reduce<number[]>((acc, unidade, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + unidades[i - 1].licoes.length);
    return acc;
  }, []);

  return (
    <>
      <UnitBanner unidade={unidadeAtiva} cor={corAtiva} unidades={unidades} onUnidadeClick={(index) => unidadeRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" })} />

      {/* Coluna estreita (290px) centralizada: o deslocamento dos nós acontece
          dentro dela, então a trilha nunca gera scroll horizontal na página. */}
      <div className="mx-auto mt-7 flex max-w-[300px] flex-col items-center gap-3 pb-3">
        {unidades.map((unidade, unidadeIndex) => (
          <div
            key={unidade.id}
            ref={(el) => {
              unidadeRefs.current[unidadeIndex] = el;
            }}
            data-unidade-index={unidadeIndex}
            className="flex w-full flex-col items-center gap-3"
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

            {unidade.licoes.map((licao, licaoIndex) => {
              const indiceGlobal = inicioDaUnidade[unidadeIndex] + licaoIndex;
              const deslocamento = deslocamentoDoNo(indiceGlobal);
              const delay = indiceGlobal * 80;

              return (
                <div
                  key={licao.id}
                  ref={(el) => {
                    nodeRefs.current[licao.id] = el;
                  }}
                  // O desvio vai em `left`, e não em transform: o
                  // animate-fade-in-up termina em `transform: translateY(0)`
                  // com fill-mode both, e animação vence estilo inline — um
                  // translateX aqui era apagado e a trilha saía toda reta.
                  className="animate-fade-in-up relative flex w-full justify-center"
                  style={{ animationDelay: `${delay}ms`, left: `${deslocamento}px` }}
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
