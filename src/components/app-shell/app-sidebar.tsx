"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Progress } from "@/components/ui/progress";
import { UserAvatar } from "@/components/shared/user-avatar";
import { DadosUsuario } from "@/lib/types/usuario";
import { cn } from "@/lib/utils";
import { sidebarNavItems } from "./nav-items";

interface AppSidebarProps {
  usuario: DadosUsuario;
}

export function AppSidebar({ usuario }: AppSidebarProps) {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const logo = resolvedTheme !== "dark" ? "/icon-only.svg" : "/icon-only-dark.svg";
  const progresso = Math.min(100, Math.round((usuario.xpAtual / usuario.xpProximoNivel) * 100));

  return (
    <aside className="hidden h-dvh w-64 shrink-0 flex-col border-r border-border/60 bg-card/40 px-4 py-6 lg:flex">
      <Link href="/home" className="flex items-center gap-2 px-2">
        {mounted ? (
          <Image src={logo} alt="" width={32} height={32} className="rounded-lg" />
        ) : (
          <div style={{ width: 32, height: 32 }} />
        )}
        <span className="text-lg font-black tracking-tight text-foreground">ZulCode</span>
      </Link>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {sidebarNavItems.map((item) => {
          const Icon = item.icon;
          const active = item.href ? pathname === item.href : false;

          if (!item.href) {
            return (
              <div
                key={item.id}
                className="flex cursor-default items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground/50"
              >
                <Icon className="size-5" />
                {item.label}
              </div>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors duration-150",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/perfil"
        className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-3 py-3 transition-colors duration-150 hover:border-primary/40"
      >
        <UserAvatar iniciais={usuario.iniciais} size="sm" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-bold text-foreground">{usuario.nome}</span>
            <span className="shrink-0 text-xs font-semibold text-muted-foreground">{usuario.xpTotal} XP</span>
          </div>
          <Progress value={progresso} className="h-1.5" />
        </div>
      </Link>
    </aside>
  );
}
