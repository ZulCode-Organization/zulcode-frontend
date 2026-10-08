/** O que o playground manipula. Um projeto é uma lista de arquivos com nome —
 *  a extensão decide a linguagem, como em qualquer editor de verdade. */

export type Linguagem = "html" | "css" | "javascript";

/** "web" monta uma página; "js" esconde o preview e deixa o console no centro,
 *  para exercício de lógica que não precisa de HTML nenhum. */
export type Modo = "web" | "js";

export type Arquivo = { id: string; nome: string; conteudo: string };

export type Projeto = {
  /** Id no servidor. Nulo enquanto o projeto só existe neste aparelho. */
  id: string | null;
  nome: string;
  modo: Modo;
  /** A ordem importa: é a ordem em que os .css e os .js entram na página. */
  arquivos: Arquivo[];
  /** Ids do catálogo em `bibliotecas.ts`, nunca URLs cruas. */
  bibliotecas: string[];
  /** Preenchido quando o projeto tem link público. */
  slugPublico: string | null;
};

export type ProjetoResumo = {
  id: string;
  nome: string;
  modo: Modo;
  slugPublico: string | null;
  atualizadoEm: string;
};

export type Versao = { id: string; criadoEm: string; bytes: number };
