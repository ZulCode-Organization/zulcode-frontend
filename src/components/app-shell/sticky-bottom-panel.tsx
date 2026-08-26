"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

interface StickyBottomPanelProps {
  children: ReactNode;
  className?: string;
}

const GAP_RODAPE = 24;

/** Altura da barra de status (sticky em top-0), publicada por ela mesma em
 * --zc-topbar-h. O fallback só vale até a primeira medição. */
function alturaDaBarra() {
  if (typeof window === "undefined") return 72;
  const valor = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--zc-topbar-h"));
  return Number.isFinite(valor) ? valor : 72;
}

type Modo = "topo" | "fluxo" | "rodape";

/**
 * O painel acompanha a rolagem sem nunca sair da vista, de dois jeitos —
 * qual deles vale depende só de o painel caber ou não na janela:
 *
 * - Cabe: fica grudado logo abaixo da barra de status (sticky no topo). É o
 *   caso comum em telas menores, e é o que evita o buraco que aparecia antes:
 *   a versão antiga só sabia prender no rodapé, então numa janela baixa ela
 *   prendia já na carga e jogava o painel pro pé da tela, deixando um vão
 *   entre a barra de ícones e ele.
 * - Não cabe: rola junto com a página até que, continuando a rolar, sairia
 *   por cima — aí trava grudado no rodapé, pra dar pra ler o painel inteiro.
 *   Não dá pra fazer isso só com `position: sticky`: `bottom` não trava nada
 *   quando o elemento nasce acima do ponto de trava, e `top` travaria desde o
 *   primeiro pixel, sem a fase de rolagem livre.
 */
export function StickyBottomPanel({ children, className }: StickyBottomPanelProps) {
  const wrapperRef = useRef<HTMLElement>(null);
  const [modo, setModo] = useState<Modo>("topo");
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
      const altura = conteudo.getBoundingClientRect().height;
      setRetangulo({ left: retanguloWrapper.left, width: retanguloWrapper.width, height: altura });

      // Cabe entre a barra de status e o pé da janela: gruda no topo e pronto,
      // sem nunca descer sozinho.
      if (altura <= window.innerHeight - alturaDaBarra() - GAP_RODAPE) {
        setModo("topo");
        return;
      }

      // Mais alto que a janela: trava no rodapé só depois que a borda de baixo
      // dele encosta lá — assim a troca acontece sem salto nenhum.
      const limite = window.innerHeight - altura - GAP_RODAPE;
      setModo(retanguloWrapper.top <= limite ? "rodape" : "fluxo");
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

  const travadoNoRodape = modo === "rodape" && retangulo;

  return (
    <aside
      ref={wrapperRef}
      className={className}
      style={
        modo === "topo"
          ? { position: "sticky", top: "var(--zc-topbar-h, 72px)" }
          : travadoNoRodape
          ? { height: retangulo.height }
          : undefined
      }
    >
      <div
        style={
          travadoNoRodape
            ? { position: "fixed", left: retangulo.left, width: retangulo.width, bottom: GAP_RODAPE }
            : undefined
        }
      >
        {children}
      </div>
    </aside>
  );
}
