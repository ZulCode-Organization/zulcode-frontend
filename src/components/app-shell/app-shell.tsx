import { ReactNode } from "react";
import { PerfilProvider } from "@/hooks/use-perfil";
import { AppSidebar } from "./app-sidebar";
import { AppBottomNav } from "./app-bottom-nav";
import { AppTopBar } from "./app-topbar";
import { StickyBottomPanel } from "./sticky-bottom-panel";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: ReactNode;
  rightPanel?: ReactNode;
  /** Largura máxima da área de conteúdo. Páginas como Perfil usam a área
   * inteira, enquanto as telas de leitura mantêm a coluna mais estreita. */
  contentClassName?: string;
  /** "sticky-top" (padrão): painel fica no topo, do jeito normal — serve
   * pra quase toda página, onde o conteúdo principal é curto ou parecido
   * em altura com o painel. "sticky-bottom": rola normal e trava no rodapé
   * quando termina — só faz sentido na Jornada, onde a trilha é MUITO mais
   * longa que o painel; nas outras páginas isso travava o painel lá embaixo
   * quase de imediato, porque o conteúdo delas já é curto. */
  rightPanelVariant?: "sticky-top" | "sticky-bottom";
  /** Para ferramentas como o Playground: a rolagem acontece apenas dentro
   * dos próprios painéis, nunca no viewport da aplicação. */
  fixedContent?: boolean;
}

function AppShellContent({ children, rightPanel, contentClassName = "max-w-3xl", rightPanelVariant = "sticky-top", fixedContent = false }: AppShellProps) {
  return (
    // h-dvh + overflow-hidden trava o viewport inteiro: nada rola aqui fora,
    // cada coluna (sidebar, conteúdo, painel direito) cuida do próprio scroll.
    <div className="flex h-dvh overflow-hidden bg-background">
      <AppSidebar />

      {/* Sem topbar no mobile: a navegação já vive inteira na barra inferior,
          então uma segunda barra fixa no topo só duplicava e sobrava. */}
      <div className="flex h-dvh flex-1 flex-col overflow-hidden">
        {/* A coluna inteira (conteúdo + painel) rola junta, numa única barra —
            o painel direito não tem mais scroll próprio, senão a tela acabava
            com duas barras de rolagem lado a lado. A barra de status e os
            cabeçalhos sticky grudam no topo dela, e essa é a única barra de
            rolagem da tela, escondida visualmente (zc-scroll-hidden). */}
        <div className={cn("zc-scroll-hidden flex-1 overflow-y-auto overflow-x-hidden", fixedContent && "overflow-y-hidden")}>
          <AppTopBar />

          {/* Sem justify-center: main ocupa todo o espaço que sobra (o
              conteúdo dela fica centralizado por dentro, com sua própria
              largura de leitura), então o painel encosta na borda direita
              de verdade, em vez de ficar centralizado com um vão depois
              dele em telas grandes. */}
          <div className="flex">
            <main className={cn("w-full min-w-0 flex-1 px-4 pb-10 lg:px-8", fixedContent && "h-[calc(100dvh-136px)] overflow-hidden pb-0 lg:h-[calc(100dvh-72px)]")}>
              <div className={cn("mx-auto", contentClassName, fixedContent && "h-full min-h-0")}>{children}</div>
            </main>

            {/* As duas colunas laterais nascem no mesmo ponto (lg): é de lá pra
                cima que a sidebar esquerda aparece, e o layout do app é as
                três colunas juntas — a direita nunca fica de fora enquanto a
                esquerda estiver na tela. Entre lg e xl ela vem mais estreita,
                do mesmo jeito que a esquerda vira trilho de ícones. */}
            {/* O pt-5 é só deste painel: os chips da barra de status ficam
                alinhados à direita, ou seja, logo em cima dele — sem esse
                respiro o primeiro card encosta neles. O cabeçalho da Jornada,
                na coluna do meio, não tem chip nenhum em cima e por isso sobe
                colado na barra. */}
            {rightPanel &&
              (rightPanelVariant === "sticky-bottom" ? (
                <StickyBottomPanel className="hidden w-[300px] shrink-0 self-start lg:block xl:w-[360px]">
                  <div className="flex flex-col gap-4 px-5 pb-10 pt-5 xl:px-7">{rightPanel}</div>
                </StickyBottomPanel>
              ) : (
                <aside className="sticky hidden w-[300px] shrink-0 flex-col gap-4 self-start px-5 pb-10 pt-5 lg:flex xl:w-[360px] xl:px-7" style={{ top: "var(--zc-topbar-h, 72px)" }}>
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
