"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PerfilUsuario } from "@/lib/types/perfil";
import { SeloConquista } from "@/components/shared/selo-conquista";

type Conquista = NonNullable<PerfilUsuario["conquistas"]>[number];

/** Desbloqueada há menos que isso: o selo leva a etiqueta "NOVA". */
const NOVA_POR = 7 * 24 * 60 * 60 * 1000;

/**
 * As conquistas desbloqueadas. No perfil é um carrossel: 4 por vez, na mesma
 * largura das medalhas logo acima, e o resto rolando para a direita (com o
 * dedo ou com as setas). O "›" do título leva à página com todas.
 *
 * O ícone é desenhado aqui, a partir do id da conquista — antes vinha como SVG
 * cru do banco e era injetado com `dangerouslySetInnerHTML`. Além de feio,
 * aquilo era HTML de dentro do banco entrando direto na página: qualquer
 * conteúdo mal cadastrado virava marcação executada no navegador de quem olha
 * o perfil. Agora o banco manda o id, e quem escolhe o desenho é o front.
 */
export function AchievementsSection({ conquistas = [] }: { conquistas?: PerfilUsuario["conquistas"] }) {
  const lista = conquistas ?? [];

  return (
    <section>
      {lista.length ? (
        <CarrosselDeConquistas conquistas={lista} />
      ) : (
        <>
          <TituloDasConquistas />
          <div className="mt-4 rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
            Conclua missões especiais para desbloquear suas primeiras conquistas.
          </div>
        </>
      )}
    </section>
  );
}

function TituloDasConquistas({ total, children }: { total?: number; children?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Link href="/perfil/conquistas" className="flex items-center gap-1 text-[0.78rem] font-black uppercase tracking-[0.12em] text-muted-foreground">
        Conquistas{total ? <span className="text-muted-foreground/70">· {total}</span> : null}
        <ChevronRight className="size-4" />
      </Link>
      {children}
    </div>
  );
}

/**
 * O carrossel do perfil. Cada selo ocupa um quarto da largura (menos os
 * vãos), então cabem 4 de cada vez em qualquer tela; o resto fica à direita.
 * Rola com o dedo, com a roda do mouse e com as setas do título, que só
 * aparecem quando há mais de 4 e somem no começo e no fim.
 */
function CarrosselDeConquistas({ conquistas }: { conquistas: Conquista[] }) {
  const trilho = useRef<HTMLDivElement>(null);
  const [agora] = useState(() => Date.now());
  const [bordas, setBordas] = useState({ inicio: true, fim: conquistas.length <= 4 });

  // Lê as bordas quando o trilho muda de tamanho (girar o celular, abrir o
  // painel lateral) e a cada rolagem.
  useEffect(() => {
    const el = trilho.current;
    if (!el) return;
    const medir = () => setBordas({ inicio: el.scrollLeft < 4, fim: el.scrollLeft + el.clientWidth > el.scrollWidth - 4 });
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    el.addEventListener("scroll", medir, { passive: true });
    return () => {
      observador.disconnect();
      el.removeEventListener("scroll", medir);
    };
  }, []);

  const andar = (lado: 1 | -1) => trilho.current?.scrollBy({ left: lado * trilho.current.clientWidth, behavior: "smooth" });
  const seta = "grid size-8 place-items-center rounded-full border border-border bg-card text-foreground transition-opacity duration-200 disabled:pointer-events-none disabled:opacity-30";

  return (
    <>
      <TituloDasConquistas total={conquistas.length}>
        {conquistas.length > 4 && (
          <div className="flex gap-1.5">
            <button type="button" aria-label="Conquistas anteriores" className={seta} disabled={bordas.inicio} onClick={() => andar(-1)}>
              <ChevronLeft className="size-4" />
            </button>
            <button type="button" aria-label="Próximas conquistas" className={seta} disabled={bordas.fim} onClick={() => andar(1)}>
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </TituloDasConquistas>
      <div
        ref={trilho}
        className="zc-scroll-hidden mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain"
      >
        {conquistas.map((item, indice) => (
          <div
            key={item.id}
            style={{ animationDelay: `${Math.min(indice, 4) * 35}ms` }}
            className={cn("animate-fade-in-up flex shrink-0 basis-[calc((100%-2.25rem)/4)] snap-start flex-col items-center text-center")}
          >
            <SeloConquista id={item.id} nova={agora - new Date(item.unlockedAt).getTime() < NOVA_POR} className="w-full max-w-[92px]" />
            <p className="mt-1.5 line-clamp-2 w-full text-[0.78rem] font-bold leading-tight text-foreground">{item.title}</p>
          </div>
        ))}
      </div>
    </>
  );
}

/** A grade de selos da página com todas. */
export function ListaDeConquistas({ conquistas }: { conquistas: Conquista[] }) {
  // O agora é lido uma vez, ao montar: o "NOVA" não precisa mudar com a tela aberta.
  const [agora] = useState(() => Date.now());
  return (
    <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-5">
      {conquistas.map((item, indice) => (
        <div
          key={item.id}
          style={{ animationDelay: `${Math.min(indice, 12) * 35}ms` }}
          className="animate-fade-in-up flex flex-col items-center text-center"
        >
          <SeloConquista id={item.id} nova={agora - new Date(item.unlockedAt).getTime() < NOVA_POR} className="w-[118px]" />
          <p className="mt-1.5 line-clamp-1 w-full font-black text-foreground">{item.title}</p>
          <p className="line-clamp-2 w-full text-xs text-muted-foreground">{item.description}</p>
        </div>
      ))}
    </div>
  );
}
