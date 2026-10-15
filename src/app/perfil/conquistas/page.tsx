"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { usePerfil } from "@/hooks/use-perfil";
import { AppShell } from "@/components/app-shell/app-shell";
import { ListaDeConquistas } from "@/components/perfil/achievements-section";

/** Todas as conquistas da pessoa, na mesma grade do perfil. */
function TodasAsConquistas() {
  const { perfil, loading } = usePerfil();

  if (loading || !perfil) {
    return (
      <div className="flex min-h-[40dvh] items-center justify-center">
        <span className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  const lista = perfil.conquistas ?? [];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link href="/perfil" aria-label="Voltar ao perfil" className="grid size-10 place-items-center rounded-xl bg-muted text-muted-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-xl font-black text-foreground">Conquistas</h1>
        <span className="text-sm font-black text-muted-foreground">{lista.length}</span>
      </div>
      {lista.length ? (
        <ListaDeConquistas conquistas={lista} />
      ) : (
        <p className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
          Conclua missões especiais para desbloquear suas primeiras conquistas.
        </p>
      )}
    </div>
  );
}

export default function ConquistasPage() {
  useRequireAuth();
  return (
    <AppShell contentClassName="max-w-3xl">
      <TodasAsConquistas />
    </AppShell>
  );
}
