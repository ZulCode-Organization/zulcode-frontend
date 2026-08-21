"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell/app-shell";
import { usePerfil } from "@/hooks/use-perfil";

function Guard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { perfil, loading } = usePerfil();
  useEffect(() => {
    if (!loading && perfil?.role !== "ADMIN") router.replace("/home");
  }, [loading, perfil?.role, router]);
  if (loading || perfil?.role !== "ADMIN") return <div className="p-10 text-muted-foreground">Verificando acesso…</div>;
  return <>{children}</>;
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  return <AppShell><Guard>{children}</Guard></AppShell>;
}
