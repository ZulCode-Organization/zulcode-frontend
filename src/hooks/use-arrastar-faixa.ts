import { useRef, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";

/**
 * Arrasto horizontal de uma faixa rolável. No toque o navegador já rola
 * sozinho, com a inércia certa, então isso só assume o mouse — e engole o
 * clique quando o gesto virou arrasto, senão soltar em cima de um item
 * dispararia o clique dele sem querer.
 *
 * Usado pela faixa de cursos da barra de status e pelo carrossel de sugestões
 * do perfil.
 */
export function useArrastarFaixa<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const gesto = useRef({ ativo: false, inicioX: 0, inicioScroll: 0, arrastou: false });

  const aoPressionar = (evento: ReactPointerEvent<T>) => {
    if (evento.pointerType !== "mouse" || !ref.current) return;
    gesto.current = { ativo: true, inicioX: evento.clientX, inicioScroll: ref.current.scrollLeft, arrastou: false };
  };

  const aoMover = (evento: ReactPointerEvent<T>) => {
    if (!gesto.current.ativo || !ref.current) return;
    const deslocamento = evento.clientX - gesto.current.inicioX;
    if (!gesto.current.arrastou && Math.abs(deslocamento) > 4) gesto.current.arrastou = true;
    if (gesto.current.arrastou) ref.current.scrollLeft = gesto.current.inicioScroll - deslocamento;
  };

  const aoSoltar = () => { gesto.current.ativo = false; };

  const aoClicar = (evento: ReactMouseEvent<T>) => {
    if (!gesto.current.arrastou) return;
    evento.preventDefault();
    evento.stopPropagation();
    gesto.current.arrastou = false;
  };

  return {
    ref,
    manipuladores: {
      onPointerDown: aoPressionar,
      onPointerMove: aoMover,
      onPointerUp: aoSoltar,
      onPointerCancel: aoSoltar,
      onPointerLeave: aoSoltar,
      onClickCapture: aoClicar,
    },
  };
}
