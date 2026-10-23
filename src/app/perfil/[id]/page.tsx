"use client";

import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/app-shell/app-shell";
import { ProfileHeader } from "@/components/perfil/profile-header";
import { StatsGrid } from "@/components/perfil/stats-grid";
import { AchievementsSection } from "@/components/perfil/achievements-section";
import { DenunciarUsuario } from "@/components/perfil/denunciar-usuario";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { usePerfilPublico } from "@/hooks/use-perfil-publico";
import { AbasSeguidores, AdicionarAmigos } from "@/components/perfil/painel-social";
import { SideFooter } from "@/components/shared/side-footer";

export default function PerfilPublicoPage() {
  useRequireAuth();
  const { id } = useParams<{ id: string }>();
  const { perfil, erro, tentarDeNovo } = usePerfilPublico(id);

  // O perfil de outra pessoa usa o mesmo tema do resto do app. Antes ele
  // ganhava uma paleta fixa por cima, numa caixa arredondada, e com qualquer
  // tema diferente do padrão aparecia como um recorte de outra cor.

  return (
    <AppShell contentClassName="max-w-3xl" rightPanel={<><AbasSeguidores usuarioId={id} /><AdicionarAmigos /><SideFooter /></>}>
      <div>
        {!perfil && !erro && (
          <div className="flex min-h-[55dvh] items-center justify-center">
            <span className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
          </div>
        )}
        {erro && (
          <div className="flex min-h-[55dvh] flex-col items-center justify-center gap-4">
            <p className="text-muted-foreground">Não foi possível carregar este perfil.</p>
            <Button onClick={tentarDeNovo}>Tentar novamente</Button>
          </div>
        )}
        {perfil && (
          <div className="flex flex-col gap-7">
            <ProfileHeader perfil={perfil} editavel={false} seguirId={id} />
            <StatsGrid perfil={perfil} />
            <AchievementsSection conquistas={perfil.conquistas} nome={perfil.nome} todasHref={`/perfil/${id}/conquistas`} />
            <DenunciarUsuario id={id} nome={perfil.nome} />
          </div>
        )}
      </div>
    </AppShell>
  );
}
