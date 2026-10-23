"use client";

import { useTheme } from "next-themes";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/app-shell/app-shell";
import { ProfileHeader } from "@/components/perfil/profile-header";
import { StatsGrid } from "@/components/perfil/stats-grid";
import { AchievementsSection } from "@/components/perfil/achievements-section";
import { DenunciarUsuario } from "@/components/perfil/denunciar-usuario";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { usePerfilPublico } from "@/hooks/use-perfil-publico";
import { getProfileThemeStyle } from "@/hooks/use-perfil";
import { AbasSeguidores, AdicionarAmigos } from "@/components/perfil/painel-social";
import { SideFooter } from "@/components/shared/side-footer";

export default function PerfilPublicoPage() {
  useRequireAuth();
  const { id } = useParams<{ id: string }>();
  const { perfil, erro, tentarDeNovo } = usePerfilPublico(id);

  // A cor do perfil e de quem esta sendo visitado, mas o claro/escuro e de
  // quem visita: entrar num perfil nao pode acender a tela de quem usa o
  // tema escuro. Antes o themeMode vinha junto do perfil buscado e a coluna
  // inteira trocava de modo.
  //
  // O resolvedTheme so existe depois da montagem: no servidor e na primeira
  // renderizacao ele vem indefinido. Enquanto isso o estilo fica de fora e a
  // coluna herda o tema do app, que ja e o certo -- entao nao ha piscada de
  // tela clara, e nao precisa de um estado de "montado" so pra isso.
  const { resolvedTheme } = useTheme();
  const meuModo = resolvedTheme === "dark" ? "dark" : "light";

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
          <div style={resolvedTheme ? getProfileThemeStyle(meuModo) : undefined} className="rounded-3xl bg-background text-foreground">
            <div className="flex flex-col gap-7">
              <ProfileHeader perfil={perfil} editavel={false} seguirId={id} />
              <StatsGrid perfil={perfil} />
              <AchievementsSection conquistas={perfil.conquistas} nome={perfil.nome} todasHref={`/perfil/${id}/conquistas`} />
              <DenunciarUsuario id={id} nome={perfil.nome} />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
