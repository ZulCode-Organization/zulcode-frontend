"use client";

import { useRequireAuth } from "@/hooks/useAuthGuard";
import { AppShell } from "@/components/app-shell/app-shell";
import { NotificacoesContent } from "@/components/configuracoes/notificacoes-e-widgets";

export default function Pagina() {
  useRequireAuth();
  return <AppShell contentClassName="max-w-2xl"><NotificacoesContent /></AppShell>;
}
