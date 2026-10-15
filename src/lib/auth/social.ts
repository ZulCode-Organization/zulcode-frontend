import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";

export type ProvedorSocial = "github" | "google";

export const NOME_DO_PROVEDOR: Record<ProvedorSocial, string> = {
  github: "GitHub",
  google: "Google",
};

/** Onde o app guarda o verificador enquanto a pessoa está no navegador. */
const CHAVE_DO_VERIFICADOR = "zc-login-verificador";

/** Para onde o backend manda de volta quando a entrada começou no app. */
export const VOLTA_DO_APP = "com.zul.code://auth";

const emBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/**
 * Entrada por GitHub ou Google.
 *
 * Não é uma chamada de API: é uma saída do aplicativo. O navegador vai pro
 * backend, o backend manda pro provedor, e no fim a pessoa volta em
 * `/auth/social` com o token do ZulCode. Por isso aqui não há `fetch` nem
 * resposta pra tratar — `assign` e acabou.
 *
 * O caminho inteiro mora no backend de propósito. Fazer a troca do código pelo
 * token aqui exigiria o segredo do provedor dentro do navegador, e segredo em
 * código que qualquer um lê não é segredo.
 *
 * No app Android é diferente: o Google não deixa entrar dentro da WebView,
 * então a entrada abre numa aba do navegador e volta para o app pelo endereço
 * `com.zul.code://auth` com um código curto. Esse código só vira token junto
 * com o verificador que ficou guardado aqui — outro app que pegasse o endereço
 * não entraria. A promessa termina quando a aba fecha (a pessoa pode desistir).
 */
export async function entrarComProvedor(provedor: ProvedorSocial): Promise<void> {
  const { Capacitor } = await import("@capacitor/core");
  if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable("Browser")) {
    window.location.assign(`${API_BASE_URL}/auth/${provedor}`);
    return new Promise(() => {});
  }

  const verificador = emBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verificador));
  localStorage.setItem(CHAVE_DO_VERIFICADOR, verificador);

  const { Browser } = await import("@capacitor/browser");
  let fechou: () => void = () => {};
  const abaFechada = new Promise<void>((pronto) => (fechou = pronto));
  const ouvinte = await Browser.addListener("browserFinished", () => fechou());
  await Browser.open({ url: `${API_BASE_URL}/auth/${provedor}?desafio=${emBase64Url(new Uint8Array(hash))}` });
  await abaFechada;
  await ouvinte.remove();
}

/**
 * A volta do navegador no app: troca o código pelo token. Devolve o destino
 * (onboarding ou Jornada), ou lança com o motivo para mostrar no login.
 */
export async function concluirEntradaNoApp(endereco: string): Promise<string> {
  const { Browser } = await import("@capacitor/browser");
  void Browser.close().catch(() => null);
  const parametros = new URL(endereco.replace(VOLTA_DO_APP, "https://app.local/auth")).searchParams;
  const erro = parametros.get("erro");
  if (erro) throw new Error(erro);

  const codigo = parametros.get("codigo");
  const verificador = localStorage.getItem(CHAVE_DO_VERIFICADOR);
  if (!codigo || !verificador) throw new Error("A entrada não foi concluída. Tente de novo.");

  const resposta = await fetchComTimeout(`${API_BASE_URL}/auth/app/trocar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ codigo, verificador }),
  });
  const corpo = (await resposta.json().catch(() => null)) as { token?: string; nivelado?: boolean; message?: string } | null;
  if (!resposta.ok || !corpo?.token) throw new Error(corpo?.message ?? "A entrada não foi concluída. Tente de novo.");

  localStorage.removeItem(CHAVE_DO_VERIFICADOR);
  localStorage.setItem("accessToken", corpo.token);
  return corpo.nivelado ? "/home" : "/onboarding/introduction";
}
