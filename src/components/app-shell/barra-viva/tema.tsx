"use client";

import { useId, useSyncExternalStore, type ReactNode } from "react";
import { API_BASE_URL } from "@/lib/api-config";
import { cn } from "@/lib/utils";
import { ChamaDupla, faixaDaChama } from "@/components/shared/chama-dupla";

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
    .then((corpo: { tema?: TemaDaBarra } | null) => {
      if (corpo?.tema && TEMAS.includes(corpo.tema)) definirTemaDaBarra(corpo.tema);
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
  return tema === "halloween" ? "text-green-500" : faixaDaChama(dias).texto;
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

/** A chama da barra: a mesma do resto do app, verde de bruxa no Halloween. */
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
  return <ChamaDupla {...resto} bruxa={tema === "halloween"} />;
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
// Enfeites do Halloween (Fluent Emoji, da Microsoft, MIT)
// ---------------------------------------------------------------------------

function Abobora({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={className}>
      <path fill="#86d72f" d="M13.743 8h3.507c.407 0 .75-.272.75-.614V4.612c0-.535-.793-.816-1.265-.439l-3.506 2.783c-.483.377-.15 1.044.514 1.044" />
      <path fill="#ff8257" d="M21.438 29h-10.87c-5.718 0-9.830-5.574-8.215-11.137l1.344-4.628C4.770 9.543 8.110 7 11.910 7h8.234c3.830 0 7.200 2.583 8.243 6.337l1.284 4.627C31.216 23.508 27.115 29 21.438 29" />
      <path fill="#321b41" d="M9.413 15h2.172c.353 0 .545-.434.315-.715l-1.113-1.132a.402.402 0 0 0-.637.008l-1.06 1.132c-.214.281-.023.707.323.707m11 0h2.172c.353 0 .545-.434.315-.715l-1.113-1.132a.402.402 0 0 0-.637.008l-1.06 1.132c-.214.281-.023.707.323.707m.97 2H24c0 3.366-2.548 6.194-5.997 7c-.397-.51-1.12-1.226-2.043-1.226c-1.09 0-1.754.689-2.091 1.19C10.489 23.123 8 20.321 8 17h2.607c.417.501 1.11 1.146 1.983 1.146c1.06 0 1.715-.645 2.062-1.146h2.686c.417.501 1.11 1.146 1.983 1.146c1.06 0 1.715-.645 2.062-1.146" />
    </svg>
  );
}

function Morcego({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={className}>
      <path fill="#a56953" d="M19.386 9.585L26.68 2.2l.046-.052c.091-.105.237-.274.393-.189c.232.127.165.372.069.533c-.868 1.456-.914 4.876 2.417 5.533c.143.033.276.276.055.497c-1.05 1.05-2.972 4.475.265 7.071c.114.063.246.232-.143.409l-.121.05c-.787.319-3.93 1.590-2.830 6.656l-6.320-6.320c.675-.607 1.398-2.602-1.104-5.723c-.491-.612-.022-1.081-.022-1.081M9.740 19.230l-7.383 7.294q-.02.021-.052.047c-.105.09-.274.237-.188.393c.126.232.371.165.533.069c1.455-.869 4.875-.915 5.533 2.416c.033.144.276.276.496.056c1.05-1.05 4.475-2.972 7.071.265c.063.114.232.245.41-.144l.05-.12c.318-.788 1.59-3.930 6.656-2.830l-6.320-6.320c-.608.675-2.603 1.397-5.723-1.104c-.613-.492-1.082-.022-1.082-.022" />
      <path fill="#6d4534" d="M22.549 18.073c-.083-.7-.404-1.42-1.076-2.092l-4-4c-.32-.32-.651-.187-.507.51l.309 2.805c-.42.347-1.363 1.187-1.779 1.780l-2.883-.233c-.719-.077-.862.243-.553.553l.585.577c.916.9 2.558 2.515 3.415 3.422c.413.414 1.187.896 2.121 1.023c.535.604 1.374 1.5 2.630 2.756c2.993 2.993 4.545 1.566 5.396.783l.084-.076c1.624-1.624.552-3.470-1.006-5.182c-.81-.89-1.889-1.895-2.736-2.626" />
      <path fill="#ff8687" d="M19.065 20.710c-.448-.447-.42-1.558-.127-1.850c.375-.376 1.569-.266 1.906.071c.215.216.243.530-.530 1.304c-.774.773-1.094.630-1.250.475" />
      <path fill="#1c1c1c" d="M19.5 18a.5.5 0 1 0 0-1a.5.5 0 0 0 0 1m-2 2a.5.5 0 1 0 0-1a.5.5 0 0 0 0 1" />
    </svg>
  );
}

/** Põe um enfeite no canto de baixo do ícone, meio para fora, e abre espaço para ele antes do número. */
export function ComEnfeite({ enfeite, children }: { enfeite: "abobora" | "morcego" | null; children: ReactNode }) {
  if (!enfeite) return <>{children}</>;
  const Enfeite = enfeite === "abobora" ? Abobora : Morcego;
  return (
    <span className="relative mr-2 inline-flex">
      {children}
      <Enfeite className="pointer-events-none absolute -bottom-[12%] -right-[45%] size-[60%]" />
    </span>
  );
}
