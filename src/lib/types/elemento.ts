export interface ElementoGlossario {
  id: string;
  term: string;
  label: string;
  meaning: string;
  example: string;
  category: string;
  /** A aula do elemento já foi concluída. */
  aprendido: boolean;
  /** A aula onde o elemento é ensinado. */
  aula: { id: string; titulo: string };
  /** O nome da unidade dessa aula, para os que ainda faltam. */
  unidade: string;
  /** A ordem na trilha (seção, unidade, aula): ordena os assuntos como no curso. */
  posicao: number;
  /** Acertos seguidos na prática rápida, de 0 a 3. */
  dominio: number;
  /** Erros na prática nos últimos 7 dias. */
  errosRecentes: number;
}
