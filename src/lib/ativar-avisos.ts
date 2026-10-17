import { configurarLembrete, estadoDosAvisos, pedirPermissaoDeAvisos, type EstadoDosAvisos, type TextosDosAvisos } from "@/lib/avisos";
import { ativarNotificacoesNativas } from "@/lib/push-notifications";
import { ativarWebPush, estadoNoServidor, iphoneSemInstalar, salvarPreferencia, webPushAtivoNesteNavegador, webPushSuportado, type ResultadoDoSite } from "@/lib/notificacoes";

export type ResultadoDaAtivacao = ResultadoDoSite | "bloqueadas" | "recusado";

/**
 * Liga as notificações neste aparelho, do jeito de cada lugar.
 *
 * No app Android: pede a permissão do sistema, agenda o lembrete no celular e
 * registra o aparelho no Firebase. No site: inscreve o navegador no Web Push.
 * Ligadas, a escolha fica salva na conta.
 */
export async function ativarAvisosNesteAparelho(textos: TextosDosAvisos): Promise<{ resultado: ResultadoDaAtivacao; nativo: EstadoDosAvisos | null }> {
  const { Capacitor } = await import("@capacitor/core");
  if (Capacitor.isNativePlatform()) {
    let nativo = await pedirPermissaoDeAvisos();
    if (!nativo) return { resultado: "falha", nativo: null };
    // O Android não pergunta mais depois de duas recusas: só pelas configurações dele.
    if (!nativo.ativas) return { resultado: nativo.permissao === "denied" ? "bloqueadas" : "recusado", nativo };
    nativo = (await configurarLembrete({ ativo: true, textos })) ?? nativo;
    if (nativo.firebase) await ativarNotificacoesNativas();
    await salvarPreferencia(true);
    return { resultado: "ativado", nativo };
  }
  const resultado = await ativarWebPush();
  if (resultado === "ativado") await salvarPreferencia(true);
  return { resultado: resultado === "semPermissao" ? "bloqueadas" : resultado, nativo: null };
}

/**
 * Se vale pedir as notificações agora: "pedir" quando dá para ativar,
 * "bloqueadas" quando só pelas configurações do aparelho, e null quando já
 * estão ligadas, quando a pessoa as desligou nas Configurações do ZulCode, ou
 * quando este lugar não recebe notificações (navegador sem suporte, iPhone sem
 * instalar, site sem a chave do Web Push).
 */
export async function situacaoDosAvisos(): Promise<"pedir" | "bloqueadas" | null> {
  const servidor = await estadoNoServidor();
  if (servidor && !servidor.ativas) return null;
  const { Capacitor } = await import("@capacitor/core");
  if (Capacitor.isNativePlatform()) {
    const nativo = await estadoDosAvisos();
    if (!nativo || nativo.ativas) return null;
    return nativo.permissao === "denied" ? "bloqueadas" : "pedir";
  }
  if (!webPushSuportado() || iphoneSemInstalar() || !servidor?.chaveWebPush) return null;
  if (await webPushAtivoNesteNavegador()) return null;
  return typeof Notification !== "undefined" && Notification.permission === "denied" ? "bloqueadas" : "pedir";
}

// ── De quanto em quanto tempo pedir de novo ────────────────────────────────

const CHAVE = "zc:pedido-de-avisos";
/** Dias de espera depois de cada "Agora não": a primeira vez é logo ao abrir. */
const ESPERAS_EM_DIAS = [3, 7, 14, 30];

type Registro = { vezes: number; ultima: number };

function ler(): Registro {
  try {
    const bruto = JSON.parse(localStorage.getItem(CHAVE) ?? "null");
    if (bruto && typeof bruto.vezes === "number" && typeof bruto.ultima === "number") return bruto;
  } catch {}
  return { vezes: 0, ultima: 0 };
}

/** Já passou tempo bastante desde o último "Agora não"? */
export function horaDePedirAvisos(agora = Date.now()) {
  const { vezes, ultima } = ler();
  if (vezes === 0) return true;
  const espera = ESPERAS_EM_DIAS[Math.min(vezes - 1, ESPERAS_EM_DIAS.length - 1)];
  return agora - ultima >= espera * 24 * 60 * 60 * 1000;
}

/** Marca que o pedido apareceu e a pessoa deixou para depois. */
export function adiarPedidoDeAvisos(agora = Date.now()) {
  const { vezes } = ler();
  try {
    localStorage.setItem(CHAVE, JSON.stringify({ vezes: vezes + 1, ultima: agora }));
  } catch {}
}
