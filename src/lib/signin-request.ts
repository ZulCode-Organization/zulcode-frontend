import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";

/**
 * Entrada na conta, tolerante às duas versões da API.
 *
 * Existem hoje dois backends em uso com contratos opostos no /auth/signin: o
 * publicado aceita só e-mail e senha e recusa qualquer campo a mais, e o local
 * (:3333) ainda exige deviceId. Mandar o campo sempre quebra o publicado;
 * nunca mandar quebra o local.
 *
 * Então a chamada começa pelo formato enxuto, que é o alvo final, e só repete
 * com deviceId se o próprio servidor responder cobrando o campo. Quem recusa o
 * campo nunca chega a vê-lo. Quando o local for atualizado, é só apagar este
 * arquivo e chamar o endpoint direto.
 */

const CHAVE_DEVICE_ID = "zulcode:deviceId";

export type CorpoSignin = {
  accessToken?: string;
  role?: string;
  isNivelado?: boolean;
  message?: string | string[];
};

/**
 * Id estável deste navegador, entre 16 e 128 caracteres como o servidor pede.
 * Precisa sobreviver a recarregamentos: é por ele que o servidor reconhece o
 * aparelho. Só é criado quando a API cobra o campo.
 */
function obterDeviceId(): string {
  const salvo = localStorage.getItem(CHAVE_DEVICE_ID);
  if (salvo && salvo.length >= 16 && salvo.length <= 128) return salvo;

  const novo = `web-${crypto.randomUUID()}`;
  localStorage.setItem(CHAVE_DEVICE_ID, novo);
  return novo;
}

/** Nome legível do aparelho. O servidor corta em 80 caracteres. */
function obterDeviceLabel(): string {
  const ua = navigator.userAgent;
  const navegador =
    /Edg\//.test(ua) ? "Edge"
    : /OPR\//.test(ua) ? "Opera"
    : /Firefox\//.test(ua) ? "Firefox"
    : /Chrome\//.test(ua) ? "Chrome"
    : /Safari\//.test(ua) ? "Safari"
    : "Navegador";

  const sistema =
    /Windows/.test(ua) ? "Windows"
    : /Android/.test(ua) ? "Android"
    : /iPhone|iPad/.test(ua) ? "iOS"
    : /Mac OS X/.test(ua) ? "macOS"
    : /Linux/.test(ua) ? "Linux"
    : "";

  return `${navegador}${sistema ? ` no ${sistema}` : ""}`.slice(0, 80);
}

/** O 400 que voltou é o servidor cobrando o deviceId? */
function cobraDeviceId(res: Response, data: CorpoSignin): boolean {
  if (res.status !== 400) return false;
  const texto = Array.isArray(data.message) ? data.message.join(" ") : data.message ?? "";
  return /deviceid/i.test(texto);
}

/** Junta as mensagens de validação do Nest, que vêm como lista. */
export function mensagemDoErro(data: CorpoSignin, padrao: string): string {
  if (Array.isArray(data.message)) return data.message.join(". ");
  return data.message ?? padrao;
}

export async function entrarNaConta(email: string, senha: string): Promise<{ res: Response; data: CorpoSignin }> {
  const chamar = (corpo: Record<string, string>) =>
    fetchComTimeout(`${API_BASE_URL}/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    });

  const res = await chamar({ email, password: senha });
  const data: CorpoSignin = await res.json().catch(() => ({}));

  if (!cobraDeviceId(res, data)) return { res, data };

  const comAparelho = await chamar({
    email,
    password: senha,
    deviceId: obterDeviceId(),
    deviceLabel: obterDeviceLabel(),
  });

  return { res: comAparelho, data: await comAparelho.json().catch(() => ({})) };
}
