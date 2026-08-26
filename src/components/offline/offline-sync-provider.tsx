"use client";

import { useEffect, useState } from "react";
import { CloudOff, RefreshCw } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Network } from "@capacitor/network";
import { flushOfflineQueue, getQueuedActionsCount } from "@/lib/api-config";

export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  const [offline, setOffline] = useState(false);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const refresh = async () => setPending(await getQueuedActionsCount());
    const sync = async () => {
      setOffline(false);
      await flushOfflineQueue();
      await refresh();
    };
    const disconnected = () => { setOffline(true); void refresh(); };
    setOffline(!navigator.onLine);
    void refresh();
    window.addEventListener("online", sync);
    window.addEventListener("offline", disconnected);
    window.addEventListener("zulcode:offline-queue", refresh);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    if (navigator.onLine) void sync();
    let removeNativeListener: (() => Promise<void>) | undefined;
    // Android's Network plugin catches changes that a WebView can miss (for
    // example, switching between Wi-Fi and airplane mode while suspended).
    if (Capacitor.isNativePlatform()) {
      void Network.getStatus().then((status) => {
        if (status.connected) void sync(); else disconnected();
      }).catch(() => undefined);
      void Network.addListener("networkStatusChange", (status) => {
        if (status.connected) void sync(); else disconnected();
      }).then((listener) => { removeNativeListener = () => listener.remove(); }).catch(() => undefined);
    }
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", disconnected);
      window.removeEventListener("zulcode:offline-queue", refresh);
      void removeNativeListener?.();
    };
  }, []);

  return <>{children}{(offline || pending > 0) && <div className="fixed inset-x-3 bottom-3 z-[100] mx-auto flex w-fit max-w-[calc(100vw-1.5rem)] items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold shadow-xl"><CloudOff className="size-4 text-primary" />{offline ? "Você está offline. Seus dados serão sincronizados quando a conexão voltar." : <><RefreshCw className="size-3.5 animate-spin text-primary" />Sincronizando {pending} ação{pending === 1 ? "" : "ões"}…</>}</div>}</>;
}
