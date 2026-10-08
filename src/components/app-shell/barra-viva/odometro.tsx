"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { CURVA, animar } from "@/lib/motion/movimento";

/** Duas voltas de 0 a 9. A segunda existe para a fita poder dar a volta:
 *  de 5 para 3 subindo, um odômetro passa por 6, 7, 8, 9, 0... e não volta
 *  para trás. Parada, a fita mostra sempre a primeira volta. */
const DIGITOS = "01234567890123456789".split("");
const DURACAO_MS = 780;
/** O "vai um": cada casa à esquerda começa um pouco depois da da direita. */
const ESCALONAMENTO_MS = 55;

/**
 * Uma casa do odômetro: a fita de 0 a 9 dentro de uma janela de uma linha.
 *
 * Mudar com a casa na tela é uma transição de CSS — a fita só desliza. Mas a
 * barra quase sempre descobre a mudança depois de já ter desenhado o número
 * novo: quem volta de uma lição encontra o chip montando direto com 23. Para
 * esse caso a casa recebe o algarismo de antes e anima a fita *a partir dele*,
 * com a Web Animations API, até onde ela já está. O resultado é o mesmo nos
 * dois caminhos: o número rola do valor antigo para o novo.
 */
function Casa({
  digito, antes, subindo, atraso, versao, nova,
}: {
  digito: number;
  antes: number | undefined;
  /** O número todo subiu? Decide para que lado a fita gira. */
  subindo: boolean;
  atraso: number;
  versao: number | undefined;
  nova: boolean;
}) {
  const fita = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const elemento = fita.current;
    if (versao === undefined || antes === undefined || antes === digito || !elemento) return;
    const altura = elemento.parentElement?.clientHeight ?? 0;
    if (!altura) return;
    // Subindo, o destino fica sempre "à frente" da origem: 5 → 3 vira 5 → 13,
    // que é o 3 da segunda volta. Descendo, a origem é que vai para a segunda
    // volta: 3 → 5 vira 13 → 5. No fim da animação a fita volta sozinha para
    // a primeira volta, onde o mesmo algarismo está desenhado.
    const de = subindo ? antes : (antes < digito ? antes + 10 : antes);
    const ate = subindo ? (digito < antes ? digito + 10 : digito) : digito;
    animar(elemento, [
      { transform: `translateY(${-de * altura}px)` },
      { transform: `translateY(${-ate * altura}px)` },
    ], { duration: DURACAO_MS + Math.abs(ate - de) * 18, delay: atraso, easing: CURVA.assenta, fill: "backwards" });
    // Só uma vez por mudança: a versão é o id dela.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versao]);

  return (
    <span className={cn("zc-casa", nova && "zc-casa-nova")} style={{ animationDelay: `${atraso}ms` }}>
      <span
        ref={fita}
        className="zc-fita"
        style={{
          transform: `translateY(calc(${-digito} * var(--zc-casa-altura)))`,
          transitionDelay: `${atraso}ms`,
        }}
      >
        {DIGITOS.map((item, posicao) => <span key={posicao}>{item}</span>)}
      </span>
    </span>
  );
}

/**
 * 1. O número que rola.
 *
 * Cada algarismo é uma fita; mudar o número é deslizar as fitas. A direção sai
 * de graça: ganhar rola para cima, perder rola para baixo, como um contador
 * mecânico. As casas são identificadas pela posição a partir da direita, então
 * "29" → "30" mexe as duas casas que já existiam em vez de recriar tudo.
 *
 * `atraso` segura a rolagem até um momento escolhido por quem usa — as rupees
 * só contam quando as moedas chegam no chip, não quando saem.
 */
export function Odometro({
  valor,
  teto,
  anterior,
  versao,
  atraso = 0,
  className,
}: {
  valor: number;
  teto?: number;
  /** O valor de antes, quando há uma mudança a mostrar. */
  anterior?: number;
  /** O id da mudança. Cada id novo faz as casas rolarem de `anterior` até
   *  `valor`, mesmo que o número já esteja desenhado. */
  versao?: number;
  atraso?: number;
  className?: string;
}) {
  const passou = teto !== undefined && valor > teto;
  const texto = (passou ? teto : valor).toLocaleString("pt-BR");
  const casas = [...texto];
  const textoAntes = anterior === undefined
    ? undefined
    : (teto !== undefined && anterior > teto ? teto : Math.max(0, anterior)).toLocaleString("pt-BR");

  return (
    <span className={cn("zc-odometro relative inline-flex tabular-nums", className)}>
      <span className="sr-only">{texto}{passou ? "+" : ""}</span>
      <span aria-hidden className="inline-flex">
        {casas.map((casa, indice) => {
          const daDireita = casas.length - 1 - indice;
          const nova = textoAntes !== undefined && daDireita >= textoAntes.length;
          const atrasoDaCasa = atraso + daDireita * ESCALONAMENTO_MS;
          if (!/\d/.test(casa)) {
            return (
              <span key={`s${daDireita}`} className={cn("inline-block", nova && "zc-casa-nova")} style={{ animationDelay: `${atraso}ms` }}>
                {casa}
              </span>
            );
          }
          const caractereAntes = textoAntes?.[textoAntes.length - 1 - daDireita];
          const antes = textoAntes === undefined
            ? undefined
            : caractereAntes !== undefined && /\d/.test(caractereAntes) ? Number(caractereAntes) : 0;
          return (
            <Casa
              key={`d${daDireita}`}
              digito={Number(casa)}
              antes={nova ? undefined : antes}
              subindo={anterior === undefined || valor >= anterior}
              atraso={atrasoDaCasa}
              versao={versao}
              nova={nova}
            />
          );
        })}
        {passou && <span>+</span>}
      </span>
    </span>
  );
}
