"use client";

import { useRequireAuth } from "@/hooks/useAuthGuard";
import { useUsuario } from "@/hooks/use-usuario";
import { AppShell } from "@/components/app-shell/app-shell";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function TabelaLideresPage() {
  useRequireAuth();
  const usuario = useUsuario();

  return (
    <AppShell usuario={usuario}>
      <ComingSoon
        titulo="Tabela de líderes a caminho"
        descricao="Em breve você vai poder competir com outros alunos por aqui."
      />
    </AppShell>
  );
}
