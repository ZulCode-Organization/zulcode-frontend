"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";

/** Divisão arrastável entre dois painéis.
 *
 *  O tamanho vive em uma variável de CSS escrita direto no nó, não em estado do
 *  React, por dois motivos: arrastar re-renderizando a árvore inteira a cada
 *  pixel engasga, e ler o tamanho guardado durante a renderização quebraria a
 *  hidratação — o servidor não tem localStorage. Assim o servidor desenha
 *  sempre o padrão, e o valor guardado entra depois, antes da primeira pintura.
 */

type Opcoes = {
  /** Sufixo da chave em localStorage. */
  chave: string;
  /** Fração inicial do primeiro painel, de 0 a 1. */
  padrao: number;
  eixo: "horizontal" | "vertical";
  min?: number;
  max?: number;
};

const PREFIXO = "zulcode:playground-divisao:";

function guardado(chave: string) {
  try {
    const cru = localStorage.getItem(PREFIXO + chave);
    const valor = cru === null ? NaN : Number(cru);
    return Number.isFinite(valor) ? valor : null;
  } catch {
    return null;
  }
}

export function useDivisao({ chave, padrao, eixo, min = 0.15, max = 0.85 }: Opcoes) {
  const recipiente = useRef<HTMLDivElement | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const fracao = useRef(padrao);

  const aplicar = useCallback((valor: number) => {
    const preso = Math.min(max, Math.max(min, valor));
    fracao.current = preso;
    recipiente.current?.style.setProperty("--pg-divisao", `${(preso * 100).toFixed(3)}%`);
  }, [min, max]);

  useLayoutEffect(() => {
    aplicar(guardado(chave) ?? padrao);
  }, [aplicar, chave, padrao]);

  const aoPegar = useCallback((evento: React.PointerEvent<HTMLDivElement>) => {
    const alvo = recipiente.current;
    if (!alvo) return;
    evento.preventDefault();
    const alca = evento.currentTarget;
    alca.setPointerCapture(evento.pointerId);
    setArrastando(true);

    const mover = (movimento: PointerEvent) => {
      const area = alvo.getBoundingClientRect();
      const valor = eixo === "horizontal"
        ? (movimento.clientX - area.left) / area.width
        : (movimento.clientY - area.top) / area.height;
      if (Number.isFinite(valor)) aplicar(valor);
    };
    const soltar = () => {
      alca.removeEventListener("pointermove", mover);
      alca.removeEventListener("pointerup", soltar);
      alca.removeEventListener("pointercancel", soltar);
      setArrastando(false);
      try {
        localStorage.setItem(PREFIXO + chave, String(fracao.current));
      } catch {
        // Sem espaço para guardar: a divisão vale só nesta sessão.
      }
    };
    alca.addEventListener("pointermove", mover);
    alca.addEventListener("pointerup", soltar);
    alca.addEventListener("pointercancel", soltar);
  }, [aplicar, chave, eixo]);

  /** Teclado: a divisão também precisa andar sem ponteiro. */
  const aoTeclar = useCallback((evento: React.KeyboardEvent<HTMLDivElement>) => {
    const passo = evento.shiftKey ? 0.1 : 0.02;
    const anterior = eixo === "horizontal" ? "ArrowLeft" : "ArrowUp";
    const seguinte = eixo === "horizontal" ? "ArrowRight" : "ArrowDown";
    if (evento.key !== anterior && evento.key !== seguinte) return;
    evento.preventDefault();
    aplicar(fracao.current + (evento.key === seguinte ? passo : -passo));
    try {
      localStorage.setItem(PREFIXO + chave, String(fracao.current));
    } catch {
      // Igual ao caso do ponteiro.
    }
  }, [aplicar, chave, eixo]);

  return { recipiente, arrastando, aoPegar, aoTeclar };
}
