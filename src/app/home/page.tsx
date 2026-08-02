"use client";

import { useRequireAuth } from "@/hooks/useAuthGuard";
import { useUsuario } from "@/hooks/use-usuario";
import { AppShell } from "@/components/app-shell/app-shell";
import { UnitBanner } from "@/components/home/unit-banner";
import { LessonTrail } from "@/components/home/lesson-trail";
import { LeaderboardWidget } from "@/components/home/leaderboard-widget";
import { DailyGoalsWidget } from "@/components/home/daily-goals-widget";
import { trilhaAtual } from "@/data/trilha";
import { metasDiarias, tabelaLideresBloqueio } from "@/data/painel-lateral";

export default function HomePage() {
  useRequireAuth();
  const usuario = useUsuario();

  return (
    <AppShell
      usuario={usuario}
      rightPanel={
        <>
          <LeaderboardWidget
            xpAtual={tabelaLideresBloqueio.xpAtual}
            xpNecessario={tabelaLideresBloqueio.xpNecessario}
          />
          <DailyGoalsWidget metas={metasDiarias} />
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
