"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { PerfilProvider } from "@/hooks/use-perfil";
import { FluxoPro } from "@/components/pro/fluxo-pro";

export default function ProPage() {
  // Tela cheia: não passa pelo AppShell, que é quem normalmente monta o
  // PerfilProvider. Sem ele por perto o usePerfil derruba a página.
  return (
    <PerfilProvider>
      <Suspense>
        <ConteudoPro />
      </Suspense>
    </PerfilProvider>
  );
}

function ConteudoPro() {
  useRequireAuth();
  // O Stripe devolve a pessoa em /pro?sessao=cs_…; é esse id que a tela
  // confere com o backend antes de dizer que deu certo.
  const sessao = useSearchParams().get("sessao");
  return <FluxoPro sessao={sessao} />;
}
