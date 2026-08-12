"use client";

import { Heart, Infinity as InfinityIcon, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { usePerfil } from "@/hooks/use-perfil";
import { AppShell } from "@/components/app-shell/app-shell";
import { FeaturePreviewItem } from "@/components/shared/feature-preview-item";
import { ProBanner } from "@/components/loja/pro-banner";
import { SideFooter } from "@/components/shared/side-footer";

function SecaoLoja({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mt-8 text-xl font-black text-foreground">{titulo}</h2>
      <div className="mt-3.5 h-px bg-border" aria-hidden />
      {children}
    </div>
  );
}

function LojaContent() {
  return (
    <div className="pt-3">
      <ProBanner />

      <SecaoLoja titulo="Vidas">
        <FeaturePreviewItem
          icon={Heart}
          iconClassName="text-rose-500"
          titulo="Recuperar vidas"
          descricao="Recupere todas as suas vidas pra errar menos nas lições."
          status="Chegando"
        />
        <FeaturePreviewItem
          icon={InfinityIcon}
          iconClassName="text-sky-500"
          titulo="Vidas ilimitadas"
          descricao="Nunca fique sem vidas enquanto pratica."
          status="No radar"
        />
      </SecaoLoja>

      <SecaoLoja titulo="Superpoderes">
        <FeaturePreviewItem
          icon={ShieldCheck}
          iconClassName="text-primary"
          titulo="Congelar sequência"
          descricao="Mantenha sua sequência intacta mesmo se faltar um dia."
          status="Em construção"
        />
        <FeaturePreviewItem
          icon={Zap}
          iconClassName="text-amber-500"
          titulo="XP em dobro"
          descricao="Ganhe o dobro de XP por um tempo limitado."
          status="Testando"
        />
      </SecaoLoja>
    </div>
  );
}

function PainelMoedas() {
  const { perfil, loading } = usePerfil();

  return (
    <div className="animate-fade-in-up rounded-[20px] border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-[0.95rem] font-black text-foreground">Seu XP</h3>
        <span className="flex shrink-0 items-center gap-1.5 text-[0.95rem] font-black text-sky-500">
          <Zap className="size-4.5" />
          {loading || !perfil ? "…" : perfil.xp.toLocaleString("pt-BR")}
        </span>
      </div>

      <p className="text-[0.85rem] leading-relaxed text-muted-foreground">
        Complete lições e metas do dia para somar mais XP. Quando a loja abrir, é ele que vai
        destravar os itens.
      </p>

      <Link
        href="/metas"
        className="mt-4.5 block rounded-[14px] border-2 border-border py-3.5 text-center text-[0.78rem] font-black uppercase tracking-[0.06em] text-primary"
      >
        Ver metas do dia
      </Link>
    </div>
  );
}

export default function LojaPage() {
  useRequireAuth();

  return (
    <AppShell
      rightPanel={
        <>
          <PainelMoedas />
          <SideFooter />
        </>
      }
    >
      <LojaContent />
    </AppShell>
  );
}
