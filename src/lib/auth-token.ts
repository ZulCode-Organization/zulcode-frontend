/**
 * O accessToken (JWT) muda a cada login — usar ele cru como chave de
 * localStorage faria qualquer dado guardado "sumir" pro mesmo usuário toda
 * vez que ele loga de novo. O payload do token traz `sub` (id do usuário,
 * ver auth.service.ts do backend), que é estável entre logins — decodifica
 * só isso (sem validar assinatura, não precisa: é só um namespace local).
 */
export function idEstavelDoToken(token: string): string {
  try {
    const payloadBase64 = token.split(".")[1];
    const payload = JSON.parse(atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.sub === "string" ? payload.sub : token;
  } catch {
    return token;
  }
}
