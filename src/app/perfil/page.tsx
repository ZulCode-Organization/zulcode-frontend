"use client";

import { useRequireAuth } from "@/hooks/useAuthGuard";
import { useUsuario } from "@/hooks/use-usuario";
import { AppShell } from "@/components/app-shell/app-shell";
import { ProfileHeader } from "@/components/perfil/profile-header";
import { StatsGrid } from "@/components/perfil/stats-grid";
import { AchievementsGrid } from "@/components/perfil/achievements-grid";
import { AccountPanel } from "@/components/perfil/account-panel";

export default function PerfilPage() {
  useRequireAuth();
  const usuario = useUsuario();
  const destaques = usuario.conquistas.filter((c) => c.desbloqueada).slice(0, 3);

  return (
    <AppShell usuario={usuario} rightPanel={<AccountPanel destaques={destaques} />}>
      <div className="flex flex-col gap-6">
        <ProfileHeader usuario={usuario} />
        <StatsGrid usuario={usuario} />
        <AchievementsGrid conquistas={usuario.conquistas} />
      </div>
    </AppShell>
  );
}
