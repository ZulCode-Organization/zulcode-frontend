"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/** O de trás, no alto à direita. */
const ATRAS = "M14.99 2.74 19.82 5.87v6.28L14.99 15.28 10.16 12.15V5.87z";
/** O da frente, embaixo à esquerda, cobrindo um pedaço do outro. */
const FRENTE = "M9.01 8.72 13.84 11.85v6.28L9.01 21.26 4.18 18.13v-6.28z";
/** O corte do brilho, no alto à esquerda do rupee da frente. */
const BRILHO = "M8.65 10.71 6.57 12.06l.83 1.32 2.1-1.35z";

/**
 * Os rupees: a moeda do ZulCode.
 *
 * São dois, um atrás do outro na diagonal — um só lia como "uma pedra", e dois
 * empilhados dizem moeda, quantidade, coisa que se junta.
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
 * tinta clara precisaria saber a cor do fundo pra sumir nele.
 *
 * Os cantos arredondam pelo contorno da mesma cor com junção redonda, em vez de
 * curvas no traçado — a forma continua uma só e o raio acompanha o tamanho.
 */
export function Rupee({ className }: { className?: string; strokeWidth?: number }) {
  // Dois rupees na mesma tela não podem dividir os ids: o segundo apagaria os
  // recortes do primeiro.
  const id = useId();
  const mascaraFolga = `rupee-folga-${id}`;
  const mascaraBrilho = `rupee-brilho-${id}`;

  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-5", className)}>
      <mask id={mascaraFolga}>
        <rect width="24" height="24" fill="#fff" />
        {/* Pintado e contornado em preto: o contorno é o que engorda a
            silhueta e vira a folga entre os dois. */}
        <path d={FRENTE} fill="#000" stroke="#000" strokeWidth="4.8" strokeLinejoin="round" />
      </mask>

      <mask id={mascaraBrilho}>
        <rect width="24" height="24" fill="#fff" />
        <path d={BRILHO} fill="#000" />
      </mask>

      <path
        d={ATRAS}
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
        mask={`url(#${mascaraFolga})`}
      />

      <path
        d={FRENTE}
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
        mask={`url(#${mascaraBrilho})`}
      />
    </svg>
  );
}
