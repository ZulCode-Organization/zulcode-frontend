"use client";

import { useRequireAuth } from "@/hooks/useAuthGuard";
import { AppShell } from "@/components/app-shell/app-shell";
import { CursosContent } from "@/components/configuracoes/cursos";

export default function Pagina() {
  useRequireAuth();
  return <AppShell contentClassName="max-w-2xl"><CursosContent /></AppShell>;
}
