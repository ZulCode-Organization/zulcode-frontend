"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Flame } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { UserAvatar } from "@/components/shared/user-avatar";
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
    <aside className="hidden h-dvh w-64 shrink-0 flex-col overflow-y-auto border-r border-border/60 bg-gradient-to-b from-card/60 to-card/20 px-4 py-6 lg:flex">
      <Link href="/home" className="flex items-center gap-2 px-2 pb-6">
        {mounted ? (
          <Image src={logo} alt="" width={32} height={32} className="rounded-lg" />
        ) : (
          <div style={{ width: 32, height: 32 }} />
        )}
        <span className="text-lg font-black tracking-tight text-foreground">ZulCode</span>
      </Link>

      <span className="px-3 pb-2 text-[0.65rem] font-extrabold uppercase tracking-widest text-muted-foreground/70">
        Menu
      </span>

      <nav className="flex flex-1 flex-col gap-1">
        {sidebarNavItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl py-2 pl-3 pr-3 text-sm font-semibold transition-colors duration-150",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "absolute left-0 h-5 w-1 rounded-full bg-primary transition-opacity duration-150",
                  active ? "opacity-100" : "opacity-0"
                )}
                aria-hidden
              />
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-150",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                    : "bg-muted/70 text-muted-foreground group-hover:bg-muted group-hover:text-foreground"
                )}
              >
                <Icon className="size-4.5" />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="my-4 h-px bg-border/60" aria-hidden />

      <Link
        href="/perfil"
        className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-3 py-3 transition-colors duration-150 hover:border-primary/40"
      >
        {loading || !perfil ? (
          <>
            <div className="size-9 shrink-0 animate-pulse rounded-lg bg-muted" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="h-3 w-3/4 animate-pulse rounded-full bg-muted" />
              <div className="h-1.5 w-full animate-pulse rounded-full bg-muted" />
            </div>
          </>
        ) : (
          <>
            <UserAvatar iniciais={perfil.iniciais} size="sm" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-bold text-foreground">{perfil.nome}</span>
                <span className="flex shrink-0 items-center gap-0.5 text-xs font-semibold text-orange-500">
                  <Flame className="size-3.5" />
                  {perfil.streakAtual}
                </span>
              </div>
              <Progress value={progresso} className="h-1.5" />
            </div>
          </>
        )}
      </Link>
    </aside>
  );
}
