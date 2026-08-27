"use client";

import { ReactNode, RefObject, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const DURACAO_MS = 220;
/** Folga do popover pra borda da janela e pro chip que o abriu. */
const MARGEM = 12;

/**
 * Mesmo corte que separa sidebar (desktop) de barra inferior (mobile) no
 * AppShell: abaixo de lg o app é celular, e os painéis da barra de status
 * viram tela cheia em vez de popover.
 */
export function useEhMobile() {
  const [ehMobile, setEhMobile] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const atualizar = () => setEhMobile(media.matches);
    atualizar();
    media.addEventListener("change", atualizar);
    return () => media.removeEventListener("change", atualizar);
  }, []);
  return ehMobile;
}

/** Fecha com Escape — vale pro popover e pra tela cheia. */
function useEscape(fechar: () => void) {
  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => { if (evento.key === "Escape") fechar(); };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [fechar]);
}

interface PopoverProps {
  /** O chip que abriu o painel — é dele que saem as coordenadas. */
  ancora: RefObject<HTMLElement | null>;
  /** De que lado do chip o painel se alinha. Serve como preferência: se não
   * couber na tela, ele é puxado pra dentro. */
  alinhamento?: "inicio" | "centro" | "fim";
  largura?: number;
  rotulo: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Painel ancorado no chip (só desktop), com a setinha apontando pro ícone.
 *
 * Vai num portal no body, e não dentro da barra, por dois motivos que
 * quebravam ele antes: a barra é `sticky z-20` e por isso cria um contexto de
 * empilhamento — qualquer z-index aqui dentro ficava preso abaixo dela, e o
 * cabeçalho da Jornada (z-30) passava por cima do painel; e o container de
 * rolagem tem `overflow-x: hidden`, que cortava o painel na lateral. Em
 * posição `fixed` no body ele não depende de nenhum dos dois.
 */
export function TopbarPopover({ ancora, alinhamento = "centro", largura = 320, rotulo, onClose, children }: PopoverProps) {
  const painelRef = useRef<HTMLDivElement>(null);
  const [visivel, setVisivel] = useState(false);
  const [caixa, setCaixa] = useState<{ left: number; top: number; seta: number; alturaMax: number } | null>(null);
  useEscape(onClose);

  useLayoutEffect(() => {
    const medir = () => {
      const alvo = ancora.current;
      if (!alvo) return;
      const retangulo = alvo.getBoundingClientRect();

      const preferido =
        alinhamento === "inicio" ? retangulo.left
        : alinhamento === "fim" ? retangulo.right - largura
        : retangulo.left + retangulo.width / 2 - largura / 2;

      // Puxa pra dentro da janela: é isso que impede o painel de ser cortado
      // quando o chip está colado numa das bordas.
      const left = Math.min(Math.max(MARGEM, preferido), window.innerWidth - largura - MARGEM);
      const top = retangulo.bottom + MARGEM;

      // A setinha acompanha o centro do chip, não o do painel — se o painel
      // foi puxado pra dentro, ela continua apontando pro ícone certo.
      const centroDoChip = retangulo.left + retangulo.width / 2;
      const seta = Math.min(Math.max(18, centroDoChip - left), largura - 18);

      setCaixa({ left, top, seta, alturaMax: window.innerHeight - top - MARGEM });
    };

    medir();
    const id = requestAnimationFrame(() => setVisivel(true));
    window.addEventListener("resize", medir);
    // `true` pra pegar a rolagem de qualquer container, não só a da janela.
    document.addEventListener("scroll", medir, true);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", medir);
      document.removeEventListener("scroll", medir, true);
    };
  }, [ancora, alinhamento, largura]);

  useEffect(() => {
    const fecharFora = (evento: MouseEvent | TouchEvent) => {
      const alvo = evento.target as Node;
      if (painelRef.current?.contains(alvo)) return;
      // O próprio chip cuida de abrir e fechar; fechar aqui também faria ele
      // reabrir no clique seguinte e dar impressão de travado.
      if (ancora.current?.contains(alvo)) return;
      onClose();
    };
    document.addEventListener("mousedown", fecharFora);
    document.addEventListener("touchstart", fecharFora);
    return () => {
      document.removeEventListener("mousedown", fecharFora);
      document.removeEventListener("touchstart", fecharFora);
    };
  }, [ancora, onClose]);

  if (!caixa) return null;

  return createPortal(
    <div
      ref={painelRef}
      role="dialog"
      aria-label={rotulo}
      className="fixed z-[60] rounded-[20px] border border-border bg-popover text-popover-foreground shadow-2xl transition-all"
      style={{
        left: caixa.left,
        top: caixa.top,
        width: largura,
        transformOrigin: `${caixa.seta}px 0`,
        transitionDuration: `${DURACAO_MS}ms`,
        transitionTimingFunction: "cubic-bezier(0.34, 1.4, 0.64, 1)",
        opacity: visivel ? 1 : 0,
        transform: `translateY(${visivel ? "0" : "-8px"}) scale(${visivel ? 1 : 0.96})`,
      }}
    >
      {/* Setinha: um quadrado girado, com as mesmas borda e cor do painel — as
          duas faces de baixo ficam escondidas atrás do corpo dele. */}
      <span
        className="absolute -top-[7px] size-3 rotate-45 border-l border-t border-border bg-popover"
        style={{ left: caixa.seta - 6 }}
        aria-hidden
      />
      {/* A rolagem fica aqui dentro, e não no painel, pra setinha não rolar
          junto. O teto de altura é o que impede o painel de passar do pé da
          tela quando a lista é longa. */}
      <div className="zc-scroll-hidden relative overflow-y-auto" style={{ maxHeight: caixa.alturaMax }}>
        {children}
      </div>
    </div>,
    document.body
  );
}

interface SheetProps {
  titulo: string;
  /** Canto direito do cabeçalho (o saldo de moedas, na referência). */
  direita?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Tela cheia do celular: sobe de baixo pra cima cobrindo tudo, com cabeçalho
 * próprio (X, título e um canto livre). Portal em document.body pelo mesmo
 * motivo do MaisMenu — dentro da barra sticky ela não cobriria a tela.
 */
export function TopbarSheet({ titulo, direita, onClose, children }: SheetProps) {
  const [visivel, setVisivel] = useState(false);

  useLayoutEffect(() => {
    const id = requestAnimationFrame(() => setVisivel(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const fechar = () => {
    setVisivel(false);
    window.setTimeout(onClose, DURACAO_MS);
  };
  useEscape(fechar);

  // Trava o scroll do que está atrás enquanto a tela cheia está aberta.
  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = anterior; };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-background transition-transform ease-out"
      style={{
        // Sem passar do ponto aqui: um overshoot subiria além do topo e
        // abriria um vão embaixo da tela.
        transitionDuration: `${DURACAO_MS}ms`,
        transform: visivel ? "translateY(0)" : "translateY(100%)",
      }}
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
    >
      <header
        className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <button
          type="button"
          onClick={fechar}
          aria-label="Fechar"
          className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-muted"
        >
          <X className="size-5" strokeWidth={2.6} />
        </button>
        <h2 className="min-w-0 flex-1 truncate text-center text-base font-black">{titulo}</h2>
        <div className="flex min-w-9 shrink-0 items-center justify-end">{direita}</div>
      </header>

      <div
        className="zc-scroll-hidden flex-1 overflow-y-auto px-4 pt-4"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
