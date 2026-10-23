"use client";

import { useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell/app-shell";
import { CabecalhoDaSubtela } from "@/components/perfil/cabecalho-da-subtela";
import { ListaDeConquistas } from "@/components/perfil/achievements-section";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { usePerfilPublico } from "@/hooks/use-perfil-publico";

/** Todas as conquistas de outra pessoa, na mesma grade da minha página. */
export default function ConquistasDoPerfilPage() {
  useRequireAuth();
  const { id } = useParams<{ id: string }>();
  const { perfil, erro } = usePerfilPublico(id);
  const lista = perfil?.conquistas ?? [];

  return (
    <AppShell contentClassName="max-w-3xl">
      <CabecalhoDaSubtela titulo={perfil ? `Conquistas de ${perfil.nome}` : "Conquistas"} voltarPara={`/perfil/${id}`} />
      {erro ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Não foi possível carregar as conquistas.</p>
      ) : !perfil ? (
        <div className="flex min-h-[30dvh] items-center justify-center">
          <span className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      ) : lista.length ? (
        <ListaDeConquistas conquistas={lista} nome={perfil.nome} />
      ) : (
        <p className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
          {perfil.nome} ainda não desbloqueou nenhuma conquista.
        </p>
      )}
    </AppShell>
  );
}
