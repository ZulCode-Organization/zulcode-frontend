const CHAVE = "zulcode:deviceId";

/**
 * Identificador do aparelho, exigido pelo POST /auth/signin.
 *
 * O `SigninDto` do backend pede `deviceId` com 16 a 128 caracteres — sem ele
 * a resposta é 400 com "deviceId must be a string". O valor precisa ser
 * estável: é ele que o servidor usa pra reconhecer este navegador entre uma
 * sessão e outra (DeviceSession / device-requests). Por isso fica guardado, e
 * só é sorteado na primeira vez.
 *
 * Se o armazenamento estiver bloqueado (navegação privada), devolve um id
 * novo a cada chamada: o login funciona, mas o aparelho aparece como
 * desconhecido — melhor do que não conseguir entrar.
 */
export function obterDeviceId(): string {
  const novo = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`).replace(/-/g, "").padEnd(32, "0");

  if (typeof window === "undefined") return novo();

  try {
    const salvo = localStorage.getItem(CHAVE);
    // Revalida o tamanho: um valor antigo fora da faixa faria o login falhar
    // com a mesma mensagem de validação.
    if (salvo && salvo.length >= 16 && salvo.length <= 128) return salvo;
    const gerado = novo();
    localStorage.setItem(CHAVE, gerado);
    return gerado;
  } catch {
    return novo();
  }
}

/** Nome amigável do aparelho, opcional no signin (até 80 caracteres). */
export function obterDeviceLabel(): string {
  if (typeof navigator === "undefined") return "Navegador";

  const ua = navigator.userAgent;
  const navegador =
    /Edg\//.test(ua) ? "Edge" :
    /OPR\//.test(ua) ? "Opera" :
    /Firefox\//.test(ua) ? "Firefox" :
    /Chrome\//.test(ua) ? "Chrome" :
    /Safari\//.test(ua) ? "Safari" : "Navegador";

  const sistema =
    /Windows/.test(ua) ? "Windows" :
    /Android/.test(ua) ? "Android" :
    /iPhone|iPad|iPod/.test(ua) ? "iOS" :
    /Mac OS X/.test(ua) ? "macOS" :
    /Linux/.test(ua) ? "Linux" : "";

  return (sistema ? `${navegador} no ${sistema}` : navegador).slice(0, 80);
}
