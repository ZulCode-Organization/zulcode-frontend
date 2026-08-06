"use client";

import { Heart, Infinity as InfinityIcon, ShieldCheck, Zap } from "lucide-react";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { usePerfil } from "@/hooks/use-perfil";
import { AppShell } from "@/components/app-shell/app-shell";
import { FeaturePreviewItem } from "@/components/shared/feature-preview-item";
import { ProBanner } from "@/components/loja/pro-banner";

function LojaContent() {
  const { perfil, loading } = usePerfil();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold text-foreground">Loja</h1>
        <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm font-bold text-foreground">
          <Zap className="size-4 text-primary" />
          {loading || !perfil ? "…" : perfil.xp.toLocaleString("pt-BR")} XP
        </span>
      </div>

      <ProBanner />

      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Vidas</h2>
        <FeaturePreviewItem
          icon={Heart}
          iconClassName="bg-rose-500/10 text-rose-500"
          titulo="Recuperar vidas"
          descricao="Recupere todas as suas vidas pra errar menos nas lições."
          status="Chegando"
        />
        <FeaturePreviewItem
          icon={InfinityIcon}
          iconClassName="bg-sky-500/10 text-sky-500"
          titulo="Vidas ilimitadas"
          descricao="Nunca fique sem vidas enquanto pratica."
          status="No radar"
        />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Superpoderes</h2>
        <FeaturePreviewItem
          icon={ShieldCheck}
          iconClassName="bg-primary/10 text-primary"
          titulo="Congelar sequência"
          descricao="Mantenha sua sequência intacta mesmo se faltar um dia."
          status="Em construção"
        />
        <FeaturePreviewItem
          icon={Zap}
          iconClassName="bg-amber-500/10 text-amber-500"
          titulo="XP em dobro"
          descricao="Ganhe o dobro de XP por um tempo limitado."
          status="Testando"
        />
      </div>
    </div>
  );
}

export default function LojaPage() {
  useRequireAuth();

  return (
    <AppShell>
      <LojaContent />
    </AppShell>
  );
}
