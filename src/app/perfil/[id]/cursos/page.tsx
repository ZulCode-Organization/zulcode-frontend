"use client";

import { useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell/app-shell";
import { LadrilhoCurso } from "@/components/app-shell/topbar-cursos";
import { CabecalhoDaSubtela } from "@/components/perfil/cabecalho-da-subtela";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { usePerfilPublico } from "@/hooks/use-perfil-publico";

/** "Cursos de X": cada curso que a pessoa começou, com o XP ganho nele. */
export default function CursosDoPerfilPage() {
  useRequireAuth();
  const { id } = useParams<{ id: string }>();
  const { perfil, erro } = usePerfilPublico(id);
  const cursos = perfil?.cursosPublicos ?? null;

  return (
    <AppShell contentClassName="max-w-2xl">
      <CabecalhoDaSubtela titulo={perfil ? `Cursos de ${perfil.nome}` : "Cursos"} voltarPara={`/perfil/${id}`} />
      {erro ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Não foi possível carregar os cursos.</p>
      ) : cursos === null ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      ) : !cursos.length ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          {perfil?.nome} ainda não começou nenhum curso.
        </p>
      ) : (
        <ul className="flex flex-col">
          {cursos.map((curso, i) => (
            <li
              key={curso.id}
              style={{ animationDelay: `${Math.min(i, 8) * 35}ms` }}
              className="animate-fade-in-up flex items-center gap-4 py-3.5"
            >
              <LadrilhoCurso curso={{ id: curso.id, name: curso.name, icon: "" }} px={34} largura={46} />
              <span className="min-w-0 flex-1 truncate text-[1.02rem] font-black text-foreground">{curso.name}</span>
              <span className="shrink-0 text-[0.95rem] font-bold text-muted-foreground">{curso.xp.toLocaleString("pt-BR")} XP</span>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
