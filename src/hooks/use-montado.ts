"use client";

import { useSyncExternalStore } from "react";

/** Nunca emite: o valor muda uma vez só, da renderização do servidor para a
 * primeira do cliente, e isso o próprio React já faz. */
const nuncaMuda = () => () => {};
const noCliente = () => true;
const noServidor = () => false;

/**
 * `false` enquanto o HTML vem do servidor, `true` depois que hidrata.
 *
 * Serve para o que só existe no navegador — tema resolvido, largura de tela,
 * dados do `localStorage`. Renderizar isso direto quebraria a hidratação,
 * porque o servidor não tem como saber o valor.
 *
 * Substitui o par `useState(false)` + `useEffect(() => setMounted(true))`, que
 * fazia o mesmo custando uma renderização a mais: o efeito só roda depois que
 * a árvore já foi pintada, então o React montava tudo uma vez com `false` e
 * remontava logo em seguida. Com `useSyncExternalStore` o cliente já começa
 * com o valor certo, e é esse o padrão que a regra set-state-in-effect pede.
 */
export function useMontado() {
  return useSyncExternalStore(nuncaMuda, noCliente, noServidor);
}
