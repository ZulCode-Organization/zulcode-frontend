"use client";

import { useId, useSyncExternalStore, type JSX } from "react";
import { cn } from "@/lib/utils";

/**
 * As molduras em volta do ícone do perfil.
 *
 * Cada uma é um SVG de 200x200 em que o ícone ocupa o quadrado do meio (de 40
 * a 160, os 60% centrais), com os cantos arredondados do perfil. A caixa da
 * moldura sobra um terço do ícone para cada lado (`-inset-[33.333%]`), então
 * ela vai dentro do quadrado do ícone, que precisa ser `relative` e não pode
 * ter `overflow-hidden`. Com borda no quadrado, ela se mede pelo lado de
 * dentro da borda, e o anel da borda fica por baixo dela.
 *
 * As animações são SMIL, do próprio SVG: rodam sem JavaScript e param sozinhas
 * para quem pediu menos movimento no sistema. As miniaturas usam `animar`
 * desligado, para a lista não ter dezenas de animações ao mesmo tempo.
 */

export type MolduraId = "neon" | "codigo" | "galaxia" | "pixel" | "armadura";

export interface InfoDaMoldura {
  id: MolduraId;
  nome: string;
  descricao: string;
  /** Como conseguir, quando não é da loja. */
  detalhe?: string;
}

export const MOLDURAS: InfoDaMoldura[] = [
  { id: "neon", nome: "Neon", descricao: "As cores correm pela borda e o brilho pulsa." },
  { id: "codigo", nome: "Órbita de Código", descricao: "Pedaços de código andando pela borda." },
  { id: "galaxia", nome: "Galáxia", descricao: "Estrelas piscando e um planetinha dando a volta." },
  { id: "pixel", nome: "Pixel 8-bit", descricao: "Borda de videogame antigo com coraçõezinhos." },
  { id: "armadura", nome: "Armadura", descricao: "Placas de metal com brilho verde.", detalhe: "Prêmio da conquista Mês aceso: 30 dias de ofensiva." },
];

export function ehMoldura(id?: string | null): id is MolduraId {
  return MOLDURAS.some((moldura) => moldura.id === id);
}

const MENOS_MOVIMENTO = "(prefers-reduced-motion: reduce)";

function assinarMovimento(aviso: () => void) {
  const consulta = window.matchMedia(MENOS_MOVIMENTO);
  consulta.addEventListener("change", aviso);
  return () => consulta.removeEventListener("change", aviso);
}

/** Se a pessoa pediu menos movimento no sistema (e muda junto se ela trocar). */
export function useMenosMovimento() {
  return useSyncExternalStore(assinarMovimento, () => window.matchMedia(MENOS_MOVIMENTO).matches, () => false);
}

type Traco = { p: string; mexe: boolean };

function Neon({ p, mexe }: Traco) {
  const cor = `url(#${p}c)`;
  return (
    <>
      <defs>
        <linearGradient id={`${p}c`} x1="0" y1="0" x2="1" y2="1">
          {mexe && <animateTransform attributeName="gradientTransform" type="rotate" from="0 0.5 0.5" to="360 0.5 0.5" dur="6s" repeatCount="indefinite" />}
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset="0.5" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#f472b6" />
        </linearGradient>
        <filter id={`${p}b`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      <rect x="32" y="32" width="136" height="136" rx="43" fill="none" stroke={cor} strokeWidth="9" filter={`url(#${p}b)`} opacity={mexe ? undefined : 0.7}>
        {mexe && <animate attributeName="opacity" values="0.4;1;0.4" dur="2.4s" repeatCount="indefinite" />}
      </rect>
      <rect x="32" y="32" width="136" height="136" rx="43" fill="none" stroke={cor} strokeWidth="4.5" />
      <rect x="22" y="22" width="156" height="156" rx="53" fill="none" stroke={cor} strokeWidth="2.2" strokeDasharray="2 10" strokeLinecap="round">
        {mexe && <animate attributeName="stroke-dashoffset" from="0" to="-48" dur="3s" repeatCount="indefinite" />}
      </rect>
      <path d="M166 14l2.4 6 6 2.4-6 2.4-2.4 6-2.4-6-6-2.4 6-2.4z" fill="#e0f7ff">
        {mexe && <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />}
      </path>
      <path d="M28 168l1.8 4.4 4.4 1.8-4.4 1.8-1.8 4.4-1.8-4.4-4.4-1.8 4.4-1.8z" fill="#ffe0f4">
        {mexe && <animate attributeName="opacity" values="0;1;0" dur="2s" begin="1s" repeatCount="indefinite" />}
      </path>
    </>
  );
}

/** O caminho em volta do ícone por onde os pedaços de código andam. */
const TRILHA_DO_CODIGO = "M75 22H125A53 53 0 0 1 178 75V125A53 53 0 0 1 125 178H75A53 53 0 0 1 22 125V75A53 53 0 0 1 75 22Z";

/** Um terço da volta entre um e outro; parados, ficam nos mesmos pontos. */
const PEDACOS_DE_CODIGO = [
  { texto: "</>", largura: 40, borda: "#38bdf8", cor: "#7dd3fc", fonte: 12, inicio: "0s", parado: "100 22" },
  { texto: "{ }", largura: 36, borda: "#a78bfa", cor: "#c4b5fd", fonte: 12, inicio: "-4.67s", parado: "178 119" },
  { texto: ";", largura: 28, borda: "#4ade80", cor: "#86efac", fonte: 13, inicio: "-9.33s", parado: "40 164" },
];

function Codigo({ mexe }: Traco) {
  return (
    <>
      <rect x="31" y="31" width="138" height="138" rx="44" fill="none" stroke="#38bdf8" strokeWidth="3.5" />
      <rect x="22" y="22" width="156" height="156" rx="53" fill="none" stroke="#7dd3fc" strokeWidth="1.6" strokeDasharray="3 7" opacity="0.6">
        {mexe && <animate attributeName="stroke-dashoffset" from="0" to="-40" dur="4s" repeatCount="indefinite" />}
      </rect>
      {PEDACOS_DE_CODIGO.map((pedaco) => (
        <g key={pedaco.texto} transform={mexe ? undefined : `translate(${pedaco.parado})`}>
          {mexe && <animateMotion dur="14s" begin={pedaco.inicio} repeatCount="indefinite" path={TRILHA_DO_CODIGO} />}
          <rect x={-pedaco.largura / 2} y="-12" width={pedaco.largura} height="24" rx="8" fill="#0b1220" stroke={pedaco.borda} strokeWidth="2" />
          <text x="0" y="4.5" textAnchor="middle" fontFamily="ui-monospace, Menlo, Consolas, monospace" fontSize={pedaco.fonte} fontWeight="700" fill={pedaco.cor}>
            {pedaco.texto}
          </text>
        </g>
      ))}
    </>
  );
}

const TRILHA_DA_GALAXIA = "M75 31H125A44 44 0 0 1 169 75V125A44 44 0 0 1 125 169H75A44 44 0 0 1 31 125V75A44 44 0 0 1 75 31Z";

function Galaxia({ p, mexe }: Traco) {
  return (
    <>
      <defs>
        <linearGradient id={`${p}c`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7c3aed" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <rect x="31" y="31" width="138" height="138" rx="44" fill="none" stroke={`url(#${p}c)`} strokeWidth="10" />
      <rect x="31" y="31" width="138" height="138" rx="44" fill="none" stroke="#c4b5fd" strokeWidth="1.6" strokeDasharray="1 7" strokeLinecap="round" />
      <g fill="#ffffff">
        <path d="M14 56l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z">
          {mexe && <animate attributeName="opacity" values="1;0.15;1" dur="1.6s" repeatCount="indefinite" />}
        </path>
        <path d="M186 138l1.4 3.4 3.4 1.4-3.4 1.4-1.4 3.4-1.4-3.4-3.4-1.4 3.4-1.4z">
          {mexe && <animate attributeName="opacity" values="1;0.15;1" dur="1.6s" begin="0.6s" repeatCount="indefinite" />}
        </path>
        <circle cx="178" cy="24" r="2">
          {mexe && <animate attributeName="opacity" values="0.2;1;0.2" dur="2s" repeatCount="indefinite" />}
        </circle>
        <circle cx="24" cy="180" r="1.8">
          {mexe && <animate attributeName="opacity" values="0.2;1;0.2" dur="2s" begin="1s" repeatCount="indefinite" />}
        </circle>
        <circle cx="190" cy="92" r="1.4" />
        <circle cx="10" cy="112" r="1.4" />
      </g>
      <g transform={mexe ? undefined : "translate(156 44)"}>
        {mexe && <animateMotion dur="11s" repeatCount="indefinite" path={TRILHA_DA_GALAXIA} />}
        <ellipse cx="0" cy="0" rx="14" ry="4.2" transform="rotate(-20)" fill="none" stroke="#fde68a" strokeWidth="2.2" />
        <circle cx="0" cy="0" r="7.5" fill="#fb923c" stroke="#1e1b4b" strokeWidth="2" />
      </g>
    </>
  );
}

/** A borda de degraus, que acompanha os cantos arredondados do ícone. */
const DEGRAUS =
  "M66 26H134H142V34H150V42H158V50H166V58H174V66V134V142H166V150H158V158H150V166H142V174H134H66H58V166H50V158H42V150H34V142H26V134V66V58H34V50H42V42H50V34H58V26H66Z";
const CORACAO = "M3 0H9V3H12V0H18V3H21V9H18V12H15V15H12V18H9V15H6V12H3V9H0V3H3Z";
const BRILHO = "M0 3H3V0H6V3H9V6H6V9H3V6H0Z";

function Pixel({ mexe }: Traco) {
  return (
    <>
      <path d={DEGRAUS} fill="none" stroke="#78350f" strokeWidth="11" />
      <path d={DEGRAUS} fill="none" stroke="#fbbf24" strokeWidth="5.5" />
      <path d={DEGRAUS} fill="none" stroke="#fde68a" strokeWidth="1.6" strokeDasharray="4 12">
        {mexe && <animate attributeName="stroke-dashoffset" values="0;-4;-8;-12" dur="0.8s" calcMode="discrete" repeatCount="indefinite" />}
      </path>
      <g transform="translate(4 4)" fill="#ef4444">
        {mexe && <animate attributeName="opacity" values="1;0;1" dur="1s" calcMode="discrete" repeatCount="indefinite" />}
        <path d={CORACAO} />
      </g>
      <g transform="translate(175 178)" fill="#ef4444">
        {mexe && <animate attributeName="opacity" values="1;0;1" dur="1s" begin="0.5s" calcMode="discrete" repeatCount="indefinite" />}
        <path d={CORACAO} />
      </g>
      <path transform="translate(180 8)" d={BRILHO} fill="#ffffff" />
      <path transform="translate(8 182)" d={BRILHO} fill="#ffffff" />
    </>
  );
}

/** Os rebites: no meio de cada lado e no meio de cada canto. */
const REBITES = [
  [100, 34], [166, 100], [100, 166], [34, 100],
  [154.6, 45.4], [154.6, 154.6], [45.4, 154.6], [45.4, 45.4],
];

function Armadura({ mexe }: Traco) {
  // O pathLength de 400 divide a volta em 8 placas iguais (42 de placa e 8 de
  // fresta); o deslocamento centraliza as frestas nos lados e nos cantos.
  const placas = { pathLength: 400, fill: "none", strokeDasharray: "42 8", strokeDashoffset: "-2.4" };
  return (
    <>
      <rect x="34" y="34" width="132" height="132" rx="39" {...placas} stroke="#052e16" strokeWidth="17" />
      <rect x="34" y="34" width="132" height="132" rx="39" {...placas} stroke="#166534" strokeWidth="12" />
      <rect x="27.5" y="27.5" width="145" height="145" rx="45.5" {...placas} stroke="#4ade80" strokeWidth="2" opacity="0.8" />
      <g fill="#bbf7d0" stroke="#052e16" strokeWidth="1.2">
        {REBITES.map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.6" />
        ))}
      </g>
      <rect x="22" y="22" width="156" height="156" rx="53" fill="none" stroke="#22c55e" strokeWidth="2" opacity={mexe ? undefined : 0.6}>
        {mexe && <animate attributeName="opacity" values="0.15;0.9;0.15" dur="2.2s" repeatCount="indefinite" />}
      </rect>
    </>
  );
}

const DESENHOS: Record<MolduraId, (props: Traco) => JSX.Element> = {
  neon: Neon,
  codigo: Codigo,
  galaxia: Galaxia,
  pixel: Pixel,
  armadura: Armadura,
};

/**
 * A moldura em volta do ícone. Sem moldura (ou com um id que não existe mais),
 * não desenha nada.
 */
export function Moldura({ id, animar = true, className }: { id?: string | null; animar?: boolean; className?: string }) {
  // Os ids dos gradientes e filtros precisam ser únicos na página: a mesma
  // moldura aparece no perfil e nas miniaturas ao mesmo tempo.
  const prefixo = `mo${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const menosMovimento = useMenosMovimento();
  if (!ehMoldura(id)) return null;
  const Arte = DESENHOS[id];
  return (
    <span aria-hidden className={cn("pointer-events-none absolute -inset-[33.333%]", className)}>
      <svg viewBox="0 0 200 200" className="block size-full overflow-visible">
        <Arte p={prefixo} mexe={animar && !menosMovimento} />
      </svg>
    </span>
  );
}
