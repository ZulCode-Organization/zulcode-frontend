import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";
/**
 * O PRO: preço, vantagens e as conversas com o backend sobre a assinatura.
 *
 * Tudo o que a tela do PRO mostra sai daqui. Mudar de preço é mudar um número
 * neste arquivo — nenhuma tela tem valor escrito no meio do JSX. O valor de
 * verdade cobrado é o do preço no Stripe; os dois precisam bater.
 */

/** Dias de teste antes da primeira cobrança. */
export const DIAS_DE_TESTE = 7;

/** O lembrete por e-mail sai este número de dias antes do fim do teste. */
export const DIAS_DO_LEMBRETE = 3;

export const PRECO_MENSAL = 24.99;

/**
 * Quanto o anual desconta sobre doze meses do mensal.
 *
 * O valor anual não é digitado: sai daqui. Assim o desconto anunciado e o
 * preço exibido nunca discordam — o que costuma acontecer quando os dois são
 * escritos à mão e só um é atualizado.
 */
export const DESCONTO_ANUAL = 0.37;

export type PeriodoCobranca = "mensal" | "anual";

/** Preço no período escolhido: o total cobrado e o equivalente mensal. */
export function precoDoPeriodo(periodo: PeriodoCobranca) {
  if (periodo === "mensal") return { porMes: PRECO_MENSAL, total: PRECO_MENSAL };
  const total = Math.round(PRECO_MENSAL * 12 * (1 - DESCONTO_ANUAL) * 100) / 100;
  return { porMes: Math.floor((total / 12) * 100) / 100, total };
}

export const formatarBRL = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/**
 * O que o PRO entrega. Cada item tem de existir de verdade no backend — o
 * comparativo e as telas do PRO prometem exatamente esta lista.
 */
export const COMPARACAO: { recurso: string; gratis: string | boolean; pro: string | boolean }[] = [
  { recurso: "Penas", gratis: "5, uma por hora", pro: "Ilimitadas" },
  { recurso: "XP em dobro", gratis: false, pro: true },
  { recurso: "Rupees em dobro", gratis: false, pro: true },
  { recurso: "Ofensiva protegida", gratis: false, pro: "1 dia por semana" },
  { recurso: "Todos os cursos", gratis: true, pro: true },
];

export interface EstadoAssinatura {
  pagamentoLigado: boolean;
  isPro: boolean;
  status: string | null;
  plano: string | null;
  validoAte: string | null;
  canceladaNoFim: boolean;
  jaTeveTeste: boolean;
}

async function chamar<T>(caminho: string, init: RequestInit = {}): Promise<T> {
  const token = typeof window === "undefined" ? null : localStorage.getItem("accessToken");
  if (!token) throw new Error("Entre na sua conta para continuar.");

  const resposta = await fetchComTimeout(`${API_BASE_URL}${caminho}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init.headers },
  });
  const corpo = await resposta.json().catch(() => null);
  // A mensagem do backend é específica (qual variável falta, se a conta já é
  // PRO). Trocá-la por um texto genérico transformaria um problema de
  // configuração em mistério.
  if (!resposta.ok) throw new Error(corpo?.message ?? "Não foi possível falar com o pagamento.");
  return corpo as T;
}

/**
 * Abre a sessão de pagamento embutida. O backend cria a sessão no Stripe (ele
 * guarda a chave secreta, não o navegador) e devolve só o segredo que o
 * formulário embutido precisa.
 */
export function iniciarAssinatura(periodo: PeriodoCobranca) {
  return chamar<{ clientSecret: string; comTeste: boolean }>("/pro/checkout", {
    method: "POST",
    body: JSON.stringify({ plano: periodo }),
  });
}

/**
 * Pergunta ao backend como terminou o pagamento. Quem decide se a pessoa
 * virou PRO é o backend, consultando o Stripe — nunca a volta do navegador,
 * que qualquer um consegue forjar.
 */
export function conferirSessao(sessaoId: string) {
  return chamar<EstadoAssinatura & { sessao: "open" | "complete" | "expired" | null }>(
    `/pro/sessao/${encodeURIComponent(sessaoId)}`,
  );
}

export const estadoDaAssinatura = () => chamar<EstadoAssinatura>("/pro");

export const abrirPortal = () => chamar<{ url: string }>("/pro/portal", { method: "POST" });

/** Quanto falta para o fim do teste, ou nulo se a conta não está em teste. */
export function fimDoTeste(estado: EstadoAssinatura | null, agora = Date.now()) {
  if (!estado || estado.status !== "trialing" || !estado.validoAte) return null;
  const fim = new Date(estado.validoAte).getTime();
  return { fim, horasRestantes: Math.max(0, (fim - agora) / 3_600_000) };
}
