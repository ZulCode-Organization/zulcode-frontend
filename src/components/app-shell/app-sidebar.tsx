"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Flame } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { PerfilUsuario } from "@/lib/types/perfil";
import { cn } from "@/lib/utils";
import { sidebarNavItems } from "./nav-items";

interface AppSidebarProps {
  perfil: PerfilUsuario | null;
  loading: boolean;
}

export function AppSidebar({ perfil, loading }: AppSidebarProps) {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const logo = resolvedTheme !== "dark" ? "/icon-only.svg" : "/icon-only-dark.svg";
  const progresso =
    perfil && perfil.xpNecessarioNivel !== null
      ? Math.round((perfil.xpNivelAtual / perfil.xpNecessarioNivel) * 100)
      : perfil
        ? 100 // nível máximo
        : 0;

  return (
    <aside className="zc-scroll-hidden hidden h-dvh w-[288px] shrink-0 flex-col overflow-y-auto border-r border-border bg-card px-5 py-7 lg:flex">
      <Link href="/home" className="flex items-center gap-2.5 px-1 pb-2">
        {mounted ? (
          <Image src={logo} alt="" width={40} height={40} className="rounded-xl" />
        ) : (
          <div style={{ width: 40, height: 40 }} />
        )}
        <span className="text-xl font-black tracking-tight text-foreground">ZulCode</span>
      </Link>

      <span className="mb-2.5 mt-6 px-1 text-[0.7rem] font-extrabold uppercase tracking-[0.09em] text-muted-foreground/70">
        Menu
      </span>

      <nav className="flex flex-col gap-1">
        {sidebarNavItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-black uppercase tracking-[0.05em] transition-colors duration-150",
                active
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-[10px] transition-colors duration-150",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground group-hover:text-foreground"
                )}
              >
                <Icon className="size-5" />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" aria-hidden />

      <Link
        href="/perfil"
        className="flex items-center gap-3 rounded-2xl bg-muted p-3.5 transition-colors duration-150 hover:bg-muted/70"
      >
        {loading || !perfil ? (
          <>
            <div className="size-11 shrink-0 animate-pulse rounded-xl bg-border" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="h-3 w-3/4 animate-pulse rounded-full bg-border" />
              <div className="h-1.5 w-full animate-pulse rounded-full bg-border" />
            </div>
          </>
        ) : (
          <>
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-[0.85rem] font-extrabold text-primary-foreground">
              {perfil.iniciais}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[0.85rem] font-extrabold text-foreground">
                  {perfil.nome}
                </span>
                <span className="flex shrink-0 items-center gap-0.5 text-[0.8rem] font-semibold text-orange-500">
                  <Flame className="size-4" />
                  {perfil.streakAtual}
                </span>
              </div>
              <Progress
                value={progresso}
                className="h-1.5 bg-border [&>div]:bg-orange-500"
              />
            </div>
          </>
        )}
      </Link>
    </aside>
  );
}
