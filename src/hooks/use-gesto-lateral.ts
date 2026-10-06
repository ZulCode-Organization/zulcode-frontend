"use client";

import { useCallback, useRef, useState } from "react";

/** O quanto o dedo precisa andar pra valer como gesto. Abaixo disso é toque
 * trêmulo, e abrir outra tela por acidente é pior do que não abrir. */
const DISTANCIA_MINIMA = 90;
/** O horizontal precisa dominar o vertical nessa proporção. Sem isso, rolar a
 * trilha na diagonal dispararia o gesto. */
const DOMINIO_HORIZONTAL = 1.8;
/** Acima disso já não é um gesto, é o dedo parado na tela. */
const TEMPO_MAXIMO = 700;
/** Quanto do movimento do dedo o conteúdo acompanha. Menos que 1 porque a tela
 * não vai sair do lugar de verdade: é só o sinal de que algo está vindo. */
const ACOMPANHAMENTO = 0.35;
/** Limite do deslocamento visual, pra trilha não sair da tela num arrasto longo. */
const DESLOCAMENTO_MAXIMO = 70;

/** O elemento (ou algum pai dele) rola na horizontal? A faixa de cursos e as
 * listas deslizantes rolam, e lá o arrasto lateral é delas, não nosso. */
function rolaNaHorizontal(alvo: EventTarget | null) {
  let no = alvo instanceof Element ? alvo : null;
  while (no) {
    if (no.scrollWidth > no.clientWidth + 1) {
      const overflow = getComputedStyle(no).overflowX;
      if (overflow === "auto" || overflow === "scroll") return true;
    }
    no = no.parentElement;
  }
  return false;
}

/**
 * Arrastar pro lado pra abrir outra tela.
 *
 * Devolve o deslocamento atual (pra quem usa mostrar que o gesto está
 * acontecendo) e os manipuladores de toque. Só toque: no computador existe o
 * menu, e um gesto de mouse competiria com a seleção de texto.
 *
 * `aoCompletar` recebe a direção: -1 quando o dedo foi pra esquerda, 1 quando
 * foi pra direita.
 */
export function useGestoLateral(aoCompletar: (direcao: -1 | 1) => void) {
  const inicio = useRef<{ x: number; y: number; t: number } | null>(null);
  const [deslocamento, setDeslocamento] = useState(0);

  const onTouchStart = useCallback((evento: React.TouchEvent) => {
    if (evento.touches.length !== 1 || rolaNaHorizontal(evento.target)) {
      inicio.current = null;
      return;
    }
    const toque = evento.touches[0];
    inicio.current = { x: toque.clientX, y: toque.clientY, t: Date.now() };
  }, []);

  const onTouchMove = useCallback((evento: React.TouchEvent) => {
    const partida = inicio.current;
    if (!partida) return;
    const toque = evento.touches[0];
    const dx = toque.clientX - partida.x;
    const dy = toque.clientY - partida.y;

    // Rolagem vertical ganha: quem está subindo a trilha não quer trocar de
    // tela, e desistir aqui evita o conteúdo tremer de lado enquanto rola.
    if (Math.abs(dy) > Math.abs(dx)) {
      inicio.current = null;
      setDeslocamento(0);
      return;
    }
    const limitado = Math.max(-DESLOCAMENTO_MAXIMO, Math.min(DESLOCAMENTO_MAXIMO, dx * ACOMPANHAMENTO));
    setDeslocamento(limitado);
  }, []);

  const encerrar = useCallback(
    (evento: React.TouchEvent) => {
      const partida = inicio.current;
      inicio.current = null;
      setDeslocamento(0);
      if (!partida) return;

      const toque = evento.changedTouches[0];
      if (!toque) return;
      const dx = toque.clientX - partida.x;
      const dy = toque.clientY - partida.y;
      const tempo = Date.now() - partida.t;

      if (tempo > TEMPO_MAXIMO) return;
      if (Math.abs(dx) < DISTANCIA_MINIMA) return;
      if (Math.abs(dx) < Math.abs(dy) * DOMINIO_HORIZONTAL) return;

      aoCompletar(dx < 0 ? -1 : 1);
    },
    [aoCompletar]
  );

  return {
    deslocamento,
    manipuladores: {
      onTouchStart,
      onTouchMove,
      onTouchEnd: encerrar,
      onTouchCancel: () => {
        inicio.current = null;
        setDeslocamento(0);
      },
    },
  };
}
