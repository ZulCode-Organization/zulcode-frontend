"use client";

import { useRequireAuth } from "@/hooks/useAuthGuard";
import { AppShell } from "@/components/app-shell/app-shell";
import { AjudaContent } from "@/components/configuracoes/ajuda";

export default function Pagina() {
  useRequireAuth();
  return <AppShell contentClassName="max-w-2xl"><AjudaContent /></AppShell>;
}
