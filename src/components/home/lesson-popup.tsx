"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { CodeXml } from "lucide-react";
import { LicaoTrilha } from "@/lib/types/trilha";

interface LessonPopupProps {
  licao: LicaoTrilha;
  /** Retângulo do botão que foi clicado — o popup nasce grudado nele. */
  anchor: DOMRect;
  onClose: () => void;
}

const LARGURA_POPUP = 272;
const MARGEM_TELA = 16;
const GAP_ANCORA = 14;
const DURACAO_MS = 180;
/** Barra de status + banner fixo da unidade — o popup não pode nascer em
 * cima deles, senão corta o cabeçalho (topbar ~72px + banner ~110px). */
const ALTURA_CABECALHO_FIXO = 200;

/**
 * Popup que nasce grudado no nó clicado — sem escurecer o resto da tela,
 * a jornada continua visível e "viva" atrás dele. Cresce a partir do nó
 * (transform-origin) e soma a mesma animação, invertida, pra sair.
 *
 * Portal em document.body: os nós da trilha animam com transform
 * (animate-fade-in-up), e qualquer ancestral com transform vira containing
 * block pra position:fixed — sem o portal, o popup ficaria preso dentro do
 * nó em vez de acompanhar a página inteira.
 */
export function LessonPopup({ licao, anchor, onClose }: LessonPopupProps) {
  const router = useRouter();
  const [visivel, setVisivel] = useState(false);

  // Liga a transição de entrada só depois do primeiro paint, senão o
  // navegador junta o estado inicial e o final num frame só e não anima nada.
  useLayoutEffect(() => {
    const id = requestAnimationFrame(() => setVisivel(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const fechar = () => {
    setVisivel(false);
    window.setTimeout(onClose, DURACAO_MS);
  };

  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") fechar();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prefere aparecer acima do nó; se não couber sem invadir o cabeçalho
  // fixo (topbar + banner da unidade), aparece abaixo.
  const alturaEstimada = 230;
  const paraCima = anchor.top - alturaEstimada - GAP_ANCORA > ALTURA_CABECALHO_FIXO;

  const centroAncora = anchor.left + anchor.width / 2;
  const esquerda = Math.min(
    Math.max(centroAncora - LARGURA_POPUP / 2, MARGEM_TELA),
    window.innerWidth - LARGURA_POPUP - MARGEM_TELA
  );
  const topo = paraCima ? anchor.top - GAP_ANCORA : anchor.bottom + GAP_ANCORA;
  const posicaoSeta = Math.min(
    Math.max(centroAncora - esquerda, 24),
    LARGURA_POPUP - 24
  );

  return createPortal(
    <>
      {/* Captador invisível: fecha ao tocar fora, sem escurecer nada. */}
      <div className="fixed inset-0 z-40" onClick={fechar} role="presentation" />

      <div
        className="fixed z-50 transition-all ease-out"
        style={{
          left: esquerda,
          top: paraCima ? undefined : topo,
          bottom: paraCima ? window.innerHeight - topo : undefined,
          width: LARGURA_POPUP,
          transitionDuration: `${DURACAO_MS}ms`,
          transformOrigin: `${posicaoSeta}px ${paraCima ? "100%" : "0%"}`,
          opacity: visivel ? 1 : 0,
          transform: visivel ? "scale(1)" : "scale(0.85)",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lesson-popup-title"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="relative rounded-[24px] border border-border bg-card p-5 text-center shadow-xl">
          <span className="mx-auto flex size-14 items-center justify-center rounded-[22px] bg-primary text-primary-foreground">
            <CodeXml className="size-7" strokeWidth={2.75} />
          </span>

          <h2 id="lesson-popup-title" className="mt-3 text-base font-black text-foreground">
            {licao.titulo}
          </h2>
          <p className="mt-0.5 text-[0.82rem] text-muted-foreground">{licao.subtitulo}</p>
          <p className="mt-1.5 text-[0.82rem] font-extrabold text-primary">+{licao.xp} XP</p>

          <button
            type="button"
            onClick={() => router.push(`/atividade/${licao.id}`)}
            className="zc-press zc-press-shadow mt-4 block w-full rounded-[14px] bg-primary py-3 text-center text-[0.78rem] font-black uppercase tracking-[0.06em] text-primary-foreground"
            style={{ ["--zc-press-color" as string]: "color-mix(in srgb, var(--primary) 70%, black)" }}
          >
            Começar
          </button>

          <button
            type="button"
            onClick={fechar}
            className="mt-3 text-[0.75rem] font-black uppercase tracking-[0.05em] text-muted-foreground"
          >
            Fechar
          </button>
        </div>

        {/* Raboinho apontando pro nó que foi clicado. */}
        <span
          className={
            paraCima
              ? "absolute -bottom-[7px] size-3.5 rotate-45 rounded-[2px] border-b border-r border-border bg-card"
              : "absolute -top-[7px] size-3.5 rotate-45 rounded-[2px] border-l border-t border-border bg-card"
          }
          style={{ left: posicaoSeta - 7 }}
          aria-hidden
        />
      </div>
    </>,
    document.body
  );
}
