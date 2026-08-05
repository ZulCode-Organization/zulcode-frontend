"use client";

import { useRequireAuth } from "@/hooks/useAuthGuard";
import { AppShell } from "@/components/app-shell/app-shell";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function TabelaLideresPage() {
  useRequireAuth();

  return (
    <AppShell>
      <ComingSoon
        titulo="Tabela de líderes a caminho"
        descricao="Em breve você vai poder competir com outros alunos por aqui."
      />
    </AppShell>
  );
}
