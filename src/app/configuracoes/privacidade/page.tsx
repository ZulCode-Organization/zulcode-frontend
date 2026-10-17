"use client";

import { useRequireAuth } from "@/hooks/useAuthGuard";
import { AppShell } from "@/components/app-shell/app-shell";
import { PrivacidadeContent } from "@/components/configuracoes/privacidade";

export default function Pagina() {
  useRequireAuth();
  return <AppShell contentClassName="max-w-2xl"><PrivacidadeContent /></AppShell>;
}
