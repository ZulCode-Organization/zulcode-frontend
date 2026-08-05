"use client";

import { useRequireAuth } from "@/hooks/useAuthGuard";
import { usePerfil } from "@/hooks/use-perfil";
import { AppShell } from "@/components/app-shell/app-shell";
import { Button } from "@/components/ui/button";
import { ProfileHeader } from "@/components/perfil/profile-header";
import { StatsGrid } from "@/components/perfil/stats-grid";
import { CoursesSection } from "@/components/perfil/courses-section";
import { AccountPanel } from "@/components/perfil/account-panel";

function PerfilContent() {
  const { perfil, loading, error, cursosEmAndamento, cursosConcluidos, retry } = usePerfil();

  if (loading) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <span className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  if (error || !perfil) {
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-muted-foreground">Não foi possível carregar seu perfil.</p>
        <Button onClick={retry}>Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ProfileHeader perfil={perfil} />
      <StatsGrid perfil={perfil} />
      <CoursesSection emAndamento={cursosEmAndamento} concluidos={cursosConcluidos} />
    </div>
  );
}

export default function PerfilPage() {
  useRequireAuth();

  return (
    <AppShell rightPanel={<AccountPanel />}>
      <PerfilContent />
    </AppShell>
  );
}
