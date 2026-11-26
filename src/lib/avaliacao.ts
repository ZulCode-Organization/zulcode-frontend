"use client";

/**
 * O pedido de avaliação na Play Store, pela janela oficial do Google (que já
 * mostra as estrelas). Só no app Android, e num APK que tenha o plugin.
 *
 * Quando pedir: ao sair de uma lição concluída, a partir da 3ª, quando a
 * pessoa está contente. No máximo 3 vezes, com 60 dias entre elas. O Google
 * ainda tem a cota dele e pode não mostrar; não dá para saber se mostrou nem
 * se avaliou. Regra da Play: não pedir "5 estrelas" nem dar prêmio em troca.
 */
const CHAVE = "zc-avaliacao";
const LICOES_ANTES = 3;
const INTERVALO_MS = 60 * 24 * 60 * 60 * 1000;
const MAXIMO_DE_PEDIDOS = 3;

type Estado = { licoes: number; pedidos: number; ultimo: number };

function ler(): Estado {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE) ?? "null");
    if (salvo && typeof salvo.licoes === "number") return { licoes: salvo.licoes, pedidos: salvo.pedidos ?? 0, ultimo: salvo.ultimo ?? 0 };
  } catch {
    // Sem armazenamento: começa do zero.
  }
  return { licoes: 0, pedidos: 0, ultimo: 0 };
}

function gravar(estado: Estado) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado));
  } catch {
    // Idem.
  }
}

// ── O pedido do fim do nivelamento ───────────────────────────────────────

const PACOTE = "com.zul.code";

/** O pedido só aparece no app Android: no site não há o que avaliar na loja. */
export async function podeAvaliarNaLoja() {
  try {
    const { Capacitor } = await import("@capacitor/core");
    return Capacitor.getPlatform() === "android";
  } catch {
    return false;
  }
}

/**
 * Abre a página do ZulCode na Play Store. Pelo plugin quando o APK o tem;
 * num APK antigo, pelo link da loja, que o Android abre no app da Play.
 */
export async function abrirAvaliacaoNaLoja() {
  // Quem já foi à loja não precisa da janelinha do Google tão cedo.
  const estado = ler();
  gravar({ ...estado, pedidos: estado.pedidos + 1, ultimo: Date.now() });
  try {
    const { Capacitor, registerPlugin } = await import("@capacitor/core");
    if (Capacitor.isPluginAvailable("AvaliacaoNaLoja")) {
      const avaliacao = registerPlugin<{ abrirLoja: () => Promise<void> }>("AvaliacaoNaLoja");
      await avaliacao.abrirLoja();
      return;
    }
  } catch {
    // Plugin sem o abrirLoja (APK antigo): vai pelo link.
  }
  window.location.href = `market://details?id=${PACOTE}`;
}

/** Guarda na conta o que a pessoa fez com o pedido (o admin mostra). */
export async function registrarAvaliacao(acao: "clicou" | "pulou") {
  const token = localStorage.getItem("accessToken");
  if (!token) return;
  try {
    const { API_BASE_URL, fetchComTimeout } = await import("@/lib/api-config");
    await fetchComTimeout(`${API_BASE_URL}/user/avaliacao`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ acao }),
    });
  } catch {
    // Sem conexão: o registro se perde, a pessoa segue normalmente.
  }
}

/** Conta uma lição concluída (chamado quando a lição termina). */
export function contarLicaoParaAvaliacao() {
  const estado = ler();
  gravar({ ...estado, licoes: estado.licoes + 1 });
}

/** Na saída da lição concluída: pede a avaliação se for a hora. Não espera a janela. */
export async function pedirAvaliacaoSeForAHora() {
  const estado = ler();
  if (estado.licoes < LICOES_ANTES || estado.pedidos >= MAXIMO_DE_PEDIDOS || Date.now() - estado.ultimo < INTERVALO_MS) return;
  try {
    const { Capacitor, registerPlugin } = await import("@capacitor/core");
    if (Capacitor.getPlatform() !== "android" || !Capacitor.isPluginAvailable("AvaliacaoNaLoja")) return;
    const avaliacao = registerPlugin<{ pedir: () => Promise<{ pedido: boolean }> }>("AvaliacaoNaLoja");
    gravar({ ...estado, pedidos: estado.pedidos + 1, ultimo: Date.now() });
    await avaliacao.pedir();
  } catch {
    // APK antigo ou Play fora do ar: fica para a próxima.
  }
}
