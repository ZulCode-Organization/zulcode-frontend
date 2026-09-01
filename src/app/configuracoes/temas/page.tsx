"use client";

import { useRequireAuth } from "@/hooks/useAuthGuard";
import { AppShell } from "@/components/app-shell/app-shell";
import { TemasContent } from "@/components/configuracoes/temas-content";

export default function TemasPage() {
  useRequireAuth();
  return <AppShell contentClassName="max-w-2xl"><TemasContent /></AppShell>;
}
