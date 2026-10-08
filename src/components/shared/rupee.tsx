"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/** O de trás, no alto à direita. */
const ATRAS = "M14.99 2.74 19.82 5.87v6.28L14.99 15.28 10.16 12.15V5.87z";
/** O da frente, embaixo à esquerda, cobrindo um pedaço do outro. */
const FRENTE = "M9.01 8.72 13.84 11.85v6.28L9.01 21.26 4.18 18.13v-6.28z";
/** O corte do brilho, no alto à esquerda do rupee da frente. */
const BRILHO = "M8.65 10.71 6.57 12.06l.83 1.32 2.1-1.35z";

/** Quanto o rupee da frente anda para virar o único, centralizado. É a
 *  distância do centro dele (9.01, 14.99) ao centro da caixa (12, 12). */
const AO_CENTRO = "translate(2.99px, -2.99px)";
/** Sozinho ele cresce até ocupar a altura que os dois ocupavam juntos — senão
 *  "1 rupee" pareceria um ícone menor, e não um ícone com menos coisa. */
const ESCALA_SOZINHO = 1.42;

/**
 * Os rupees: a moeda do ZulCode.
 *
 * São dois, um atrás do outro na diagonal — um só lia como "uma pedra", e dois
 * empilhados dizem moeda, quantidade, coisa que se junta.
 *
 * Com exatamente 1 rupee na conta, o desenho diz isso: o de trás encolhe e some,
 * e o da frente desliza para o centro e cresce. A troca é animada pelo próprio
 * SVG (transição de CSS nos grupos), então quem passa de 2 para 1 vê o rupee
 * ir embora em vez de ver o ícone trocar de repente.
 *
 * O desenho ocupa quase toda a caixa de propósito. Os ícones vizinhos da barra
 * (a chama e a pena) são sólidos e cheios; um rupee com folga em volta parecia
 * menor que eles no mesmo `size-5`, e o olho lê o tamanho desenhado, não o do
 * elemento.
 *
 * Entre os dois há uma folga, e ela não é enfeite: os dois são da mesma cor, e
 * encostados viravam um borrão de seis lados sem forma reconhecível. A folga é
 * feita tirando do rupee de trás a silhueta do da frente, engordada — assim o
 * vão aparece seja qual for o fundo, inclusive ao trocar de tema.
 *
 * Pelo mesmo motivo o brilho é um furo, e não um risco claro pintado por cima:
 * tinta clara precisaria saber a cor do fundo pra sumir nele. Como o furo vive
 * no espaço do rupee da frente, ele acompanha o rupee quando este se move.
 *
 * Os cantos arredondam pelo contorno da mesma cor com junção redonda, em vez de
 * curvas no traçado — a forma continua uma só e o raio acompanha o tamanho.
 */
export function Rupee({
  className,
  quantidade,
}: {
  className?: string;
  strokeWidth?: number;
  /** Saldo da conta. Só o valor 1 muda o desenho; o cinza do zero é cor, e
   *  quem decide a cor é quem usa o ícone. */
  quantidade?: number | null;
}) {
  // Dois rupees na mesma tela não podem dividir os ids: o segundo apagaria os
  // recortes do primeiro.
  const id = useId();
  const mascaraFolga = `rupee-folga-${id}`;
  const mascaraBrilho = `rupee-brilho-${id}`;
  const sozinho = quantidade === 1;

  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-5 overflow-visible", className)}>
      <mask id={mascaraFolga}>
        <rect width="24" height="24" fill="#fff" />
        {/* Pintado e contornado em preto: o contorno é o que engorda a
            silhueta e vira a folga entre os dois. */}
        <path d={FRENTE} fill="#000" stroke="#000" strokeWidth="4.8" strokeLinejoin="round" />
      </mask>

      <mask id={mascaraBrilho}>
        <rect x="-6" y="-6" width="36" height="36" fill="#fff" />
        <path d={BRILHO} fill="#000" />
      </mask>

      <g
        className="zc-rupee-atras"
        style={{
          transformBox: "fill-box",
          transformOrigin: "center",
          transform: sozinho ? "scale(0.35) rotate(-18deg)" : "none",
          opacity: sozinho ? 0 : 1,
        }}
      >
        <path
          d={ATRAS}
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
          mask={`url(#${mascaraFolga})`}
        />
      </g>

      <g
        className="zc-rupee-frente"
        style={{
          transformBox: "fill-box",
          transformOrigin: "center",
          transform: sozinho ? `${AO_CENTRO} scale(${ESCALA_SOZINHO})` : "none",
        }}
      >
        <path
          d={FRENTE}
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
          mask={`url(#${mascaraBrilho})`}
        />
      </g>
    </svg>
  );
}
