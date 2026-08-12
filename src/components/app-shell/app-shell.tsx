import { ReactNode } from "react";
import { PerfilProvider, usePerfil } from "@/hooks/use-perfil";
import { AppSidebar } from "./app-sidebar";
import { AppBottomNav } from "./app-bottom-nav";
import { AppTopBar } from "./app-topbar";

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
        {/* A coluna inteira (conteúdo + painel) rola junta, e a barra de status
            e os cabeçalhos sticky grudam no topo dela — é isso que faz o banner
            de unidade continuar visível enquanto a trilha desce. */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <AppTopBar />

          <div className="flex justify-center">
            <main className="w-full min-w-0 max-w-3xl flex-1 px-4 pb-10 lg:px-8">{children}</main>

            {rightPanel && (
              <aside className="sticky top-[72px] hidden max-h-[calc(100dvh-84px)] w-[360px] shrink-0 flex-col gap-4 self-start overflow-y-auto px-7 pb-10 xl:flex">
                {rightPanel}
              </aside>
            )}
          </div>
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
