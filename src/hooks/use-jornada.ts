"use client";

import { useCallback, useMemo, useState } from "react";
import { unidadesTrilha } from "@/data/trilha";
import { LICAO_REAL_VARIAVEIS_ID } from "@/data/atividades";
import { EstadoLicao, UnidadeTrilha } from "@/lib/types/trilha";
import { useTrilha } from "./use-trilha";
import { lerLicoesConcluidasLocal, marcarLicaoConcluidaLocal } from "@/lib/progresso-local";

/**
 * Slot da trilha (mockada, 80 lições) que corresponde à única lição
 * semeada de verdade no backend. Quando a Jornada chega nesse id, o estado
 * "concluida" vem do backend de verdade (GET /languages/javascript/track)
 * — nas outras 79, vem do progresso salvo local (localStorage), já que
 * elas não existem no banco.
 */
export const ID_LICAO_CONECTADA = "u1_licao_2";

function getToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
}

/**
 * Monta a Jornada completa (80 lições) combinando duas fontes de verdade:
 * progresso local pra 79 lições que só existem no mock, e o estado real do
 * backend pra a única que existe de fato. O estado de cada nó (atual /
 * bloqueada / concluida) é sempre calculado, nunca lido de um campo
 * hardcoded — é isso que garante que a lição 2 só libera depois que a 1ª
 * é concluída de verdade, em toda a trilha, não só na lição conectada.
 */
export function useJornada() {
  const trilhaReal = useTrilha("javascript");
  const [versao, setVersao] = useState(0);

  const licaoRealConcluida = useMemo(
    () =>
      trilhaReal.unidades
        .flatMap((unidade) => unidade.licoes)
        .find((licao) => licao.id === LICAO_REAL_VARIAVEIS_ID)?.estado === "concluida",
    [trilhaReal.unidades]
  );

  const unidades = useMemo<UnidadeTrilha[]>(() => {
    const token = getToken();
    const concluidasLocal = token ? lerLicoesConcluidasLocal(token) : new Set<string>();

    let jaAchouAtual = false;
    return unidadesTrilha.map((unidade) => ({
      ...unidade,
      licoes: unidade.licoes.map((licao) => {
        const concluida =
          licao.id === ID_LICAO_CONECTADA ? licaoRealConcluida : concluidasLocal.has(licao.id);

        let estado: EstadoLicao;
        if (concluida) {
          estado = "concluida";
        } else if (!jaAchouAtual) {
          estado = "atual";
          jaAchouAtual = true;
        } else {
          estado = "bloqueada";
        }
        return { ...licao, estado };
      }),
    }));
    // "versao" não é lido aqui dentro — só existe pra forçar esse useMemo a
    // recalcular depois de marcarConcluidaLocal (localStorage não dispara
    // re-render sozinho).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [licaoRealConcluida, versao]);

  const marcarConcluidaLocal = useCallback((licaoId: string) => {
    if (licaoId === ID_LICAO_CONECTADA) return; // essa é rastreada pelo backend, não por aqui
    const token = getToken();
    if (!token) return;
    marcarLicaoConcluidaLocal(token, licaoId);
    setVersao((atual) => atual + 1);
  }, []);

  return {
    unidades,
    // Só bloqueia a tela inteira no primeiro carregamento — depois de
    // cacheado (useTrilha), essa página nunca mais fica presa esperando
    // rede de novo.
    loading: trilhaReal.loading,
    marcarConcluidaLocal,
  };
}
