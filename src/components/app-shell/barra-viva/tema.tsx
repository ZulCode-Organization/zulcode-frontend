"use client";

import { useEffect, useId, useSyncExternalStore, type ReactNode } from "react";
import { API_BASE_URL } from "@/lib/api-config";
import { aplicarIconeDoApp } from "@/lib/icone-do-app";
import { cn } from "@/lib/utils";
import { ChamaDupla, faixaDaChama } from "@/components/shared/chama-dupla";
import { Enfeite, type NomeDoEnfeite } from "@/components/shared/enfeite";

// ---------------------------------------------------------------------------
// O tema
// ---------------------------------------------------------------------------

export type TemaDaBarra = "normal" | "halloween" | "natal";
const TEMAS: TemaDaBarra[] = ["normal", "halloween", "natal"];
const GUARDADO = "zc-tema-da-barra";

/**
 * O tema da barra de cima. Quem liga e desliga é o administrativo; aqui ele é
 * lido uma vez por abertura do app. Enquanto a resposta não chega, vale o
 * último que este aparelho viu, para a barra não trocar de roupa na frente da
 * pessoa a cada abertura.
 */
let atual: TemaDaBarra | null = null;
let buscou = false;
const ouvintes = new Set<() => void>();

function lerGuardado(): TemaDaBarra {
  try {
    const valor = localStorage.getItem(GUARDADO) as TemaDaBarra | null;
    return valor && TEMAS.includes(valor) ? valor : "normal";
  } catch {
    return "normal";
  }
}

export function definirTemaDaBarra(tema: TemaDaBarra) {
  atual = tema;
  try {
    localStorage.setItem(GUARDADO, tema);
  } catch {
    // Sem armazenamento, o tema vale só até fechar.
  }
  ouvintes.forEach((avisar) => avisar());
}

function buscar() {
  if (buscou) return;
  buscou = true;
  fetch(`${API_BASE_URL}/tema`)
    .then((resposta) => (resposta.ok ? resposta.json() : null))
    .then((corpo: { tema?: TemaDaBarra; icone?: string } | null) => {
      if (corpo?.tema && TEMAS.includes(corpo.tema)) definirTemaDaBarra(corpo.tema);
      // O ícone do app vem na mesma resposta, mas é independente do tema.
      if (corpo?.icone) void aplicarIconeDoApp(corpo.icone);
    })
    .catch(() => {
      // Sem rede, fica o último que se viu.
    });
}

function assinar(avisar: () => void) {
  ouvintes.add(avisar);
  buscar();
  return () => ouvintes.delete(avisar);
}

export function useTemaDaBarra(): TemaDaBarra {
  return useSyncExternalStore(
    assinar,
    () => (atual ??= lerGuardado()),
    () => "normal",
  );
}

// ---------------------------------------------------------------------------
// As cores dos números
// ---------------------------------------------------------------------------

export function corDaChama(dias: number | null | undefined, tema: TemaDaBarra) {
  if (tema === "halloween") return "text-green-500";
  if (tema === "natal") return "text-sky-400";
  return faixaDaChama(dias).texto;
}

export const COR_DO_RUPEE: Record<TemaDaBarra, string> = {
  normal: "text-emerald-500",
  halloween: "text-orange-500",
  natal: "text-red-500",
};

export const COR_DA_PENA: Record<TemaDaBarra, string> = {
  normal: "text-violet-500",
  halloween: "text-violet-500",
  natal: "text-green-600 dark:text-green-500",
};

// ---------------------------------------------------------------------------
// A chama neon
// ---------------------------------------------------------------------------

/** A chama da barra: a mesma do resto do app, verde de bruxa no Halloween e de gelo no Natal. */
export function ChamaNeon({
  tema, ...resto
}: {
  dias: number | null | undefined;
  aceso?: boolean;
  protegido?: boolean;
  perfeita?: boolean;
  tema: TemaDaBarra;
  className?: string;
}) {
  return <ChamaDupla {...resto} bruxa={tema === "halloween"} gelo={tema === "natal"} />;
}

// ---------------------------------------------------------------------------
// A pena
// ---------------------------------------------------------------------------

/** O desenho é o "feather-pen" do Streamline Plump (CC BY 4.0). */
const PALHETA = "M11.999 41a32.85 32.85 0 0 0 16.68-4.52c.665-.39.61-1.348-.081-1.691L25 33c3.303 0 10-1.337 10-1.337c7.147-6.948 10.78-16.97 9.848-26.842a1.85 1.85 0 0 0-1.67-1.67A33.2 33.2 0 0 0 28 5.25S26.348 9.142 26 11l-2.024-2.817a.98.98 0 0 0-1.309-.271C13.264 13.687 7 23.36 7 36.5";
const HASTE = "M3 45c5-14.5 21-27 34-34";
/** O pedaço da haste que fica para fora da pena, embaixo. */
const PONTA_DA_HASTE = "M3 45c2-5.8 5-11.2 8.5-16";
/** Os dois lados da haste: depois da ponta ela segue reta até sair da caixa. */
const LADO_DE_CIMA = "M3 45C8 30.5 24 18 37 11L56 1V-8H-8V56Z";
const LADO_DE_BAIXO = "M3 45C8 30.5 24 18 37 11L56 1V56H-6Z";

/** A cor da pena em cada tema. As classes são literais para o Tailwind gerar. */
const COR_DA_PENA_NO_TEMA = {
  normal: "text-violet-500",
  halloween: "text-violet-600 dark:text-violet-400",
  natal: "text-green-600 dark:text-green-500",
  vazia: "text-muted-foreground/60",
};

/**
 * A pena: cheia, com a haste vazada, nas duas camadas dos outros ícones do
 * app. A haste divide a pena em duas metades; a de cima é cheia e a de baixo
 * é translúcida, na mesma cor. A haste é um recorte, então mostra o fundo em
 * qualquer tema. Sem penas, fica cinza.
 */
export function PenaDaBarra({ tema, vazia = false, className }: { tema: TemaDaBarra; vazia?: boolean; className?: string }) {
  const id = useId();
  const recorte = `pena-haste-${id}`;
  const cima = `pena-cima-${id}`;
  const baixo = `pena-baixo-${id}`;
  const cheia = <path d={PALHETA} fill="currentColor" stroke="currentColor" strokeWidth={3} strokeLinejoin="round" />;

  return (
    <svg viewBox="0 0 48 48" aria-hidden className={cn("size-5 overflow-visible", COR_DA_PENA_NO_TEMA[vazia ? "vazia" : tema], className)}>
      <defs>
        <mask id={recorte}>
          <rect x="-10" y="-10" width="70" height="70" fill="#fff" />
          <path d={HASTE} fill="none" stroke="#000" strokeWidth={3.4} strokeLinecap="round" />
        </mask>
        <clipPath id={cima}><path d={LADO_DE_CIMA} /></clipPath>
        <clipPath id={baixo}><path d={LADO_DE_BAIXO} /></clipPath>
      </defs>
      <g mask={`url(#${recorte})`}>
        <g clipPath={`url(#${cima})`}>{cheia}</g>
        <g clipPath={`url(#${baixo})`} opacity={0.5}>{cheia}</g>
      </g>
      <path d={PONTA_DA_HASTE} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Enfeites dos eventos
// ---------------------------------------------------------------------------

/** O enfeite do rupee e o da pena em cada evento. */
export const ENFEITES_DA_BARRA: Record<TemaDaBarra, { rupee: NomeDoEnfeite | null; pena: NomeDoEnfeite | null }> = {
  normal: { rupee: null, pena: null },
  halloween: { rupee: "abobora", pena: "morcego" },
  natal: { rupee: "presente", pena: "arvore" },
};

/** Põe um enfeite no canto de baixo do ícone, meio para fora, e abre espaço para ele antes do número. */
export function ComEnfeite({ enfeite, children }: { enfeite: NomeDoEnfeite | null; children: ReactNode }) {
  if (!enfeite) return <>{children}</>;
  return (
    <span className="relative mr-2 inline-flex">
      {children}
      <Enfeite nome={enfeite} className="absolute -bottom-[12%] -right-[45%] size-[60%]" />
    </span>
  );
}

/**
 * Pinta o app inteiro com o evento ligado: marca o <html> com `data-evento`,
 * e as cores do evento (em globals.css) passam por cima do tema da loja.
 * Fora de evento, a marca sai e volta o tema de cada pessoa.
 */
export function EventoNoApp() {
  const tema = useTemaDaBarra();
  useEffect(() => {
    const raiz = document.documentElement;
    if (tema === "normal") delete raiz.dataset.evento;
    else raiz.dataset.evento = tema;
  }, [tema]);
  return null;
}
