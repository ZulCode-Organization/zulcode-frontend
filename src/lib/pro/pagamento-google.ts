import { Capacitor, registerPlugin } from "@capacitor/core";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";
import type { EstadoAssinatura, PeriodoCobranca } from "./planos";

/** Uma oferta do PRO na Play Store (um base plan, com ou sem teste grátis). */
interface OfertaDoGoogle {
  plano: string;
  oferta: string | null;
  token: string;
  preco: string;
  comTeste: boolean;
}

interface PluginDePagamento {
  planos(opcoes: { produto: string }): Promise<{ ofertas: OfertaDoGoogle[] }>;
  comprar(opcoes: { token: string; conta: string }): Promise<{ token: string; pendente: boolean }>;
  compras(): Promise<{ tokens: string[] }>;
}

const PagamentoGoogle = registerPlugin<PluginDePagamento>("PagamentoGoogle");

/**
 * No app Android a assinatura é vendida pela Play Store (é regra da Google
 * Play para conteúdo digital); no site continua o Stripe. APK antigo, sem o
 * plugin, segue com o Stripe até ser atualizado.
 */
export function pagamentoPeloGoogle() {
  return Capacitor.getPlatform() === "android" && Capacitor.isPluginAvailable("PagamentoGoogle");
}

async function chamar<T>(caminho: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("accessToken");
  if (!token) throw new Error("Entre na sua conta para continuar.");
  const resposta = await fetchComTimeout(`${API_BASE_URL}${caminho}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init.headers },
  });
  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok) throw new Error(corpo?.message ?? "Não foi possível falar com o pagamento.");
  return corpo as T;
}

/** Manda o token ao servidor, que confere no Google e liga o PRO. */
function conferirNoServidor(purchaseToken: string) {
  return chamar<{ isPro: boolean; estado: string }>("/pro/google/verificar", {
    method: "POST",
    body: JSON.stringify({ purchaseToken }),
  });
}

export type ResultadoDoGoogle =
  | { tipo: "pro"; estado: EstadoAssinatura }
  | { tipo: "pendente" }
  | { tipo: "cancelado" };

/**
 * Compra o PRO pela Play Store: escolhe a oferta do plano (com o teste grátis
 * quando a conta ainda tem direito — a Play só oferece a quem tem), abre a
 * tela do Google e, comprado, confere no servidor.
 */
export async function comprarPeloGoogle(periodo: PeriodoCobranca): Promise<ResultadoDoGoogle> {
  const { produto, conta } = await chamar<{ produto: string; conta: string }>("/pro/google");
  const { ofertas } = await PagamentoGoogle.planos({ produto });
  const doPlano = ofertas.filter((oferta) => oferta.plano === periodo);
  const escolhida = doPlano.find((oferta) => oferta.comTeste) ?? doPlano[0];
  if (!escolhida) throw new Error("Este plano ainda não está disponível na Play Store.");

  let compra: { token: string; pendente: boolean };
  try {
    compra = await PagamentoGoogle.comprar({ token: escolhida.token, conta });
  } catch (erro) {
    const codigo = (erro as { code?: string })?.code;
    if (codigo === "cancelado") return { tipo: "cancelado" };
    if (codigo === "ja_tem") {
      // Já assina por esta conta do Google: só falta ligar no ZulCode.
      await restaurarComprasDoGoogle();
      return { tipo: "pro", estado: await chamar<EstadoAssinatura>("/pro") };
    }
    throw erro instanceof Error ? erro : new Error("O pagamento não foi concluído.");
  }
  if (compra.pendente) return { tipo: "pendente" };
  await conferirNoServidor(compra.token);
  return { tipo: "pro", estado: await chamar<EstadoAssinatura>("/pro") };
}

/** Liga no ZulCode as assinaturas que esta conta do Google já tem (aparelho novo, app reinstalado). */
export async function restaurarComprasDoGoogle() {
  const { tokens } = await PagamentoGoogle.compras();
  let ligou = false;
  for (const token of tokens) {
    try {
      ligou = (await conferirNoServidor(token)).isPro || ligou;
    } catch {
      // Uma compra de outra conta do ZulCode é recusada pelo servidor; segue para a próxima.
    }
  }
  return ligou;
}
