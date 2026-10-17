"use client";

import { AppShell } from "@/components/app-shell/app-shell";
import { SemInternet } from "@/components/offline/sem-internet";

/**
 * A página que o service worker entrega quando alguém abre, sem internet, uma
 * tela que ainda não estava guardada no aparelho: a navegação do app em volta
 * e o aviso no meio. É guardada (com o que ela precisa) já na instalação.
 */
export default function OfflinePage() {
  return (
    <AppShell contentClassName="max-w-2xl">
      <SemInternet />
    </AppShell>
  );
}
