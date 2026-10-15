"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { VOLTA_DO_APP, concluirEntradaNoApp } from "@/lib/auth/social";

/**
 * No app: quando a entrada pelo Google ou GitHub termina no navegador, o
 * Android abre o ZulCode com `com.zul.code://auth`. Aqui ela é concluída.
 */
export function VoltarDoLogin() {
  const router = useRouter();
  useEffect(() => {
    let parar: (() => void) | null = null;
    let desmontou = false;
    void (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable("App")) return;
      const { App } = await import("@capacitor/app");
      const ouvinte = await App.addListener("appUrlOpen", ({ url }) => {
        if (!url.startsWith(VOLTA_DO_APP)) return;
        concluirEntradaNoApp(url)
          .then((destino) => router.replace(destino))
          .catch((e: unknown) =>
            router.replace(`/login?erro=${encodeURIComponent(e instanceof Error ? e.message : "Não foi possível entrar.")}`),
          );
      });
      if (desmontou) void ouvinte.remove();
      else parar = () => void ouvinte.remove();
    })();
    return () => {
      desmontou = true;
      parar?.();
    };
  }, [router]);
  return null;
}
