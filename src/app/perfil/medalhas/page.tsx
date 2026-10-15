"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { usePerfil } from "@/hooks/use-perfil";
import { AppShell } from "@/components/app-shell/app-shell";
import { TodasAsMedalhas } from "@/components/perfil/medalhas-perfil";

/** Todas as medalhas da pessoa, um ano por bloco. */
function Medalhas() {
  const { perfil, loading } = usePerfil();

  if (loading || !perfil) {
    return (
      <div className="flex min-h-[40dvh] items-center justify-center">
        <span className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link href="/perfil" aria-label="Voltar ao perfil" className="grid size-10 place-items-center rounded-xl bg-muted text-muted-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-xl font-black text-foreground">Medalhas</h1>
      </div>
      <p className="text-sm text-muted-foreground">Ganhe a medalha do mês ficando no pódio da sua liga em pelo menos uma semana.</p>
      <TodasAsMedalhas medalhas={perfil.medalhas} />
    </div>
  );
}

export default function MedalhasPage() {
  useRequireAuth();
  return (
    <AppShell contentClassName="max-w-3xl">
      <Medalhas />
    </AppShell>
  );
}
