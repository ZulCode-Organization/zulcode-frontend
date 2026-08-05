"use client";

import { useRequireAuth } from "@/hooks/useAuthGuard";
import { AppShell } from "@/components/app-shell/app-shell";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function MetasPage() {
  useRequireAuth();

  return (
    <AppShell>
      <ComingSoon
        titulo="Suas metas a caminho"
        descricao="Em breve você vai poder acompanhar todas as suas metas diárias por aqui."
      />
    </AppShell>
  );
}
