"use client";

import { useEffect, useRef } from "react";
import { movimentoReduzido } from "@/lib/motion/movimento";

/** Uma pena volta a cada hora — o mesmo intervalo do backend (lives.service). */
export const INTERVALO_DA_PENA_MS = 60 * 60 * 1000;

/** Quanto da hora atual já passou, de 0 a 1. */
export function progressoDaRecarga(proximaEm: string | null | undefined, agora = Date.now()) {
  if (!proximaEm) return null;
  const falta = new Date(proximaEm).getTime() - agora;
  if (!Number.isFinite(falta)) return null;
  return Math.min(1, Math.max(0, 1 - falta / INTERVALO_DA_PENA_MS));
}

/**
 * 7. A recarga da pena, embaixo do chip.
 *
 * Um fio que enche em tempo real até a próxima pena. Não re-renderiza nada a
 * cada segundo: a barra recebe uma única animação linear do ponto atual até o
 * fim, com a duração exata do que falta, e o navegador cuida do resto. Quando
 * termina, avisa quem usa — que busca o perfil de novo e ganha o "+1".
 *
 * Com menos movimento pedido, o fio fica parado no ponto atual: a informação
 * continua lá, só não anda.
 */
export function BarraRecarga({
  proximaEm,
  aoCompletar,
}: {
  proximaEm: string;
  aoCompletar: () => void;
}) {
  const fio = useRef<HTMLSpanElement>(null);
  const completar = useRef(aoCompletar);

  useEffect(() => { completar.current = aoCompletar; });

  useEffect(() => {
    const elemento = fio.current;
    if (!elemento) return;
    const inicio = progressoDaRecarga(proximaEm) ?? 0;
    const falta = Math.max(0, new Date(proximaEm).getTime() - Date.now());

    // A posição atual é escrita direto, para valer mesmo sem animação.
    elemento.style.transform = `scaleX(${inicio})`;
    let relogio: ReturnType<typeof setTimeout> | null = null;
    let animacao: Animation | null = null;

    if (!movimentoReduzido() && typeof elemento.animate === "function") {
      animacao = elemento.animate(
        [{ transform: `scaleX(${inicio})` }, { transform: "scaleX(1)" }],
        { duration: Math.max(falta, 1), easing: "linear", fill: "forwards" },
      );
    }
    // O aviso vem do relógio, não do fim da animação: com movimento reduzido
    // não há animação, mas a pena volta do mesmo jeito. A folga de 1,5s dá
    // tempo para o backend já ter a pena nova quando a busca chegar.
    relogio = setTimeout(() => completar.current(), falta + 1500);

    return () => {
      animacao?.cancel();
      if (relogio) clearTimeout(relogio);
    };
  }, [proximaEm]);

  return (
    <span aria-hidden className="pointer-events-none absolute inset-x-1.5 -bottom-0.5 h-[3px] overflow-hidden rounded-full bg-rose-500/15">
      <span ref={fio} className="block h-full origin-left rounded-full bg-rose-500" style={{ transform: "scaleX(0)" }} />
    </span>
  );
}
