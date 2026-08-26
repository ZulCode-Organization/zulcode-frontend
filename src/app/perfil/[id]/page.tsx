"use client";

import { useEffect, useState } from "react";
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

function iniciais(nome: string) { return nome.trim().split(/\s+/).slice(0, 2).map((parte) => parte[0] ?? "").join("").toUpperCase(); }

export default function PerfilPublicoPage() {
  useRequireAuth();
  const { id } = useParams<{ id: string }>();
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token || !id) return;
    fetchComTimeout(`${API_BASE_URL}/user/public/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => {
        const progresso = calcularProgressoNivel(data.xp, data.nivel);
        setPerfil({ id: data.id, publicCode: data.publicCode, role: "USER", nome: data.name, email: "", iniciais: iniciais(data.name), avatarId: data.avatarId, bannerColor: data.bannerColor, themeColor: data.themeColor, themeMode: data.themeMode, xp: data.xp, nivel: data.nivel, nivelLabel: data.nivelLabel, xpNivelAtual: progresso.xpNivelAtual, xpNecessarioNivel: progresso.xpNecessarioNivel, xpProximoNivel: data.xpProximoNivel, streakAtual: data.currentStreak, streakRecorde: data.longestStreak, vidas: null, moedas: null, xpHoje: null, licoesHoje: null, conquistas: Array.isArray(data.achievements) ? data.achievements : [] });
      })
      .catch(() => setErro(true));
  }, [id]);

  return <AppShell contentClassName="max-w-6xl"><div className="pt-3">{!perfil && !erro && <div className="flex min-h-[55dvh] items-center justify-center"><span className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" /></div>}{erro && <div className="flex min-h-[55dvh] flex-col items-center justify-center gap-4"><p className="text-muted-foreground">Não foi possível carregar este perfil.</p><Button onClick={() => location.reload()}>Tentar novamente</Button></div>}{perfil && <div style={getProfileThemeStyle(perfil.themeColor, perfil.themeMode)} className="rounded-3xl bg-background p-5 text-foreground sm:p-7"><div className="flex flex-col gap-7"><ProfileHeader perfil={perfil} editavel={false} /><StatsGrid perfil={perfil} /><AchievementsSection conquistas={perfil.conquistas} /><div className="rounded-[20px] border border-border bg-card p-5 text-sm text-muted-foreground">{perfil.nome} concluiu desafios e está evoluindo no ZulCode.</div></div></div>}</div></AppShell>;
}
