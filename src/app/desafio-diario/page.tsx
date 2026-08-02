"use client";

import { useRequireAuth } from "@/hooks/useAuthGuard";
import { useUsuario } from "@/hooks/use-usuario";
import { AppShell } from "@/components/app-shell/app-shell";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function DesafioDiarioPage() {
  useRequireAuth();
  const usuario = useUsuario();

  return (
    <AppShell usuario={usuario}>
      <ComingSoon
        titulo="Desafio diário a caminho"
        descricao="Em breve você vai poder encarar um novo desafio por dia e ganhar XP extra."
      />
    </AppShell>
  );
}
