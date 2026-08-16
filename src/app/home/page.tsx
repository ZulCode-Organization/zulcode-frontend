"use client";

import { useRequireAuth } from "@/hooks/useAuthGuard";
import { useJornada } from "@/hooks/use-jornada";
import { AppShell } from "@/components/app-shell/app-shell";
import { LessonTrail } from "@/components/home/lesson-trail";
import { ProCard } from "@/components/home/pro-card";
import { LeaderboardWidget } from "@/components/home/leaderboard-widget";
import { DailyGoalsWidget } from "@/components/home/daily-goals-widget";
import { SideFooter } from "@/components/shared/side-footer";

/** Esqueleto só no primeiro carregamento, enquanto confirma o estado da
 * lição conectada ao backend — mesmo padrão de "pulso" usado no cartão de
 * perfil da sidebar. Depois de cacheado (useTrilha), isso não aparece mais
 * ao trocar de tela e voltar. */
function TrilhaEsqueleto() {
  return (
    <div className="mx-auto mt-7 flex max-w-[290px] flex-col items-center gap-5 pb-3">
      <div className="h-[92px] w-full animate-pulse rounded-3xl bg-muted" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="size-[96px] animate-pulse rounded-[34px] bg-muted" />
      ))}
    </div>
  );
}

export default function HomePage() {
  useRequireAuth();
  const { unidades, loading } = useJornada();

  return (
    <AppShell
      rightPanelVariant="sticky-bottom"
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
          de nome/cor sozinho conforme o scroll entra em cada unidade. O
          estado de cada lição (atual/bloqueada/concluída) é sempre
          calculado a partir de progresso de verdade — da única lição
          semeada no backend, ou do progresso local nas outras — nunca
          hardcoded, então a 2ª lição só libera depois que a 1ª é concluída. */}
      {loading ? <TrilhaEsqueleto /> : <LessonTrail unidades={unidades} />}
    </AppShell>
  );
}
