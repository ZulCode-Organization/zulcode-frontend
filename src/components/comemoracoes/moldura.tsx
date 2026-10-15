"use client";

import { useEffect, useId, type CSSProperties, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { reagir, type Momento } from "@/lib/reacoes";

/**
 * O quadro comum das comemorações em tela cheia: fundo do tema, a peça do meio
 * com o brilho atrás, os textos e o botão de continuar embaixo.
 *
 * O botão só aparece depois da festa (1,4 s): aparecendo junto, o dedo que já
 * estava em cima dele pularia a comemoração sem ver.
 */
export function MolduraDeComemoracao({
  cor, momento, rotulo, titulo, peca, children, aoContinuar, textoDoBotao,
}: {
  /** A cor da tela (brilho, brasas, raios), em hexadecimal. */
  cor: string;
  /** O som e a vibração de quando a peça salta. */
  momento: Momento;
  rotulo?: ReactNode;
  titulo: ReactNode;
  peca: ReactNode;
  children?: ReactNode;
  aoContinuar: () => void;
  /** O texto do botão, quando não é "Continuar". */
  textoDoBotao?: ReactNode;
}) {
  const t = useTranslations("comemoracoes");
  const idDoTitulo = useId();

  // O som entra quando a peça salta, e não quando a tela abre.
  useEffect(() => {
    const id = setTimeout(() => reagir(momento), 260);
    return () => clearTimeout(id);
  }, [momento]);

  return (
    <div role="dialog" aria-modal aria-labelledby={idDoTitulo} className="zc-com" style={{ "--zc-com-cor": cor } as CSSProperties}>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center text-center">
        <div className="relative mb-8 grid place-items-center">
          <span aria-hidden className="zc-com-brilho" />
          {peca}
        </div>
        {rotulo && (
          <p className="zc-com-sobe text-[0.78rem] font-black uppercase tracking-[0.12em]" style={{ color: cor, "--atraso": "900ms" } as CSSProperties}>
            {rotulo}
          </p>
        )}
        <h1 id={idDoTitulo} className="zc-com-sobe mt-1.5 text-[1.9rem] font-black leading-tight tracking-tight" style={{ "--atraso": "980ms" } as CSSProperties}>
          {titulo}
        </h1>
        {children}
      </div>
      <div className="zc-com-sobe mx-auto w-full max-w-md" style={{ "--atraso": "1400ms" } as CSSProperties}>
        <button
          type="button"
          onClick={aoContinuar}
          className="zc-press zc-press-shadow w-full rounded-2xl bg-primary py-3.5 text-[0.8rem] font-black uppercase tracking-[0.06em] text-primary-foreground"
          style={{ ["--zc-press-color" as string]: "color-mix(in srgb, var(--primary) 70%, black)" }}
        >
          {textoDoBotao ?? t("continuar")}
        </button>
      </div>
    </div>
  );
}
