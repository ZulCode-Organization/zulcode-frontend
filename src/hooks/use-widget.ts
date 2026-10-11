"use client";

import { useEffect } from "react";
import { useMessages } from "next-intl";
import { diaLocal, sequenciaAtivaHoje } from "@/lib/sequencia";
import type { PerfilUsuario } from "@/lib/types/perfil";
import { atualizarWidgetDaOfensiva } from "@/lib/widget-ofensiva";

/**
 * Mantém os widgets da tela inicial com o que a barra de cima mostra e com as
 * frases na língua da tela. Fica no provedor do perfil, que monta em toda
 * tela do app — inclusive nas que não têm barra.
 */
export function useSincronizarWidget(perfil: PerfilUsuario | null) {
  // Cru: o {dias} e o {nome} chegam inteiros ao celular, que os preenche.
  const textos = useMessages().widget as Record<string, unknown>;

  useEffect(() => {
    if (!perfil) return;
    const ultimo = perfil.ultimaAtividade ? new Date(perfil.ultimaAtividade) : null;
    void atualizarWidgetDaOfensiva({
      dias: perfil.streakAtual ?? 0,
      acesa: sequenciaAtivaHoje(perfil.streakAtual, perfil.ultimaAtividade),
      protegida: (perfil.streakFreezes ?? 0) > 0,
      protecoes: perfil.streakFreezes ?? 0,
      ultimoEstudo: ultimo && !Number.isNaN(ultimo.getTime()) ? diaLocal(ultimo) : "",
      diasProtegidos: perfil.protectedStreakDays ?? [],
      meta: perfil.metaDiaria ?? 10,
      minutosHoje: perfil.minutosHoje ?? 0,
      nome: perfil.nome,
      textos,
    });
  }, [perfil, textos]);
}
