"use client";

import { useRequireAuth } from "@/hooks/useAuthGuard";
import { AppShell } from "@/components/app-shell/app-shell";
import { SettingsContent } from "@/components/configuracoes/settings-content";

export default function ConfiguracoesPage() {
  useRequireAuth();
  return <AppShell contentClassName="max-w-4xl"><SettingsContent /></AppShell>;
}
