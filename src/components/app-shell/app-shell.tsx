import { ReactNode } from "react";
import { PerfilProvider, usePerfil } from "@/hooks/use-perfil";
import { AppSidebar } from "./app-sidebar";
import { AppBottomNav } from "./app-bottom-nav";

interface AppShellProps {
  children: ReactNode;
  rightPanel?: ReactNode;
}

function AppShellContent({ children, rightPanel }: AppShellProps) {
  const { perfil, loading } = usePerfil();

  return (
    <div className="flex min-h-dvh bg-background">
      <AppSidebar perfil={perfil} loading={loading} />

      {/* Sem topbar no mobile: a navegação já vive inteira na barra inferior,
          então uma segunda barra fixa no topo só duplicava e sobrava. */}
      <div className="flex min-h-dvh flex-1 flex-col">
        <div className="flex flex-1 justify-center">
          <main className="w-full min-w-0 max-w-3xl flex-1 px-4 pb-6 pt-8 lg:px-10 lg:py-10">{children}</main>

          {rightPanel && (
            <aside className="hidden w-80 shrink-0 flex-col gap-6 border-l border-border/60 px-6 py-10 xl:flex">
              {rightPanel}
            </aside>
          )}
        </div>

        <AppBottomNav />
      </div>
    </div>
  );
}

/** Busca o perfil (nome, xp, streak, cursos) uma única vez em GET /user + /languages e compartilha com todas as telas. */
export function AppShell(props: AppShellProps) {
  return (
    <PerfilProvider>
      <AppShellContent {...props} />
    </PerfilProvider>
  );
}
