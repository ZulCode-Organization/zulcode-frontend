"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { contarToque, renovarWebPush } from "@/lib/notificacoes";
import { estadoDosAvisos } from "@/lib/avisos";
import { ativarNotificacoesNativas } from "@/lib/push-notifications";

/**
 * Mantém as notificações do sistema funcionando sem a pessoa fazer nada:
 *
 * - ao abrir, renova a inscrição de quem já deu a permissão (no app, o token
 *   do Firebase; no site, a do Web Push), porque o sistema pode trocá-la e a
 *   conta logada pode ser outra;
 * - quando o app abre por uma notificação do administrativo (a rota traz
 *   `zc_n`), conta o toque e tira a marca do endereço.
 */
export function ManterNotificacoes() {
  const router = useRouter();
  const caminho = usePathname();

  useEffect(() => {
    if (!localStorage.getItem("accessToken")) return;
    void (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return renovarWebPush();
      // Só renova quem já liberou: ninguém recebe o pedido de permissão de surpresa.
      const estado = await estadoDosAvisos();
      if (estado?.ativas && estado.firebase) await ativarNotificacoesNativas();
    })().catch(() => null);
  }, []);

  useEffect(() => {
    const busca = new URLSearchParams(window.location.search);
    const id = busca.get("zc_n");
    if (!id) return;
    void contarToque(id);
    busca.delete("zc_n");
    const resto = busca.toString();
    router.replace(`${caminho}${resto ? `?${resto}` : ""}`);
  }, [caminho, router]);

  return null;
}
