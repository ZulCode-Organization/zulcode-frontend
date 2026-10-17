"use client";

import { useRequireAuth } from "@/hooks/useAuthGuard";
import { AppShell } from "@/components/app-shell/app-shell";
import { PreferenciasContent } from "@/components/configuracoes/preferencias";

export default function Pagina() {
  useRequireAuth();
  return <AppShell contentClassName="max-w-2xl"><PreferenciasContent /></AppShell>;
}
