"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

interface StickyBottomPanelProps {
  children: ReactNode;
  className?: string;
}

const GAP_RODAPE = 24;

/**
 * O painel rola junto com a página normalmente (como qualquer outro
 * conteúdo) até que, continuando a rolar, ele sairia da tela por cima —
 * nesse momento trava, grudado no rodapé da janela, e fica lá até o fim da
 * página. Não dá pra fazer isso só com `position: sticky` numa direção só:
 * `bottom` não trava nada quando o elemento nasce acima do ponto de trava
 * (o caso daqui), e `top` trava desde o primeiro pixel, sem a fase de
 * rolagem livre — por isso mede a posição a cada scroll e alterna entre
 * fluxo normal e fixed na mão.
 */
export function StickyBottomPanel({ children, className }: StickyBottomPanelProps) {
  const wrapperRef = useRef<HTMLElement>(null);
  const [travado, setTravado] = useState(false);
  const [retangulo, setRetangulo] = useState<{ left: number; width: number; height: number } | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const scrollContainer = wrapper.closest(".zc-scroll-hidden");
    if (!scrollContainer) return;

    let pendente = false;

    const medir = () => {
      pendente = false;
      const conteudo = wrapper.firstElementChild;
      if (!conteudo) return;

      const retanguloWrapper = wrapper.getBoundingClientRect();
      const retanguloConteudo = conteudo.getBoundingClientRect();
      const altura = retanguloConteudo.height;
      const limite = window.innerHeight - altura - GAP_RODAPE;

      setRetangulo({ left: retanguloWrapper.left, width: retanguloWrapper.width, height: altura });
      setTravado(retanguloWrapper.top <= limite);
    };

    const aoRolarOuRedimensionar = () => {
      if (pendente) return;
      pendente = true;
      requestAnimationFrame(medir);
    };

    medir();
    scrollContainer.addEventListener("scroll", aoRolarOuRedimensionar);
    window.addEventListener("resize", aoRolarOuRedimensionar);
    return () => {
      scrollContainer.removeEventListener("scroll", aoRolarOuRedimensionar);
      window.removeEventListener("resize", aoRolarOuRedimensionar);
    };
  }, []);

  return (
    <aside
      ref={wrapperRef}
      className={className}
      style={travado && retangulo ? { height: retangulo.height } : undefined}
    >
      <div
        style={
          travado && retangulo
            ? { position: "fixed", left: retangulo.left, width: retangulo.width, bottom: GAP_RODAPE }
            : undefined
        }
      >
        {children}
      </div>
    </aside>
  );
}
