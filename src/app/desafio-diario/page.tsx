"use client";

import { Award, Flame, Target, Zap } from "lucide-react";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { AppShell } from "@/components/app-shell/app-shell";
import { FeaturePreviewItem } from "@/components/shared/feature-preview-item";
import { MissionBanner } from "@/components/desafio/mission-banner";

export default function DesafioDiarioPage() {
  useRequireAuth();

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <MissionBanner />

        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
            Desafios do dia
          </h2>

          <FeaturePreviewItem
            icon={Zap}
            iconClassName="bg-amber-500/10 text-amber-500"
            titulo="Ganhe XP hoje"
            descricao="Some pontos de experiência completando lições."
            status="Chegando"
          />
          <FeaturePreviewItem
            icon={Target}
            iconClassName="bg-primary/10 text-primary"
            titulo="Complete uma lição sem errar"
            descricao="Acerte todos os exercícios na primeira tentativa."
            status="No desenho"
          />
          <FeaturePreviewItem
            icon={Flame}
            iconClassName="bg-orange-500/10 text-orange-500"
            titulo="Mantenha sua sequência"
            descricao="Pratique hoje pra não perder sua ofensiva."
            status="Testando"
          />
          <FeaturePreviewItem
            icon={Award}
            iconClassName="bg-violet-500/10 text-violet-500"
            titulo="Recompensa do dia"
            descricao="Complete os desafios de hoje pra desbloquear."
            status="Em breve"
          />
        </div>
      </div>
    </AppShell>
  );
}
