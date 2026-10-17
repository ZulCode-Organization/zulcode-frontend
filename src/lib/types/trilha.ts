import type { TipoDeAula } from "@/data/atividades";

export type EstadoLicao = "concluida" | "atual" | "disponivel" | "bloqueada";

export interface LicaoTrilha {
  id: string;
  titulo: string;
  subtitulo: string;
  xp: number;
  estado: EstadoLicao;
  /** O tipo da aula do formato novo (sem etapas). Nas antigas fica vazio. */
  tipo?: TipoDeAula;
}

export interface UnidadeTrilha {
  id: string;
  secao: number;
  unidade: number;
  titulo: string;
  duracaoEstimada: string;
  licoes: LicaoTrilha[];
}
