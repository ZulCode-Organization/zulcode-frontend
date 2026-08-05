"use client";

import { useRequireAuth } from "@/hooks/useAuthGuard";
import { AppShell } from "@/components/app-shell/app-shell";
import { UnitBanner } from "@/components/home/unit-banner";
import { LessonTrail } from "@/components/home/lesson-trail";
import { StreakWidget } from "@/components/home/streak-widget";
import { LeaderboardWidget } from "@/components/home/leaderboard-widget";
import { DailyGoalsWidget } from "@/components/home/daily-goals-widget";
import { trilhaAtual } from "@/data/trilha";

export default function HomePage() {
  useRequireAuth();

  return (
    <AppShell
      rightPanel={
        <>
          <StreakWidget />
          <LeaderboardWidget />
          <DailyGoalsWidget />
        </>
      }
    >
      <UnitBanner unidade={trilhaAtual} />

      <div className="mt-8 flex flex-col items-center gap-1 text-center">
        <h1 className="text-lg font-extrabold uppercase tracking-wide text-foreground">
          {trilhaAtual.titulo}
        </h1>
        <p className="text-sm text-muted-foreground">
          {trilhaAtual.licoes.length} lições • {trilhaAtual.duracaoEstimada}
        </p>
      </div>

      <LessonTrail licoes={trilhaAtual.licoes} />
    </AppShell>
  );
}
