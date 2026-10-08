/** A ponte para abrir o preview em outra aba.
 *
 *  O projeto vai pelo sessionStorage e não pela URL: cabe mais que um endereço
 *  e não vaza o código no histórico do navegador.
 *
 *  Por que uma página nossa e não um blob: um blob criado por este site roda na
 *  nossa origem, com acesso ao localStorage — ou seja, ao token da conta de
 *  quem abriu. A página de visualização monta o mesmo iframe isolado, com
 *  origem opaca, e o código do aluno continua sem alcançar nada. */
export const CHAVE_PREVIEW_AVULSO = "zulcode:playground-preview-avulso";
