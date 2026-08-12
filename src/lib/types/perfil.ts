export interface PerfilUsuario {
  nome: string;
  email: string;
  iniciais: string;
  xp: number;
  nivel: number;
  nivelLabel: string;
  /** XP já acumulado dentro do nível atual. */
  xpNivelAtual: number;
  /** XP total do "degrau" do nível atual (denominador da barra); null no nível máximo. */
  xpNecessarioNivel: number | null;
  /** XP que falta pro próximo nível; null quando já está no nível máximo. */
  xpProximoNivel: number | null;
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
