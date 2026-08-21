"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BookOpen } from "lucide-react";
import { ElementoGlossario } from "@/lib/types/elemento";

interface ElementoPopupProps {
  elemento: ElementoGlossario;
  anchor: DOMRect;
  onClose: () => void;
}

const LARGURA_POPUP = 300;
const MARGEM_TELA = 16;
const GAP_ANCORA = 14;
const DURACAO_MS = 180;
const ALTURA_CABECALHO_FIXO = 200;

/**
 * Popup de revisão que nasce grudado no card clicado — mesmo padrão do
 * popup da trilha (lesson-popup.tsx): sem escurecer o resto da tela, cresce
 * a partir do card, e não pode nascer em cima do cabeçalho fixo. Portal em
 * document.body pelo mesmo motivo: os cards animam com transform ao entrar
 * na tela, o que vira containing block pra position:fixed.
 */
export function ElementoPopup({ elemento, anchor, onClose }: ElementoPopupProps) {
  const [visivel, setVisivel] = useState(false);

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

  const alturaPreferida = Math.min(420, window.innerHeight - 32);
  const cabeAbaixo = anchor.bottom + GAP_ANCORA + alturaPreferida <= window.innerHeight - 16;
  const paraCima = !cabeAbaixo && anchor.top - GAP_ANCORA - alturaPreferida > ALTURA_CABECALHO_FIXO;

  const centroAncora = anchor.left + anchor.width / 2;
  const esquerda = Math.min(
    Math.max(centroAncora - LARGURA_POPUP / 2, MARGEM_TELA),
    window.innerWidth - LARGURA_POPUP - MARGEM_TELA
  );
  const espacoDisponivel = paraCima
    ? Math.max(160, anchor.top - GAP_ANCORA - 16)
    : Math.max(160, window.innerHeight - anchor.bottom - GAP_ANCORA - 16);
  const topo = paraCima
    ? Math.max(16, anchor.top - GAP_ANCORA - Math.min(alturaPreferida, espacoDisponivel))
    : anchor.bottom + GAP_ANCORA;
  const posicaoSeta = Math.min(Math.max(centroAncora - esquerda, 24), LARGURA_POPUP - 24);

  return createPortal(
    <>
      <div className="fixed inset-0 z-40" onClick={fechar} role="presentation" />

      <div
        className="fixed z-50 transition-all ease-out"
        style={{
          left: esquerda,
          top: topo,
          bottom: undefined,
          width: LARGURA_POPUP,
          maxHeight: `${espacoDisponivel}px`,
          transitionDuration: `${DURACAO_MS}ms`,
          transformOrigin: `${posicaoSeta}px ${paraCima ? "100%" : "0%"}`,
          opacity: visivel ? 1 : 0,
          transform: visivel ? "scale(1)" : "scale(0.85)",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="elemento-popup-titulo"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div
          className="zc-element-scroll relative overflow-y-auto rounded-[24px] border border-border bg-card p-5 shadow-xl"
          style={{ maxHeight: `${espacoDisponivel}px` }}
        >
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BookOpen className="size-5" />
          </span>

          <h2 id="elemento-popup-titulo" className="mt-3 font-mono text-lg font-black text-foreground">
            {elemento.term}
          </h2>
          <p className="mt-2 text-[0.85rem] leading-relaxed text-muted-foreground">{elemento.meaning}</p>

          <p className="mt-4 text-[0.7rem] font-black uppercase tracking-[0.06em] text-muted-foreground/70">
            Exemplo
          </p>
          <pre className="mt-1.5 whitespace-pre-wrap break-words rounded-xl border border-border bg-muted/50 px-3.5 py-3 font-mono text-[0.8rem] leading-relaxed text-foreground">
            {elemento.example}
          </pre>

          <button
            type="button"
            onClick={fechar}
            className="zc-press zc-press-shadow mt-4 block w-full rounded-[14px] bg-primary py-3 text-center text-[0.78rem] font-black uppercase tracking-[0.06em] text-primary-foreground"
            style={{ ["--zc-press-color" as string]: "color-mix(in srgb, var(--primary) 70%, black)" }}
          >
            Entendi
          </button>
        </div>

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
