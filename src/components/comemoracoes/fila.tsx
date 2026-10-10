"use client";

import { useState } from "react";
import { silenciar } from "@/lib/reacoes";
import type { Comemoracao } from "@/lib/types/comemoracao";
import { ComemoracaoConquista } from "./conquista";
import { ComemoracaoDivisao } from "./divisao";
import { ComemoracaoOfensiva } from "./ofensiva";

/**
 * As comemorações uma depois da outra; o "Continuar" da última chama
 * `aoTerminar`. Cada tela é remontada (a `key` muda), então a animação de
 * entrada roda de novo em cada uma.
 */
export function FilaDeComemoracoes({ itens, aoTerminar }: { itens: Comemoracao[]; aoTerminar: () => void }) {
  const [indice, setIndice] = useState(0);
  const atual = itens[indice];
  if (!atual) return null;

  const proxima = () => {
    // A chama da barra pula de novo quando a trilha abre; o som já tocou aqui.
    if (atual.tipo === "ofensiva") silenciar("ofensiva", 60_000);
    if (indice + 1 < itens.length) setIndice(indice + 1);
    else aoTerminar();
  };

  if (atual.tipo === "ofensiva") return <ComemoracaoOfensiva key={indice} ofensiva={atual.ofensiva} aoContinuar={proxima} />;
  if (atual.tipo === "divisao") return <ComemoracaoDivisao key={indice} divisaoId={atual.divisaoId} aoContinuar={proxima} />;
  return <ComemoracaoConquista key={indice} conquista={atual.conquista} aoContinuar={proxima} />;
}
