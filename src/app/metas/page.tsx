"use client";

import { useRequireAuth } from "@/hooks/useAuthGuard";
import { useUsuario } from "@/hooks/use-usuario";
import { AppShell } from "@/components/app-shell/app-shell";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function MetasPage() {
  useRequireAuth();
  const usuario = useUsuario();

  return (
    <AppShell usuario={usuario}>
      <ComingSoon
        titulo="Suas metas a caminho"
        descricao="Em breve você vai poder acompanhar todas as suas metas diárias por aqui."
      />
    </AppShell>
  );
}
