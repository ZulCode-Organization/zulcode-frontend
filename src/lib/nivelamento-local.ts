import { idEstavelDoToken } from "./auth-token";

/**
 * Resultado do teste de nivelamento (5 perguntas técnicas sobre a
 * linguagem escolhida no onboarding). Não existe model/endpoint pra isso
 * no backend ainda — os dados ficam só aqui, guardados por conta (chave
 * usa o id estável do usuário, não o token cru), prontos pra quando o
 * backend tiver onde persistir isso de verdade. Nada aqui é usado hoje
 * pra decidir nível/trilha — é só a coleta.
 */
export interface RespostaNivelamento {
  perguntaId: string;
  alternativaId: string;
  correta: boolean;
}

export interface ResultadoNivelamento {
  languageSlug: string;
  respostas: RespostaNivelamento[];
  acertos: number;
  total: number;
  concluidoEm: string;
}

const PREFIXO_CHAVE = "zulcode:nivelamento";

function chave(token: string): string {
  return `${PREFIXO_CHAVE}:${idEstavelDoToken(token)}`;
}

export function salvarNivelamentoLocal(token: string, resultado: ResultadoNivelamento): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(chave(token), JSON.stringify(resultado));
  } catch {
    // localStorage indisponível — o teste roda normalmente, só não fica
    // salvo entre sessões.
  }
}

export function lerNivelamentoLocal(token: string): ResultadoNivelamento | null {
  if (typeof window === "undefined") return null;
  try {
    const bruto = localStorage.getItem(chave(token));
    return bruto ? (JSON.parse(bruto) as ResultadoNivelamento) : null;
  } catch {
    return null;
  }
}
