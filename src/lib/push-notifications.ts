"use client";

import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";

/**
 * O resultado de ativar as notificações, como código: quem mostra a frase é a
 * tela, na língua da pessoa (`configuracoes.avisos.resultado.<codigo>`).
 */
export type CodigoPush = "ativado" | "semApp" | "semPermissao" | "sessao" | "falhaAoSalvar" | "falha";
export type ResultadoPush = { ok: boolean; codigo: CodigoPush };

/** Solicita a permissão no APK/IPA e guarda o token nativo no servidor.
 * No navegador normal não pedimos uma permissão que o ZulCode ainda não usa. */
export async function ativarNotificacoesNativas(): Promise<ResultadoPush> {
  const [{ Capacitor }, { PushNotifications }] = await Promise.all([
    import("@capacitor/core"),
    import("@capacitor/push-notifications"),
  ]);

  if (!Capacitor.isNativePlatform()) return { ok: false, codigo: "semApp" };

  let permissao = await PushNotifications.checkPermissions();
  if (permissao.receive === "prompt") permissao = await PushNotifications.requestPermissions();
  if (permissao.receive !== "granted") return { ok: false, codigo: "semPermissao" };

  const token = localStorage.getItem("accessToken");
  if (!token) return { ok: false, codigo: "sessao" };

  if (Capacitor.getPlatform() === "android") {
    await PushNotifications.createChannel({ id: "zulcode_alertas", name: "Alertas do ZulCode", description: "Novidades e avisos do ZulCode", importance: 5, visibility: 1, sound: "default", vibration: true });
  }

  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => resolve({ ok: false, codigo: "falha" }), 12000);
    let registration: { remove: () => Promise<void> } | undefined;
    let registrationError: { remove: () => Promise<void> } | undefined;
    const finalizar = (resultado: ResultadoPush) => {
      window.clearTimeout(timeout);
      void registration?.remove();
      void registrationError?.remove();
      resolve(resultado);
    };
    const conectar = async () => {
      registration = await PushNotifications.addListener("registration", async ({ value }) => {
        window.clearTimeout(timeout);
        const resposta = await fetchComTimeout(`${API_BASE_URL}/notifications/devices`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ token: value, platform: Capacitor.getPlatform() }),
        });
        finalizar(resposta.ok ? { ok: true, codigo: "ativado" } : { ok: false, codigo: "falhaAoSalvar" });
      });
      registrationError = await PushNotifications.addListener("registrationError", () => finalizar({ ok: false, codigo: "falha" }));
      await PushNotifications.register();
    };
    void conectar().catch(() => finalizar({ ok: false, codigo: "falha" }));
  });
}
