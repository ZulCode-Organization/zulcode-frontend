/** As respostas do administrativo, no formato que o backend devolve. */

export type Papel = "USER" | "ADMIN" | "PROFESSOR";
export type Periodo = 7 | 30 | 90;
export type Comparacao = { atual: number; anterior: number; variacao: number | null };

// ── Visão geral ──────────────────────────────────────────────────────────

export interface VisaoPessoas {
  total: number;
  bloqueados: number;
  onlineAgora: number;
  novos: Comparacao;
  estudaram: { dia: number; semana: number; mes: number };
  abriram: { dia: number; semana: number; mes: number };
  serie: { dia: string; cadastros: number; estudaram: number }[];
}

export interface LinhaDeRetencao { semana: string; pessoas: number; d1: number | null; d7: number | null; d30: number | null }
export interface LinhaDeOrigem { origem: string; pessoas: number; fizeramAula: number; voltaram: number; elegiveis: number; pro: number }
export interface Horarios { matriz: number[][]; total: number }

export interface AulaResumo { id: string; aula: string; curso: string; concluidas: number; nota: number | null }
export interface VisaoAprendizado {
  licoes: Comparacao;
  notaMedia: { atual: number | null; anterior: number | null };
  serie: { dia: string; licoes: number; nota: number }[];
  maisFeitas: AulaResumo[];
  piorNota: AulaResumo[];
  maisErradas: { id: string; aula: string; curso: string; erros: number; respostas: number }[];
  penasPorAula: { id: string; aula: string; curso: string; penas: number }[];
}

export interface Funil { inscritos: number; aulas: { id: string; aula: string; unidade: string; comecaram: number; terminaram: number }[] }
export interface DesempenhoDeQuestao { id: string; pergunta: string; tipo: string; aulaId: string; aula: string; curso: string; respostas: number; acertos: number; taxa: number }

export interface VisaoEconomia {
  ganhas: Comparacao;
  gastas: Comparacao;
  saldo: { media: number; mediana: number };
  serie: { dia: string; ganhas: number; gastas: number }[];
  maisVendidos: { item: string; compras: number; rupees: number; tipo: "item" | "cosmetico" }[];
}

export interface VisaoPro {
  emTeste: number;
  pagantes: number;
  atrasados: number;
  cortesia: number;
  cancelandoNoFim: number;
  porPlano: { mensal: number; anual: number };
  receitaMensalEstimada: number;
  precos: { mensal: number; anual: number; fonte: "stripe" | "padrao" };
  conversaoDoTeste: number | null;
  porMes: { mes: string; testes: number; conversoes: number; assinaturas: number; cancelamentos: number; encerradas: number }[];
  historicoDesde: string | null;
}

export interface VisaoOfensivas { azul: number; ciano: number; dourada: number; emRisco: number; protegidas: number; semOfensiva: number }

export interface VisaoEngajamento {
  metas: Comparacao;
  barris: Comparacao;
  projetos: Comparacao;
  projetosCompartilhados: number;
  serie: { dia: string; barris: number; metas: number; projetos: number }[];
}

// ── Pessoas ──────────────────────────────────────────────────────────────

export interface PessoaDaLista {
  id: string;
  name: string;
  email: string;
  publicCode: string;
  avatarId: string;
  role: Papel;
  xp: number;
  coins: number;
  lives: number;
  currentStreak: number;
  longestStreak: number;
  isPro: boolean;
  isDeveloper: boolean;
  isEarlyTester: boolean;
  isVerified: boolean;
  isBanned: boolean;
  banReason: string | null;
  bannedUntil: string | null;
  proCourtesyUntil: string | null;
  lastSeenAt: string | null;
  lastActivityAt: string | null;
  createdAt: string;
  subscription: { status: string; plano: string | null } | null;
}

export interface PaginaDePessoas { itens: PessoaDaLista[]; total: number; pagina: number; porPagina: number; paginas: number }

export interface FichaDaPessoa extends Omit<PessoaDaLista, "subscription"> {
  streakFreezes: number;
  errorShields: number;
  doubleXpUntil: string | null;
  doubleCoinsUntil: string | null;
  dailyGoalMinutes: number;
  proActivatedAt: string | null;
  bannedAt: string | null;
  isNivelado: boolean;
  plano: "pro" | "teste" | "cortesia" | "grátis";
  linkStripe: string | null;
  subscription: { status: string; plano: string | null; validoAte: string | null; canceladaNoFim: boolean; stripeCustomerId: string; stripeSubscriptionId: string | null; createdAt: string } | null;
  _count: { seguidores: number; seguindo: number; weeklyPodiums: number; achievements: number; playgroundProjects: number; pushTokens: number; adminNotes: number };
  onboarding: { pergunta: string; resposta: string; emoji: string | null }[];
  cursos: {
    cursoId: string; curso: string; logoUrl: string | null; atual: boolean; nivel: string | null; inscritoEm: string;
    aulas: number; concluidas: number; notaMedia: number | null; ondeParou: { aula: string; unidade: string } | null;
  }[];
  podios: { league: string; position: number; xp: number; weekStart: string }[];
}

export interface EventoDaLinha {
  tipo: "cadastro" | "licao" | "compra" | "conquista" | "assinatura" | "equipe" | "podio" | "onboarding";
  quando: string;
  titulo: string;
  detalhe?: string;
}

export interface Calendario { inicio: string; fim: string; estudo: { dia: string; minutos: number }[]; protegidos: string[] }
export interface LinhaDeExtrato { id: string; amount: number; reason: string; createdAt: string }
export interface Nota { id: string; text: string; createdAt: string; author: { id: string; name: string } | null }
export interface Segmento { id: string; name: string; filters: Record<string, string>; createdAt: string; createdBy: { name: string } | null }
export interface Alerta { tipo: "xp_rapido" | "rupees_rapido" | "login"; pessoa: { id: string; name: string; email: string; avatarId: string }; valor: number; texto: string }

export interface AcaoDaEquipe {
  id: string;
  acao: string;
  alvo: string;
  alvoId: string | null;
  alvoNome: string | null;
  dados: Record<string, unknown>;
  estornadaEm: string | null;
  quando: string;
  ator: { id: string; name: string; avatarId: string } | null;
}

// ── Conteúdo ─────────────────────────────────────────────────────────────

export interface CursoDoAdmin {
  id: string; name: string; slug: string; description: string | null; logoUrl: string | null; active: boolean; order: number;
  _count: { sections: number; units: number; userLanguages: number };
  aulas: number; questoes: number; comProblema: number; rascunhos: number;
}

export type ProblemaDeAula = "sem_questoes" | "questao_invisivel" | "etapa_vazia" | "sem_resposta" | "sem_introducao";

export interface AulaDaArvore {
  id: string; titulo: string; ordem: number; xp: number; etapas: number; questoes: number; porEtapa: number[];
  problemas: ProblemaDeAula[]; temRascunho: boolean; rascunhoSalvoEm: string | null; publicada: boolean; publicadaEm: string | null; alunos: number;
}
export interface UnidadeDaArvore { id: string; titulo: string; ordem: number; aulas: AulaDaArvore[] }
export interface SecaoDaArvore { id: string; titulo: string; descricao: string | null; nivelamento: boolean; ordem: number; unidades: UnidadeDaArvore[] }
export interface Arvore {
  id: string; nome: string; slug: string; descricao: string | null; logoUrl: string | null; ativo: boolean; alunos: number;
  secoes: SecaoDaArvore[]; unidadesSemSecao: UnidadeDaArvore[];
}

export type TipoDeQuestao = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "FILL_BLANK" | "CODE_ORDER";

export interface QuestaoDoRascunho {
  id: string;
  tipo: TipoDeQuestao;
  etapa: number;
  enunciado: string;
  alternativas?: string[];
  correta?: number;
  codigo?: string;
  verdadeiro?: boolean;
  codigoAntes?: string;
  codigoDepois?: string;
  blocos?: string[];
  codigoInicial?: string;
  resultadoEsperado?: string;
  dica?: string;
}

export interface SlideDoRascunho { titulo: string; texto: string; codigo?: string }

export interface RascunhoDaAula {
  titulo: string;
  xp: number;
  etapas: number;
  introducao: SlideDoRascunho[];
  questoes: QuestaoDoRascunho[];
}

export interface Problema { nivel: "erro" | "aviso"; texto: string; questaoId?: string; etapa?: number }

export interface AulaNoEditor {
  aula: { id: string; cursoId: string; curso: string; secao: string | null; unidadeId: string; unidade: string; publicadaEm: string | null; atualizadaEm: string };
  rascunho: RascunhoDaAula;
  publicado: RascunhoDaAula;
  temRascunho: boolean;
  rascunhoSalvoEm: string | null;
  problemas: Problema[];
  desempenho: Record<string, { respostas: number; acertos: number }>;
}

// ── Loja ─────────────────────────────────────────────────────────────────

export type EfeitoDaLoja = "RECOVER_LIVES" | "FREEZE_STREAK" | "DOUBLE_XP" | "FEATHER_SHIELD" | "DOUBLE_COINS" | "HEAL_ONE_LIFE";

export interface ItemDaLoja {
  id: string; title: string; description: string; price: number; effect: EfeitoDaLoja; active: boolean; order: number;
  availableFrom: string | null; availableUntil: string | null; vendas: number; vendas30: number; aVenda: boolean;
}

export type TipoDeCosmetico = "THEME" | "AVATAR" | "BANNER";
export interface Cosmetico {
  id: string; name: string; description: string; kind: TipoDeCosmetico; price: number; active: boolean; order: number;
  value: { primary?: string; accent?: string; gradient?: string; avatarId?: string };
  vendas: number; vendas30: number;
}
