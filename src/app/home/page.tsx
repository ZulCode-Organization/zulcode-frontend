"use client";

import { RefreshCw } from "lucide-react";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { useTrilha } from "@/hooks/use-trilha";
import { AppShell } from "@/components/app-shell/app-shell";
import { LessonTrail } from "@/components/home/lesson-trail";
import { ProCard } from "@/components/home/pro-card";
import { LeaderboardWidget } from "@/components/home/leaderboard-widget";
import { DailyGoalsWidget } from "@/components/home/daily-goals-widget";
import { SideFooter } from "@/components/shared/side-footer";

/** Esqueleto enquanto a trilha de verdade (GET /languages/javascript/track)
 * ainda não voltou — mesmo padrão de "pulso" usado no cartão de perfil da
 * sidebar. */
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

function TrilhaErro({ onTentarNovamente }: { onTentarNovamente: () => void }) {
  return (
    <div className="mx-auto mt-16 flex max-w-sm flex-col items-center gap-4 text-center">
      <p className="text-sm text-muted-foreground">Não deu pra carregar a sua trilha agora.</p>
      <button
        type="button"
        onClick={onTentarNovamente}
        className="zc-press zc-press-shadow flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-[0.8rem] font-black uppercase tracking-[0.06em] text-primary-foreground"
        style={{ ["--zc-press-color" as string]: "color-mix(in srgb, var(--primary) 70%, black)" }}
      >
        <RefreshCw className="size-4" />
        Tentar de novo
      </button>
    </div>
  );
}

export default function HomePage() {
  useRequireAuth();
  const { unidades, loading, error, retry } = useTrilha("javascript");

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
          de nome/cor sozinho conforme o scroll entra em cada unidade. Os
          dados vêm de verdade do backend: cada lição só libera depois que a
          anterior é concluída de fato (GET /languages/javascript/track). */}
      {loading ? (
        <TrilhaEsqueleto />
      ) : error || unidades.length === 0 ? (
        <TrilhaErro onTentarNovamente={retry} />
      ) : (
        <LessonTrail unidades={unidades} />
      )}
    </AppShell>
  );
}
