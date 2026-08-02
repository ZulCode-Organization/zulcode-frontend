export type IconeConquista = "flame" | "zap" | "trophy" | "star" | "laptop" | "trending-up";

export interface Conquista {
  id: string;
  titulo: string;
  icone: IconeConquista;
  desbloqueada: boolean;
}

export interface DadosUsuario {
  nome: string;
  email: string;
  iniciais: string;
  nivel: number;
  nivelLabel: string;
  xpAtual: number;
  xpProximoNivel: number;
  xpTotal: number;
  streakDias: number;
  desafiosCompletos: number;
  conquistas: Conquista[];
}
