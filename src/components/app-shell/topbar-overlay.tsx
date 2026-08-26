"use client";

import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const DURACAO_MS = 220;

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
  /** De que lado do chip o painel se alinha — os chips da direita abrem pra
   * dentro, senão o painel sairia da tela. */
  alinhamento?: "inicio" | "centro" | "fim";
  largura?: string;
  rotulo: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Painel ancorado no chip (só desktop), com a setinha apontando pro ícone que
 * abriu — é o formato da referência. Sem portal de propósito: ele precisa
 * acompanhar o chip, que é sticky junto com a barra.
 */
export function TopbarPopover({ alinhamento = "centro", largura = "w-[340px]", rotulo, onClose, children }: PopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visivel, setVisivel] = useState(false);
  useEscape(onClose);

  useLayoutEffect(() => {
    const id = requestAnimationFrame(() => setVisivel(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const fecharFora = (evento: MouseEvent | TouchEvent) => {
      const alvo = evento.target as Node;
      // O próprio chip fica fora do painel: sem essa checagem, clicar nele
      // fecharia aqui e reabriria no onClick, dando a impressão de travado.
      if (ref.current && !ref.current.contains(alvo) && !ref.current.parentElement?.contains(alvo)) onClose();
    };
    document.addEventListener("mousedown", fecharFora);
    document.addEventListener("touchstart", fecharFora);
    return () => {
      document.removeEventListener("mousedown", fecharFora);
      document.removeEventListener("touchstart", fecharFora);
    };
  }, [onClose]);

  // O deslocamento do "centro" vai no transform inline (junto com a animação),
  // então aqui só entra a âncora horizontal.
  const posicao = alinhamento === "inicio" ? "left-0" : alinhamento === "fim" ? "right-0" : "left-1/2";
  const seta =
    alinhamento === "inicio" ? "left-6" : alinhamento === "fim" ? "right-6" : "left-1/2 -translate-x-1/2";

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="false"
      aria-label={rotulo}
      className={cn(
        "absolute top-full z-40 mt-3 origin-top rounded-[20px] border border-border bg-popover text-popover-foreground shadow-2xl transition-all ease-out",
        posicao,
        largura
      )}
      style={{
        transitionDuration: `${DURACAO_MS}ms`,
        opacity: visivel ? 1 : 0,
        transform: `${alinhamento === "centro" ? "translateX(-50%) " : ""}translateY(${visivel ? "0" : "-8px"}) scale(${visivel ? 1 : 0.97})`,
      }}
    >
      {/* Setinha: um quadrado girado, com as mesmas borda e cor do painel — as
          duas faces de baixo ficam escondidas atrás do corpo dele. */}
      <span
        className={cn("absolute -top-[7px] size-3 rotate-45 border-l border-t border-border bg-popover", seta)}
        aria-hidden
      />
      <div className="relative">{children}</div>
    </div>
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
      className="fixed inset-0 z-50 flex flex-col bg-background transition-transform ease-out"
      style={{
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
