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
    // h-dvh + overflow-hidden trava o viewport inteiro: nada rola aqui fora,
    // cada coluna (sidebar, conteúdo, painel direito) cuida do próprio scroll.
    <div className="flex h-dvh overflow-hidden bg-background">
      <AppSidebar perfil={perfil} loading={loading} />

      {/* Sem topbar no mobile: a navegação já vive inteira na barra inferior,
          então uma segunda barra fixa no topo só duplicava e sobrava. */}
      <div className="flex h-dvh flex-1 flex-col overflow-hidden">
        <div className="flex flex-1 justify-center overflow-hidden">
          <main className="w-full min-w-0 max-w-3xl flex-1 overflow-y-auto px-4 pb-6 pt-8 lg:px-10 lg:py-10">
            {children}
          </main>

          {rightPanel && (
            <aside className="hidden w-80 shrink-0 flex-col gap-6 overflow-y-auto border-l border-border/60 px-6 py-10 xl:flex">
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
