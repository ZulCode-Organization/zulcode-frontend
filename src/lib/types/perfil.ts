export interface PerfilUsuario {
  id: string;
  publicCode?: string;
  role: "USER" | "ADMIN";
  isPro?: boolean;
  nome: string;
  email: string;
  iniciais: string;
  avatarId?: string;
  bannerColor?: string | null;
  themeColor?: string | null;
  themeMode?: "light" | "dark" | null;
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
  streakFreezes?: number;
  doubleXpUntil?: string | null;
  /** Vidas restantes (as "penas"). null enquanto a API não devolver o campo. */
  vidas: number | null;
  /** Moedas. null enquanto a API não devolver o campo. */
  moedas: number | null;
  /** XP ganho hoje. null enquanto a API não recortar progresso por dia. */
  xpHoje: number | null;
  /** Lições concluídas hoje. null enquanto a API não recortar por dia. */
  licoesHoje: number | null;
}

export interface CursoProgresso {
  id: string;
  nome: string;
  totalLicoes: number;
  licoesConcluidas: number;
  percentual: number;
}
