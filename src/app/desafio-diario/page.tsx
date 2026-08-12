"use client";

import { Award, Flame, Target, Zap } from "lucide-react";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { AppShell } from "@/components/app-shell/app-shell";
import { FeaturePreviewItem } from "@/components/shared/feature-preview-item";
import { MissionBanner } from "@/components/desafio/mission-banner";
import { SideFooter } from "@/components/shared/side-footer";

export default function DesafioDiarioPage() {
  useRequireAuth();

  return (
    <AppShell rightPanel={<SideFooter />}>
      <div className="pt-3">
        <MissionBanner />

        <h2 className="mt-8 text-xl font-black text-foreground">Desafios do dia</h2>
        <div className="mt-3.5 h-px bg-border" aria-hidden />

        <FeaturePreviewItem
          icon={Zap}
          iconClassName="text-amber-500"
          titulo="Ganhe XP hoje"
          descricao="Some pontos de experiência completando lições."
          status="Chegando"
        />
        <FeaturePreviewItem
          icon={Target}
          iconClassName="text-primary"
          titulo="Complete uma lição sem errar"
          descricao="Acerte todos os exercícios na primeira tentativa."
          status="No desenho"
        />
        <FeaturePreviewItem
          icon={Flame}
          iconClassName="text-orange-500"
          titulo="Mantenha sua sequência"
          descricao="Pratique hoje pra não perder sua ofensiva."
          status="Testando"
        />
        <FeaturePreviewItem
          icon={Award}
          iconClassName="text-violet-500"
          titulo="Recompensa do dia"
          descricao="Complete os desafios de hoje pra desbloquear."
          status="Em breve"
        />
      </div>
    </AppShell>
  );
}
