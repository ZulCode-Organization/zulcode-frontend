"use client";

import { useEffect, useMemo } from "react";
import { useLocale, useMessages, useTranslations } from "next-intl";
import { configurarLembrete, estadoDosAvisos, informarProgresso, type TextosDosAvisos } from "@/lib/avisos";
import type { PerfilUsuario } from "@/lib/types/perfil";

type Frase = { titulo: string; texto: string };

/**
 * Os textos dos lembretes na língua da tela. Vão crus (com {dias} e {nome})
 * porque quem preenche é o celular, na hora de mostrar.
 */
export function useTextosDosAvisos(): TextosDosAvisos {
  const t = useTranslations("avisos");
  // As frases vêm cruas (sem formatar): o {dias} tem que chegar inteiro ao celular.
  const crus = useMessages().avisos;
  return useMemo(() => {
    const lista = (chave: "lembrete" | "comecar" | "risco") => Object.values(crus[chave] as Record<string, Frase>);
    return {
      canais: { lembretes: t("canais.lembretes"), novidades: t("canais.novidades") },
      acoes: { estudar: t("acoes.estudar"), depois: t("acoes.depois") },
      rotuloDia: t("rotuloDia"),
      rotuloDias: t("rotuloDias"),
      unidade: { um: t("unidade.um"), varios: t("unidade.varios") },
      lembrete: lista("lembrete"),
      comecar: lista("comecar"),
      risco: lista("risco"),
    };
  }, [t, crus]);
}

/**
 * Mantém o celular a par da ofensiva (para o lembrete saber se toca e com que
 * número) e dos textos na língua atual. Fica no provedor do perfil, que monta
 * em toda tela do app.
 */
export function useSincronizarAvisos(perfil: PerfilUsuario | null) {
  const textos = useTextosDosAvisos();
  const idioma = useLocale();
  const carregado = Boolean(perfil);

  useEffect(() => {
    if (!perfil) return;
    void informarProgresso({ dias: perfil.streakAtual ?? 0, ultimaAtividade: perfil.ultimaAtividade, nome: perfil.nome });
  }, [perfil]);

  // A língua mudou (ou a sessão começou): o lembrete ligado passa a usar os
  // textos novos. Desligado, não há o que atualizar.
  useEffect(() => {
    if (!carregado) return;
    void estadoDosAvisos().then((estado) => {
      if (estado?.lembrete.ativo) void configurarLembrete({ textos });
    });
    // `textos` muda junto com a língua; vigiar a língua basta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idioma, carregado]);
}
