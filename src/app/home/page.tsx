"use client";

import { useRequireAuth } from "@/hooks/useAuthGuard";
import { AppShell } from "@/components/app-shell/app-shell";
import { LessonTrail } from "@/components/home/lesson-trail";
import { ProCard } from "@/components/home/pro-card";
import { LeaderboardWidget } from "@/components/home/leaderboard-widget";
import { DailyGoalsWidget } from "@/components/home/daily-goals-widget";
import { SideFooter } from "@/components/shared/side-footer";
import { unidadesTrilha } from "@/data/trilha";

export default function HomePage() {
  useRequireAuth();

  return (
    <AppShell
      rightPanel={
        <>
          <ProCard />
          <LeaderboardWidget />
          <DailyGoalsWidget />
          <SideFooter />
        </>
      }
    >
      {/* LessonTrail cuida do próprio cabeçalho fixo (UnitBanner) — ele troca
          de nome/cor sozinho conforme o scroll entra em cada unidade. */}
      <LessonTrail unidades={unidadesTrilha} />
    </AppShell>
  );
}
