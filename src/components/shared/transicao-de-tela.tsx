"use client";

import { createContext, useCallback, useContext, useLayoutEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { bottomNavItems, sidebarNavItems } from "@/components/app-shell/nav-items";
import { cn } from "@/lib/utils";

/**
 * A troca de tela deslizando para o lado.
 *
 * Avançar (abrir uma tela nova) entra pela direita; voltar (a seta, o "voltar"
 * do navegador ou o do Android) entra pela esquerda. Entre as abas da barra,
 * o lado segue a ordem delas: ir da Jornada para a Loja entra pela direita, e
 * da Loja para a Jornada, pela esquerda.
 *
 * Só o conteúdo desliza: a barra de baixo e a lateral ficam paradas, como no
 * Duolingo. Por isso há duas peças:
 * - `TransicaoDoConteudo`, no miolo do AppShell e do admin;
 * - `TransicaoDaPagina`, no template da raiz, que anima a tela inteira só nas
 *   telas sem casca (login, cadastro, boas-vindas...). Quando a tela tem casca,
 *   o conteúdo avisa (o efeito do filho roda antes do do pai) e a página
 *   inteira não se mexe.
 */

const ORDEM_DAS_ABAS = [...new Set([...bottomNavItems, ...sidebarNavItems].map((item) => item.href).filter(Boolean))] as string[];

let rotaAnterior: string | null = null;
let ultimaDirecao = 0;
let voltando = false;

if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    voltando = true;
  });
}

function aba(rota: string) {
  return ORDEM_DAS_ABAS.indexOf(rota);
}

/** -1 entra pela esquerda, 1 pela direita, 0 não anima (a primeira tela do app). Repetir a mesma rota devolve a mesma resposta. */
function direcaoPara(rota: string) {
  if (rota === rotaAnterior) return ultimaDirecao;
  const anterior = rotaAnterior;
  rotaAnterior = rota;
  if (anterior === null) ultimaDirecao = 0;
  else if (voltando) ultimaDirecao = -1;
  else if (aba(anterior) >= 0 && aba(rota) >= 0) ultimaDirecao = aba(rota) > aba(anterior) ? 1 : -1;
  else ultimaDirecao = 1;
  voltando = false;
  return ultimaDirecao;
}

function deslizar(elemento: HTMLElement | null, direcao: number) {
  if (!elemento || !direcao || typeof elemento.animate !== "function") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  elemento.animate(
    [
      { transform: `translateX(${direcao * 36}px)`, opacity: 0.35 },
      { transform: "translateX(0)", opacity: 1 },
    ],
    // Sem fill: no fim a transformação some, e nada de fixed/sticky lá dentro
    // fica preso ao bloco que deslizou.
    { duration: 300, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
  );
}

/** Chamado pelo conteúdo com casca: a página inteira não desliza. */
const AvisarQueAssumiu = createContext<(() => void) | null>(null);

/** A tela inteira desliza, a menos que um conteúdo com casca assuma. Fica no template da raiz. */
export function TransicaoDaPagina({ children }: { children: ReactNode }) {
  const rota = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const assumiu = useRef(false);
  const avisar = useCallback(() => {
    assumiu.current = true;
  }, []);

  useLayoutEffect(() => {
    const direcao = direcaoPara(rota);
    if (!assumiu.current) deslizar(ref.current, direcao);
    // Só na montagem: o template da raiz remonta a cada troca de seção.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AvisarQueAssumiu.Provider value={avisar}>
      <div ref={ref}>{children}</div>
    </AvisarQueAssumiu.Provider>
  );
}

/** Só o miolo desliza; a casca em volta (barras, lateral) fica parada. */
export function TransicaoDoConteudo({ children, className }: { children: ReactNode; className?: string }) {
  const rota = usePathname();
  const avisar = useContext(AvisarQueAssumiu);
  // Roda antes do efeito da TransicaoDaPagina (o do filho vem primeiro), que
  // então deixa a página parada.
  useLayoutEffect(() => {
    avisar?.();
  }, [avisar]);
  return (
    // A chave pela rota remonta o miolo a cada tela, mesmo quando é a mesma
    // página com outro id (o perfil de uma pessoa para o de outra).
    <Deslizante key={rota} rota={rota} className={className}>
      {children}
    </Deslizante>
  );
}

function Deslizante({ rota, className, children }: { rota: string; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    deslizar(ref.current, direcaoPara(rota));
  }, [rota]);
  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}
