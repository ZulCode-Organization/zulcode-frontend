"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell/app-shell";
import { usePerfil } from "@/hooks/use-perfil";
import { AdminNav } from "./admin-nav";

function Guard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { perfil, loading } = usePerfil();
  const podeEntrar = perfil?.role === "ADMIN" || perfil?.role === "PROFESSOR";

  useEffect(() => {
    if (!loading && !podeEntrar) router.replace("/home");
  }, [loading, podeEntrar, router]);

  // Enquanto o perfil carrega, um esqueleto no lugar de uma frase solta: a
  // página já nasce com a forma que vai ter, então nada salta quando chega.
  if (loading || !podeEntrar) {
    return (
      <div className="animate-pulse py-8">
        <div className="h-10 w-52 rounded-xl bg-muted" />
        <div className="mt-6 h-28 rounded-3xl bg-muted" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-36 rounded-3xl bg-muted" />)}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  return (
    <AppShell contentClassName="max-w-6xl">
      <AdminNav />
      <Guard>{children}</Guard>
    </AppShell>
  );
}
