export interface PerfilUsuario {
  nome: string;
  email: string;
  iniciais: string;
  xp: number;
  nivel: number;
  xpNivelAtual: number;
  xpProximoNivel: number;
  streakAtual: number;
  streakRecorde: number;
}

export interface CursoProgresso {
  id: string;
  nome: string;
  totalLicoes: number;
  licoesConcluidas: number;
  percentual: number;
}
