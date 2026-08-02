"use client";

import { useRequireAuth } from "@/hooks/useAuthGuard";
import { useUsuario } from "@/hooks/use-usuario";
import { AppShell } from "@/components/app-shell/app-shell";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function LojaPage() {
  useRequireAuth();
  const usuario = useUsuario();

  return (
    <AppShell usuario={usuario}>
      <ComingSoon
        titulo="Loja a caminho"
        descricao="Em breve você vai poder trocar seu XP por itens e benefícios por aqui."
      />
    </AppShell>
  );
}
