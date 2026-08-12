export type EstadoLicao = "concluida" | "atual" | "disponivel" | "bloqueada";

export interface LicaoTrilha {
  id: string;
  titulo: string;
  subtitulo: string;
  xp: number;
  estado: EstadoLicao;
}

export interface UnidadeTrilha {
  id: string;
  secao: number;
  unidade: number;
  titulo: string;
  duracaoEstimada: string;
  licoes: LicaoTrilha[];
}
