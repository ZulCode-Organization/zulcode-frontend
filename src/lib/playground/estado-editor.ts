/** Linha, coluna e quantidade de erros do editor.
 *
 *  Fica fora do React de propósito. A barra de status precisa disso a cada
 *  movimento do cursor, e levar essa informação pelo estado da página faria a
 *  tela inteira re-renderizar a cada tecla de seta. Com um store à parte, só a
 *  barra de status se redesenha. */

export type EstadoEditor = { linha: number; coluna: number; erros: number };

let estado: EstadoEditor = { linha: 1, coluna: 1, erros: 0 };
const ouvintes = new Set<() => void>();

export function definirEstadoEditor(proximo: EstadoEditor) {
  // Objeto novo só quando algo mudou de verdade: `useSyncExternalStore` compara
  // por referência e re-renderizaria sem parar se cada leitura criasse um.
  if (estado.linha === proximo.linha && estado.coluna === proximo.coluna &&
      estado.erros === proximo.erros) {
    return;
  }
  estado = proximo;
  for (const ouvinte of ouvintes) ouvinte();
}

export function assinarEstadoEditor(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  return () => { ouvintes.delete(ouvinte); };
}

export function lerEstadoEditor() {
  return estado;
}

const NO_SERVIDOR: EstadoEditor = { linha: 1, coluna: 1, erros: 0 };

export function lerEstadoEditorNoServidor() {
  return NO_SERVIDOR;
}
