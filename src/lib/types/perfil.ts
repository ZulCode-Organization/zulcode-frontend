export interface PerfilUsuario {
  id: string;
  publicCode?: string;
  role: "USER" | "ADMIN" | "PROFESSOR";
  isPro?: boolean;
  isDeveloper?: boolean;
  isEarlyTester?: boolean;
  /** Conta verificada. Só a administração liga; não tem relação com o Pro. */
  isVerified?: boolean;
  nome: string;
  email: string;
  iniciais: string;
  avatarId?: string;
  bannerColor?: string | null;
  /** Status mostrado junto do avatar na tabela de líderes. Null = sem status. */
  statusId?: string | null;
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
  /** Semanas em que a pessoa terminou no top 3 da liga dela. */
  podios?: number;
  /** Quantas pessoas seguem essa conta, e quantas ela segue. */
  seguidores?: number;
  seguindo?: number;
  /** Eu sigo essa conta? So vem no perfil de outra pessoa, e e a base contra a
   * qual o contador se corrige enquanto o botao e clicado. */
  euSigo?: boolean;
  /** Quando a conta foi criada (createdAt da API), pro "por aqui desde". */
  membroDesde?: string | null;
  streakAtual: number;
  streakRecorde: number;
  /** Última vez que a pessoa estudou. É o que diz se a sequência de hoje
   * já foi feita — o streak sozinho não distingue "5 dias, inclusive hoje"
   * de "5 dias, e hoje ainda não". */
  ultimaAtividade?: string | null;
  streakFreezes?: number;
  /** Dias em que uma proteção impediu a quebra da sequência (YYYY-MM-DD). */
  protectedStreakDays?: string[];
  doubleXpUntil?: string | null;
  /** Vidas restantes (as "penas"). null enquanto a API não devolver o campo. */
  vidas: number | null;
  /** Moedas. null enquanto a API não devolver o campo. */
  moedas: number | null;
  /** XP ganho hoje, lições concluídas hoje e minutos estudados hoje.
   *
   * O corte do dia é o de Brasília, feito no backend — não o do navegador de
   * quem acessa, senão duas pessoas em fusos diferentes veriam metas virando
   * em horas diferentes.
   *
   * null só no perfil de outra pessoa, onde esses números não são expostos. */
  xpHoje: number | null;
  licoesHoje: number | null;
  minutosHoje?: number | null;
  conquistas?: { id: string; title: string; description: string; iconSvg: string; bannerSvg: string; unlockedAt: string }[];
}

export interface CursoProgresso {
  id: string;
  nome: string;
  totalLicoes: number;
  licoesConcluidas: number;
  percentual: number;
}
