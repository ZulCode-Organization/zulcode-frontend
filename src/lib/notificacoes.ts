"use client";

import { API_BASE_URL, fetchComTimeout } from "./api-config";

/**
 * As notificações do sistema do celular (e do navegador).
 *
 * No app Android elas chegam pelo Firebase (ver push-notifications.ts e o
 * ServicoDePush nativo); no site, pelo Web Push, com o service worker
 * (public/sw.js) mostrando o aviso. Não existe caixa de notificações dentro do
 * app: o que chega, chega na barra do celular.
 */

function cabecalhos(): Record<string, string> | null {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  return token ? { Authorization: `Bearer ${token}` } : null;
}

/**
 * Troca {nome} pelo primeiro nome de quem lê. Sem nome, a frase não pode ficar
 * com ", ," nem começar por vírgula. O servidor faz a mesma troca no envio.
 */
export function personalizar(texto: string, nome?: string | null) {
  const primeiro = (nome ?? "").trim().split(/\s+/)[0] ?? "";
  if (primeiro) return texto.split("{nome}").join(primeiro);
  return texto.replace(/,\s*\{nome\}/g, "").replace(/\{nome\},?\s*/g, "").trim();
}

// ---------------------------------------------------------------- Preferência

/** Se as notificações estão ligadas na conta, e a chave do Web Push (nula sem configuração no servidor). */
export async function estadoNoServidor(): Promise<{ ativas: boolean; chaveWebPush: string | null } | null> {
  const headers = cabecalhos();
  if (!headers) return null;
  try {
    const resposta = await fetchComTimeout(`${API_BASE_URL}/notifications/estado`, { headers });
    return resposta.ok ? await resposta.json() : null;
  } catch {
    return null;
  }
}

/** A chave única das Configurações: liga ou desliga tudo na conta. */
export async function salvarPreferencia(ativas: boolean) {
  const headers = cabecalhos();
  if (!headers) return false;
  const resposta = await fetchComTimeout(`${API_BASE_URL}/notifications/preferencia`, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ ativas }),
  }).catch(() => null);
  return Boolean(resposta?.ok);
}

// ---------------------------------------------------------------- Web Push (site)

/** O navegador sabe receber notificações? */
export function webPushSuportado() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/** No iPhone, o Safari só entrega notificações ao site adicionado à tela de início (iOS 16.4+). */
export function iphoneSemInstalar() {
  if (typeof window === "undefined") return false;
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const instalado = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return ios && !instalado;
}

function chaveEmBytes(base64: string) {
  const preenchida = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const texto = atob(preenchida);
  return Uint8Array.from(texto, (c) => c.charCodeAt(0));
}

async function registroDoSite() {
  await navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  return navigator.serviceWorker.ready;
}

export type ResultadoDoSite = "ativado" | "semSuporte" | "instaleNoIphone" | "semPermissao" | "semServidor" | "falha";

/** Pede a permissão do navegador, inscreve o site no Web Push e guarda a inscrição no servidor. */
export async function ativarWebPush(): Promise<ResultadoDoSite> {
  if (iphoneSemInstalar()) return "instaleNoIphone";
  if (!webPushSuportado()) return "semSuporte";
  const estado = await estadoNoServidor();
  if (!estado?.chaveWebPush) return "semServidor";

  const permissao = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
  if (permissao !== "granted") return "semPermissao";

  try {
    const registro = await registroDoSite();
    const inscricao =
      (await registro.pushManager.getSubscription()) ??
      (await registro.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chaveEmBytes(estado.chaveWebPush) }));
    const headers = cabecalhos();
    if (!headers) return "falha";
    const resposta = await fetchComTimeout(`${API_BASE_URL}/notifications/web`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      // Só o endereço e as chaves: o resto que o navegador manda não interessa ao servidor.
      body: JSON.stringify({ endpoint: inscricao.toJSON().endpoint, keys: inscricao.toJSON().keys }),
    });
    return resposta.ok ? "ativado" : "falha";
  } catch {
    return "falha";
  }
}

/** Este navegador já está inscrito e com permissão? */
export async function webPushAtivoNesteNavegador() {
  if (!webPushSuportado() || Notification.permission !== "granted") return false;
  const registro = await navigator.serviceWorker.getRegistration();
  return Boolean(await registro?.pushManager.getSubscription());
}

/**
 * Quem já deu a permissão antes: ao abrir o site, a inscrição é renovada no
 * servidor (o navegador pode trocá-la, e a conta pode ser outra).
 */
export async function renovarWebPush() {
  if (!webPushSuportado() || Notification.permission !== "granted" || !cabecalhos()) return;
  const { Capacitor } = await import("@capacitor/core");
  if (Capacitor.isNativePlatform()) return;
  await ativarWebPush();
}

// ---------------------------------------------------------------- Toque e saída

/** A pessoa abriu o app por uma notificação do administrativo: conta o toque. */
export async function contarToque(id: string) {
  const headers = cabecalhos();
  if (!headers || !/^[0-9a-f-]{36}$/i.test(id)) return;
  await fetchComTimeout(`${API_BASE_URL}/notifications/${id}/aberta`, { method: "POST", headers }).catch(() => null);
}

/** O token do Firebase deste aparelho, guardado ao registrar, para esquecê-lo ao sair da conta. */
export const CHAVE_DO_TOKEN_DO_APARELHO = "zc-push-token";

/**
 * Ao sair da conta: este aparelho para de receber as notificações dela. Roda
 * antes de apagar o token de acesso (precisa dele para avisar o servidor).
 */
export async function esquecerEsteAparelho() {
  const headers = cabecalhos();
  if (!headers) return;
  const pedidos: Promise<unknown>[] = [];
  const tokenDoAparelho = localStorage.getItem(CHAVE_DO_TOKEN_DO_APARELHO);
  if (tokenDoAparelho) {
    pedidos.push(
      fetchComTimeout(`${API_BASE_URL}/notifications/devices`, {
        method: "DELETE",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenDoAparelho }),
      }).catch(() => null),
    );
    localStorage.removeItem(CHAVE_DO_TOKEN_DO_APARELHO);
  }
  if (webPushSuportado()) {
    pedidos.push(
      (async () => {
        const registro = await navigator.serviceWorker.getRegistration();
        const inscricao = await registro?.pushManager.getSubscription();
        if (!inscricao) return;
        await fetchComTimeout(`${API_BASE_URL}/notifications/web`, {
          method: "DELETE",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: inscricao.endpoint }),
        }).catch(() => null);
        await inscricao.unsubscribe().catch(() => false);
      })().catch(() => null),
    );
  }
  await Promise.all(pedidos);
}
