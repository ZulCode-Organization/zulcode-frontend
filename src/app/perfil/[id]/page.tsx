"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/app-shell/app-shell";
import { ProfileHeader } from "@/components/perfil/profile-header";
import { StatsGrid } from "@/components/perfil/stats-grid";
import { AchievementsSection } from "@/components/perfil/achievements-section";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";
import { calcularProgressoNivel } from "@/lib/leveling";
import { PerfilUsuario } from "@/lib/types/perfil";
import { getProfileThemeStyle } from "@/hooks/use-perfil";
import { AbasSeguidores, AdicionarAmigos } from "@/components/perfil/painel-social";
import { SideFooter } from "@/components/shared/side-footer";

function iniciais(nome: string) { return nome.trim().split(/\s+/).slice(0, 2).map((parte) => parte[0] ?? "").join("").toUpperCase(); }

export default function PerfilPublicoPage() {
  useRequireAuth();
  const { id } = useParams<{ id: string }>();
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [erro, setErro] = useState(false);

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

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token || !id) return;
    fetchComTimeout(`${API_BASE_URL}/user/public/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => {
        const progresso = calcularProgressoNivel(data.xp, data.nivel);
        setPerfil({ id: data.id, publicCode: data.publicCode, role: "USER", nome: data.name, email: "", iniciais: iniciais(data.name), avatarId: data.avatarId, bannerColor: data.bannerColor, isVerified: data.isVerified, themeColor: data.themeColor, themeMode: data.themeMode, xp: data.xp, nivel: data.nivel, nivelLabel: data.nivelLabel, xpNivelAtual: progresso.xpNivelAtual, xpNecessarioNivel: progresso.xpNecessarioNivel, xpProximoNivel: data.xpProximoNivel, streakAtual: data.currentStreak, streakRecorde: data.longestStreak, vidas: null, moedas: null, xpHoje: null, licoesHoje: null, conquistas: Array.isArray(data.achievements) ? data.achievements : [] });
      })
      .catch(() => setErro(true));
  }, [id]);

  return <AppShell contentClassName="max-w-3xl" rightPanel={<><AbasSeguidores /><AdicionarAmigos /><SideFooter /></>}><div>{!perfil && !erro && <div className="flex min-h-[55dvh] items-center justify-center"><span className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" /></div>}{erro && <div className="flex min-h-[55dvh] flex-col items-center justify-center gap-4"><p className="text-muted-foreground">Não foi possível carregar este perfil.</p><Button onClick={() => location.reload()}>Tentar novamente</Button></div>}{perfil && <div style={resolvedTheme ? getProfileThemeStyle(perfil.themeColor, meuModo) : undefined} className="rounded-3xl bg-background text-foreground"><div className="flex flex-col gap-7"><ProfileHeader perfil={perfil} editavel={false} /><StatsGrid perfil={perfil} /><AchievementsSection conquistas={perfil.conquistas} /><div className="rounded-[20px] border border-border bg-card p-5 text-sm text-muted-foreground">{perfil.nome} concluiu desafios e está evoluindo no ZulCode.</div></div></div>}</div></AppShell>;
}
