import { ReactNode } from "react";
import { DadosUsuario } from "@/lib/types/usuario";
import { AppSidebar } from "./app-sidebar";
import { AppTopbar } from "./app-topbar";
import { AppBottomNav } from "./app-bottom-nav";

interface AppShellProps {
  usuario: DadosUsuario;
  children: ReactNode;
  rightPanel?: ReactNode;
}

export function AppShell({ usuario, children, rightPanel }: AppShellProps) {
  return (
    <div className="flex min-h-dvh bg-background">
      <AppSidebar usuario={usuario} />

      <div className="flex min-h-dvh flex-1 flex-col">
        <AppTopbar />

        <div className="flex flex-1 justify-center">
          <main className="w-full min-w-0 max-w-3xl flex-1 px-4 py-6 lg:px-10 lg:py-10">{children}</main>

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
