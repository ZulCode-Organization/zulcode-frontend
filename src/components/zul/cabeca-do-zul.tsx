"use client";

/* eslint-disable @next/next/no-img-element -- As cabeças do Zul são WebP
   animados: o otimizador do Next devolveria só o primeiro quadro. */
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import "./cabeca-do-zul.css";

/** As animações da cabeça (WebP com fundo transparente em public/zul/cabeca). */
export type AnimacaoDaCabeca = "piscando" | "olhando" | "balancando";

/** O que o Zul faz quando reage a um toque. */
export type ReacaoDoZul = "pulo" | "gira" | "treme" | "inclina" | "aperta" | "danca";

/**
 * A reação em andamento. A `chave` muda a cada reação nova: é ela que faz a
 * mesma reação tocar de novo (pular duas vezes seguidas).
 */
export type EstadoDaReacao = { tipo: ReacaoDoZul; chave: number } | null;

/** Guarda a reação atual e dá a função que dispara uma nova. */
export function useReacaoDoZul() {
  const [reacao, setReacao] = useState<EstadoDaReacao>(null);
  const reagir = useCallback((tipo: ReacaoDoZul) => {
    setReacao((anterior) => ({ tipo, chave: (anterior?.chave ?? 0) + 1 }));
  }, []);
  return { reacao, reagir };
}

interface CabecaDoZulProps {
  animacao?: AnimacaoDaCabeca;
  reacao?: EstadoDaReacao;
  /** Flutua devagar para cima e para baixo. */
  flutuar?: boolean;
  /** Entra caindo do alto com um quique (na primeira vez que aparece). */
  cair?: boolean;
  /** A sombra oval embaixo, que encolhe quando ele sobe. */
  sombra?: boolean;
  className?: string;
  alt?: string;
}

/**
 * A cabeça do Zul animada. As camadas ficam separadas para os movimentos não
 * brigarem: a de fora cai e flutua, a do meio reage, e a imagem anima sozinha
 * (pisca, olha, balança). Trocar a `animacao` recomeça o WebP do primeiro quadro.
 */
export function CabecaDoZul({ animacao = "piscando", reacao, flutuar = true, cair = false, sombra = false, className, alt = "" }: CabecaDoZulProps) {
  return (
    <div className={cn("relative", className)}>
      <div className={cn("size-full", cair && "zc-cabeca-cai")}>
        <div className={cn("size-full", flutuar && "zc-cabeca-flutua")}>
          <div key={reacao?.chave ?? 0} data-reacao={reacao?.tipo} className="zc-cabeca-reacao size-full">
            <img
              key={animacao}
              src={`/zul/cabeca/${animacao}.webp`}
              alt={alt}
              draggable={false}
              className="pointer-events-none size-full select-none object-contain"
            />
          </div>
        </div>
      </div>
      {sombra && (
        <span
          aria-hidden
          className="zc-cabeca-sombra absolute -bottom-[14%] left-1/2 -ml-[30%] h-[8%] w-[60%] rounded-[50%] bg-foreground/40"
        />
      )}
    </div>
  );
}
