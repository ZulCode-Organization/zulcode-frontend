import type { ReacaoDoZul } from "@/components/zul/cabeca-do-zul";

/**
 * O que o Zul faz e fala quando a pessoa toca numa opção do nivelamento.
 * A chave é "pergunta:opção" (ou "linguagem:slug"). Opção sem entrada aqui
 * (uma nova no banco) ganha uma reação da lista de reserva e nenhuma fala.
 */
type Reacao = { reacao: ReacaoDoZul; fala?: string };

const REACOES: Record<string, Reacao> = {
  "linguagem:python": { reacao: "pulo", fala: "Python! Ótima para começar." },
  "linguagem:javascript": { reacao: "gira", fala: "JavaScript faz a web inteira girar!" },
  "linguagem:typescript": { reacao: "inclina", fala: "TypeScript: JavaScript com cinto de segurança." },
  "linguagem:java": { reacao: "inclina", fala: "Java: firme e forte, igual café." },
  "linguagem:csharp": { reacao: "danca", fala: "C#! Dá até para fazer jogos." },
  "linguagem:go": { reacao: "pulo", fala: "Go é rapidinho, igual eu voando." },
  "linguagem:lua": { reacao: "gira", fala: "Lua! A linguagem dos jogos e mods." },

  "language_level:beginner": { reacao: "aperta", fala: "Do zero é o melhor jeito. Eu vou junto!" },
  "language_level:some_experience": { reacao: "inclina", fala: "A gente relembra rapidinho." },
  "language_level:confident": { reacao: "pulo", fala: "Opa! Vou preparar um testinho." },
  "language_level:expert": { reacao: "gira", fala: "Uau! Então mostra o que sabe." },

  "language_reason:explore": { reacao: "inclina", fala: "Curiosidade é o primeiro passo." },
  "language_reason:career": { reacao: "inclina", fala: "Vou te deixar pronto para o mercado." },
  "language_reason:education": { reacao: "pulo", fala: "Bora tirar 10!" },
  "language_reason:build_apps": { reacao: "aperta", fala: "Adoro quem gosta de construir." },
  "language_reason:creative": { reacao: "danca", fala: "Criar coisas é a melhor parte!" },
  "language_reason:challenge": { reacao: "gira", fala: "Cérebro malhado, igual o meu." },
  "language_reason:fun": { reacao: "pulo", fala: "O melhor motivo de todos!" },
  "language_reason:other": { reacao: "inclina", fala: "Todo motivo vale." },

  "commitment:5min": { reacao: "aperta", fala: "Leve e constante. Gosto!" },
  "commitment:10min": { reacao: "pulo", fala: "Tranquilo. Dá para manter todo dia." },
  "commitment:15min": { reacao: "inclina", fala: "Firme! A ofensiva agradece." },
  "commitment:30min": { reacao: "gira", fala: "Puxado! Você está animado." },
  "commitment:60min": { reacao: "danca", fala: "Intenso! Vou correr para acompanhar." },
};

const RESERVA: ReacaoDoZul[] = ["pulo", "inclina", "aperta", "gira", "danca"];

export function reacaoDaOpcao(chave: string, indice: number): Reacao {
  return REACOES[chave] ?? { reacao: RESERVA[indice % RESERVA.length] };
}

/** O que o Zul diz ao chegar em cada página. */
export const FALAS_DAS_PAGINAS: Record<string, string> = {
  inicio: "Oi! Eu sou o Zul. Bora montar sua trilha?",
  linguagem: "Escolhe uma. Dá para trocar depois!",
  language_level: "Sem vergonha: ninguém nasce sabendo.",
  language_reason: "Pode marcar mais de uma!",
  commitment: "Pouco todo dia vale mais que muito de vez em quando.",
  how_heard: "Última pergunta! Essa você pode pular.",
  avisos: "Prometo não encher o saco.",
};

/** Os motivos ganham um título curto e uma linha de explicação, como cartões. */
export const MOTIVOS: Record<string, { titulo: string; texto: string }> = {
  explore: { titulo: "Descobrir o que é programar", texto: "Entender como tudo funciona" },
  career: { titulo: "Carreira", texto: "Trabalhar na área ou crescer nela" },
  education: { titulo: "Escola ou faculdade", texto: "Ir bem nas matérias" },
  build_apps: { titulo: "Criar meus apps e sites", texto: "Tirar ideias do papel" },
  creative: { titulo: "Jogos e projetos", texto: "Criar coisas divertidas" },
  challenge: { titulo: "Exercitar o cérebro", texto: "Lógica e desafios" },
  fun: { titulo: "Só por diversão", texto: "Porque programar é legal" },
  other: { titulo: "Outro motivo", texto: "Cada um tem o seu" },
};
