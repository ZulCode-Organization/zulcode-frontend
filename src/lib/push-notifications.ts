"use client";

import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";
import { estadoDosAvisos } from "@/lib/avisos";

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
  // Chamar o Firebase num APK sem ele configurado (sem google-services.json)
  // fecha o app na hora. Só segue quando o lado nativo confirma que ele existe;
  // um APK antigo, sem como confirmar, também fica de fora.
  const estado = await estadoDosAvisos();
  if (!estado?.firebase) return { ok: false, codigo: "falha" };

  let permissao = await PushNotifications.checkPermissions();
  if (permissao.receive === "prompt") permissao = await PushNotifications.requestPermissions();
  if (permissao.receive !== "granted") return { ok: false, codigo: "semPermissao" };

  const token = localStorage.getItem("accessToken");
  if (!token) return { ok: false, codigo: "sessao" };

  // Os canais (com os nomes na língua do app) são criados pelo lado nativo,
  // que também desenha os avisos do servidor: ver android/.../ServicoDePush.

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
