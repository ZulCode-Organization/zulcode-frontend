"use client";

import { useState } from "react";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { usePerfil } from "@/hooks/use-perfil";
import { AppShell } from "@/components/app-shell/app-shell";
import { Button } from "@/components/ui/button";
import { ProfileHeader } from "@/components/perfil/profile-header";
import { StatsGrid } from "@/components/perfil/stats-grid";
import { AchievementsSection } from "@/components/perfil/achievements-section";
import { SugestoesAmigos } from "@/components/perfil/sugestoes-amigos";
import { EditorAvatar } from "@/components/perfil/editor-avatar";
import { AbasSeguidores, AdicionarAmigos } from "@/components/perfil/painel-social";
import { SideFooter } from "@/components/shared/side-footer";

function PerfilContent({ editando, setEditando }: { editando: boolean; setEditando: (v: boolean) => void }) {
  const { perfil, loading, error, retry } = usePerfil();

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

  // A edição ocupa a coluna inteira, no lugar do perfil — é uma tela, não um
  // pop-up, e assim a sidebar do app continua visível como na referência.
  if (editando) return <EditorAvatar perfil={perfil} onFechar={() => setEditando(false)} />;

  return (
    <div className="flex max-w-none flex-col gap-7 pt-3">
      <ProfileHeader perfil={perfil} onEditar={() => setEditando(true)} />
      <StatsGrid perfil={perfil} />
      <SugestoesAmigos />
      <AchievementsSection conquistas={perfil.conquistas} />
    </div>
  );
}

export default function PerfilPage() {
  useRequireAuth();
  const [editando, setEditando] = useState(false);

  return (
    <AppShell
      contentClassName={editando ? "max-w-5xl" : "max-w-3xl"}
      rightPanel={
        editando ? undefined : (
          <>
            <AbasSeguidores />
            <AdicionarAmigos />
            <SideFooter />
          </>
        )
      }
    >
      <PerfilContent editando={editando} setEditando={setEditando} />
    </AppShell>
  );
}
