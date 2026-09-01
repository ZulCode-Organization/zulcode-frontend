/**
 * Os planos do ZulCode e o ponto onde o pagamento vai entrar.
 *
 * Tudo o que a tela do PRO mostra sai daqui: nome, preço, o que cada plano
 * libera e o que a tabela de comparação exibe. Mudar de preço é mudar um
 * número neste arquivo — nenhuma tela tem valor escrito no meio do JSX.
 */

/** Dias de teste antes da primeira cobrança. */
export const DIAS_DE_TESTE = 7;

/**
 * Quanto o anual desconta sobre doze meses do mensal.
 *
 * O valor anual não é digitado: sai daqui. Assim o desconto anunciado e o
 * preço cobrado nunca discordam — o que costuma acontecer quando os dois são
 * escritos à mão e só um é atualizado.
 */
export const DESCONTO_ANUAL = 0.37;

export type PeriodoCobranca = "mensal" | "anual";
export type PlanoId = "gratis" | "pro" | "max";

export interface Plano {
  id: PlanoId;
  nome: string;
  resumo: string;
  /** Nulo no plano grátis: é a ausência de preço, não o preço zero. */
  precoMensal: number | null;
  destaque?: boolean;
  /** "Tudo do PRO, mais:" — evita repetir a lista inteira em cada card. */
  herdaDe?: PlanoId;
  recursos: string[];
}

export const PLANOS: Plano[] = [
  {
    id: "gratis",
    nome: "Grátis",
    resumo: "Comece a programar e veja se combina com você.",
    precoMensal: null,
    recursos: ["Todos os cursos e trilhas", "5 penas, recuperadas a cada hora", "Metas diárias e tabela de líderes"],
  },
  {
    id: "pro",
    nome: "PRO",
    resumo: "Estude sem esbarrar em limite nenhum.",
    precoMensal: 24.99,
    destaque: true,
    herdaDe: "gratis",
    recursos: ["Penas ilimitadas", "XP em dobro", "Sem anúncios", "Proteção de ofensiva"],
  },
  {
    id: "max",
    nome: "MAX",
    resumo: "O caminho mais rápido até programar de verdade.",
    precoMensal: 36.99,
    herdaDe: "pro",
    // Estes quatro são capacidades que o app já tem — o que está em aberto é o
    // empacotamento, não a existência delas. Confirme ou troque antes de abrir
    // a venda: prometer o que não se entrega é o jeito mais rápido de perder
    // uma assinatura logo no primeiro mês.
    recursos: ["Moedas em dobro", "Escudo de pena", "Playground sem limites", "Suporte prioritário"],
  },
];

export const planoPorId = (id: PlanoId) => PLANOS.find((plano) => plano.id === id);

/** Preço do plano no período escolhido: o total cobrado e o equivalente mensal. */
export function precoDoPlano(plano: Plano, periodo: PeriodoCobranca) {
  if (plano.precoMensal === null) return { porMes: 0, total: 0, gratuito: true as const };

  if (periodo === "mensal") {
    return { porMes: plano.precoMensal, total: plano.precoMensal, gratuito: false as const };
  }

  const total = plano.precoMensal * 12 * (1 - DESCONTO_ANUAL);
  return { porMes: total / 12, total, gratuito: false as const };
}

export const formatarBRL = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export interface ResultadoAssinatura {
  /** Para onde mandar a pessoa: a página do provedor de pagamento. */
  urlDeCheckout?: string;
}

/**
 * Onde o pagamento entra.
 *
 * Hoje ela não cobra nada — só recusa, dizendo o que falta. É de propósito: a
 * tela inteira já funciona em volta dela, com estado de carregando, de erro e
 * de sucesso, então plugar o provedor é trocar o corpo desta função e nada
 * mais. Nenhum botão da tela conhece Stripe, Mercado Pago ou qualquer outro.
 *
 * Quando for plugar, o caminho é este:
 *
 *   1. O backend cria a sessão de checkout (ele guarda a chave secreta, não o
 *      navegador) e devolve a URL.
 *   2. Esta função chama esse endpoint e devolve `urlDeCheckout`.
 *   3. A tela redireciona pra lá.
 *   4. O provedor confirma por webhook, e o backend liga o `isPro` do usuário.
 *
 * O passo 4 é o que decide de verdade quem é assinante. Confiar no retorno do
 * navegador pra liberar o PRO é o erro clássico: qualquer pessoa consegue
 * forjar uma volta de "pagamento aprovado" sem ter pago nada.
 */
export async function iniciarAssinatura(
  planoId: PlanoId,
  periodo: PeriodoCobranca
): Promise<ResultadoAssinatura> {
  // O plano e o período entram na mensagem de propósito: quando alguém
  // relatar que "o botão não funciona", o relato já vem dizendo qual botão.
  console.info(`[pro] assinatura pedida: ${planoId} / ${periodo} — pagamento ainda não ligado.`);
  throw new Error("O pagamento ainda não está ligado. Em breve o ZulCode PRO abre para assinatura.");
}
