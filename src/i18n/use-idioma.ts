"use client";

import { useEffect, useTransition } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { COOKIE_DO_IDIOMA, IDIOMA_PADRAO, type Idioma } from "./idiomas";

/** Grava a língua neste aparelho; vale um ano, como qualquer preferência. */
export function gravarIdiomaNoAparelho(idioma: Idioma) {
  document.cookie = `${COOKIE_DO_IDIOMA}=${idioma}; path=/; max-age=31536000; samesite=lax`;
}

/**
 * Troca a língua da tela: grava no aparelho e pede ao servidor os textos
 * novos. `trocando` fica ligado até a tela redesenhar na língua nova.
 */
export function useTrocarIdioma() {
  const idioma = useLocale();
  const router = useRouter();
  const [trocando, iniciar] = useTransition();
  const trocar = (novo: Idioma) => {
    if (novo === idioma) return;
    gravarIdiomaNoAparelho(novo);
    iniciar(() => router.refresh());
  };
  return { idioma, trocar, trocando };
}

/**
 * Mantém a língua da conta e a do aparelho iguais, com a conta mandando:
 *
 * - a conta tem uma língua salva e o aparelho está em outra (entrou num
 *   celular novo, ou trocou noutro aparelho): o aparelho passa a usar a da
 *   conta;
 * - a conta nunca escolheu, mas o aparelho já está em inglês (a pessoa trocou
 *   antes de entrar): a escolha sobe para a conta.
 *
 * Quem troca nas Configurações só salva na conta; a troca na tela acontece
 * aqui, pelo primeiro caso. Assim existe um único lugar que muda a língua.
 */
export function useSincronizarIdioma(
  idiomaDaConta: Idioma | null | undefined,
  salvarNaConta: (idioma: Idioma) => void,
  contaCarregada: boolean,
) {
  const { idioma, trocar } = useTrocarIdioma();
  useEffect(() => {
    if (!contaCarregada) return;
    if (idiomaDaConta && idiomaDaConta !== idioma) trocar(idiomaDaConta);
    else if (!idiomaDaConta && idioma !== IDIOMA_PADRAO) salvarNaConta(idioma);
    // `trocar` e `salvarNaConta` mudam a cada desenho; o que importa é a
    // conta e a tela estarem de acordo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contaCarregada, idiomaDaConta, idioma]);
}
