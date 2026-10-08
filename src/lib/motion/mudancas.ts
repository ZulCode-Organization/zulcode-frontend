"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/** O detector de mudança da barra de cima.
 *
 *  Animar "o número mudou" exige saber qual era o número antes — e antes não é
 *  o render anterior. Quem termina uma lição sai da trilha, ganha 30 rupees em
 *  outra tela e volta: quando a barra monta de novo, ela nunca viu o valor
 *  antigo. Por isso o último valor *visto* fica guardado na aba (sessionStorage)
 *  e a comparação é contra ele.
 *
 *  Primeira visita da aba não anima nada: sem valor guardado não há diferença
 *  honesta a mostrar, só um saldo.
 *
 *  É um store fora do React pelo mesmo motivo do estado do editor: o efeito
 *  publica a mudança, o componente assina, e nenhum setState roda dentro de
 *  efeito. */

export type Mudanca = {
  /** Muda a cada evento — use como `key` para refazer a animação. */
  id: number;
  de: number;
  para: number;
};

const PREFIXO = "zulcode:visto:";
const eventos = new Map<string, Mudanca>();
const ouvintes = new Set<() => void>();
let contador = 0;

function lerVisto(chave: string): number | null {
  try {
    const cru = sessionStorage.getItem(PREFIXO + chave);
    if (cru === null) return null;
    const numero = Number(cru);
    return Number.isFinite(numero) ? numero : null;
  } catch {
    return null;
  }
}

function guardarVisto(chave: string, valor: number) {
  try {
    sessionStorage.setItem(PREFIXO + chave, String(valor));
  } catch {
    // Sem armazenamento a barra só deixa de animar diferenças entre telas.
  }
}

/** Registra o valor atual e, se ele diferir do último visto, publica o evento.
 *  Chamar duas vezes com o mesmo valor é inofensivo — o StrictMode faz isso. */
export function registrarValor(chave: string, valor: number) {
  const anterior = lerVisto(chave);
  guardarVisto(chave, valor);
  if (anterior === null || anterior === valor) return;
  eventos.set(chave, { id: ++contador, de: anterior, para: valor });
  for (const ouvinte of ouvintes) ouvinte();
}

function assinar(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  return () => { ouvintes.delete(ouvinte); };
}

/** A última mudança de um valor, ou null se ele nunca mudou nesta aba.
 *
 *  `chave` deve carregar o id da conta: trocar de conta na mesma aba não pode
 *  virar "você perdeu 400 rupees". */
export function useMudanca(chave: string | null, valor: number | null | undefined): Mudanca | null {
  // Só interessa o que acontecer daqui pra frente. Os eventos ficam no módulo,
  // então sem este corte sair da trilha e voltar repetiria a animação de uma
  // mudança antiga — mentir que algo acabou de acontecer.
  const [desde] = useState(() => contador);

  useEffect(() => {
    if (chave && typeof valor === "number" && Number.isFinite(valor)) registrarValor(chave, valor);
  }, [chave, valor]);

  const evento = useSyncExternalStore(
    assinar,
    () => (chave ? eventos.get(chave) ?? null : null),
    () => null,
  );
  return evento && evento.id > desde ? evento : null;
}
