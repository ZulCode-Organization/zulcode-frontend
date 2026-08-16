import { ReactNode } from "react";
import { PerfilProvider, usePerfil } from "@/hooks/use-perfil";
import { AppSidebar } from "./app-sidebar";
import { AppBottomNav } from "./app-bottom-nav";
import { AppTopBar } from "./app-topbar";
import { StickyBottomPanel } from "./sticky-bottom-panel";

interface AppShellProps {
  children: ReactNode;
  rightPanel?: ReactNode;
  /** "sticky-top" (padrão): painel fica no topo, do jeito normal — serve
   * pra quase toda página, onde o conteúdo principal é curto ou parecido
   * em altura com o painel. "sticky-bottom": rola normal e trava no rodapé
   * quando termina — só faz sentido na Jornada, onde a trilha é MUITO mais
   * longa que o painel; nas outras páginas isso travava o painel lá embaixo
   * quase de imediato, porque o conteúdo delas já é curto. */
  rightPanelVariant?: "sticky-top" | "sticky-bottom";
}

function AppShellContent({ children, rightPanel, rightPanelVariant = "sticky-top" }: AppShellProps) {
  const { perfil, loading } = usePerfil();

  return (
    // h-dvh + overflow-hidden trava o viewport inteiro: nada rola aqui fora,
    // cada coluna (sidebar, conteúdo, painel direito) cuida do próprio scroll.
    <div className="flex h-dvh overflow-hidden bg-background">
      <AppSidebar perfil={perfil} loading={loading} />

      {/* Sem topbar no mobile: a navegação já vive inteira na barra inferior,
          então uma segunda barra fixa no topo só duplicava e sobrava. */}
      <div className="flex h-dvh flex-1 flex-col overflow-hidden">
        {/* A coluna inteira (conteúdo + painel) rola junta, numa única barra —
            o painel direito não tem mais scroll próprio, senão a tela acabava
            com duas barras de rolagem lado a lado. A barra de status e os
            cabeçalhos sticky grudam no topo dela, e essa é a única barra de
            rolagem da tela, escondida visualmente (zc-scroll-hidden). */}
        <div className="zc-scroll-hidden flex-1 overflow-y-auto overflow-x-hidden">
          <AppTopBar />

          {/* Sem justify-center: main ocupa todo o espaço que sobra (o
              conteúdo dela fica centralizado por dentro, com sua própria
              largura de leitura), então o painel encosta na borda direita
              de verdade, em vez de ficar centralizado com um vão depois
              dele em telas grandes. */}
          <div className="flex">
            <main className="w-full min-w-0 flex-1 px-4 pb-10 lg:px-8">
              <div className="mx-auto max-w-3xl">{children}</div>
            </main>

            {rightPanel &&
              (rightPanelVariant === "sticky-bottom" ? (
                <StickyBottomPanel className="hidden w-[360px] shrink-0 self-start xl:block">
                  <div className="flex flex-col gap-4 px-7 pb-10">{rightPanel}</div>
                </StickyBottomPanel>
              ) : (
                <aside className="sticky top-6 hidden w-[360px] shrink-0 flex-col gap-4 self-start px-7 pb-10 xl:flex">
                  {rightPanel}
                </aside>
              ))}
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
