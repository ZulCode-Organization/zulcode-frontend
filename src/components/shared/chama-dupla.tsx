/* eslint-disable @next/next/no-img-element -- A chama é uma arte pequena e fixa,
   do tamanho do ícone: o otimizador de imagens não teria o que fazer. */

import { cn } from "@/lib/utils";

/** As faixas da sequência, uma por arte neon. O verde é do gás e não aparece
 *  aqui de propósito: uma chama verde por tempo de sequência faria as duas
 *  coisas parecerem a mesma. As classes são literais porque o Tailwind só gera
 *  o que consegue ler no código. */
export type FaixaDaChama = {
  id: "quente" | "violeta" | "agua";
  /** A partir de quantos dias. */
  desde: number;
  /** Cor do número ao lado, na barra. */
  texto: string;
  /** Fundo sólido na mesma cor, para os dias da semana na dica. */
  fundo: string;
  /** A mesma cor em hexadecimal, para brilho, brasas e confete. */
  cor: string;
  nome: string;
};

export const FAIXAS_DA_CHAMA: FaixaDaChama[] = [
  { id: "quente", desde: 0, texto: "text-orange-500", fundo: "bg-orange-500", cor: "#ff7a3d", nome: "Chama quente" },
  { id: "violeta", desde: 30, texto: "text-violet-500", fundo: "bg-violet-500", cor: "#a855f7", nome: "Chama violeta" },
  { id: "agua", desde: 100, texto: "text-cyan-500", fundo: "bg-cyan-500", cor: "#06b6d4", nome: "Chama verde-água" },
];

/** O gás guardado: o halo e os dias protegidos são verdes. */
export const COR_DO_GAS = { fundo: "bg-emerald-500", cor: "#34d399" };

export function faixaDaChama(dias: number | null | undefined): FaixaDaChama {
  const total = dias ?? 0;
  return [...FAIXAS_DA_CHAMA].reverse().find((faixa) => total >= faixa.desde) ?? FAIXAS_DA_CHAMA[0];
}

/**
 * A chama da sequência: a arte neon, com contorno escuro e brilho por dentro.
 *
 * A cor conta tempo: quente até 29 dias, violeta a partir de 30 e verde-água a
 * partir de 100. É um troféu que a pessoa carrega sem precisar abrir nada.
 *
 * Apagada, fica cinza. `protegido` (gás guardado) põe um halo verde em volta, e
 * vale acima da ofensiva perfeita, que põe um halo dourado. `bruxa` é a chama
 * verde do tema de Halloween.
 *
 * Não há animação aqui, de propósito. Quem anima os momentos (subir, vacilar,
 * nascer na comemoração) é quem usa, uma vez, quando o momento acontece.
 */
export function ChamaDupla({
  className,
  aceso = true,
  protegido = false,
  perfeita = false,
  bruxa = false,
  gelo = false,
  dias,
}: {
  className?: string;
  aceso?: boolean;
  /** Há gás de ofensiva guardado. Só vale com a chama acesa. */
  protegido?: boolean;
  /** Dias de sequência. Sem ele a chama fica na primeira faixa. */
  dias?: number | null;
  /** Ofensiva perfeita: a meta diária cumprida 7 dias seguidos ou mais. */
  perfeita?: boolean;
  /** A chama verde de bruxa, do tema de Halloween. */
  bruxa?: boolean;
  /** A chama de gelo, do tema de Natal: a arte verde-água puxada para o azul-gelo. */
  gelo?: boolean;
}) {
  const faixa = gelo ? FAIXAS_DA_CHAMA[2] : faixaDaChama(dias);
  const filtros = [
    bruxa && "hue-rotate(95deg) saturate(1.3)",
    gelo && "hue-rotate(15deg) saturate(.8) brightness(1.15)",
    !aceso && "grayscale(1) opacity(.45)",
    aceso && protegido && "drop-shadow(0 0 4px rgba(52,211,153,.85))",
    aceso && !protegido && perfeita && "drop-shadow(0 0 4px rgba(251,191,36,.85))",
  ].filter(Boolean).join(" ");

  return (
    <span className={cn("relative inline-flex items-center justify-center", className)}>
      <img
        src={`/barra/chama-${faixa.id}.webp`}
        alt=""
        draggable={false}
        className="h-full w-auto max-w-none select-none transition-[filter] duration-500"
        style={filtros ? { filter: filtros } : undefined}
      />
    </span>
  );
}
