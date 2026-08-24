"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { ChevronDown, Flame, FolderPlus, LogOut } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { PerfilUsuario } from "@/lib/types/perfil";
import { cn } from "@/lib/utils";
import { adminEntry, adminNavItems, sidebarNavItems } from "./nav-items";

interface AppSidebarProps {
  perfil: PerfilUsuario | null;
  loading: boolean;
}

export function AppSidebar({ perfil, loading }: AppSidebarProps) {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [cadastrosAberto, setCadastrosAberto] = useState(true);

  useEffect(() => setMounted(true), []);

  const logo = resolvedTheme !== "dark" ? "/icon-only.svg" : "/icon-only-dark.svg";
  const progresso =
    perfil && perfil.xpNecessarioNivel !== null
      ? Math.round((perfil.xpNivelAtual / perfil.xpNecessarioNivel) * 100)
      : perfil
        ? 100 // nível máximo
        : 0;
  const isAdminArea = pathname.startsWith("/admin");
  const navItems = perfil?.role === "ADMIN" ? [...sidebarNavItems, adminEntry] : sidebarNavItems;

  const renderNavLink = (item: (typeof sidebarNavItems)[number], nested = false) => {
    const Icon = item.icon;
    const active = pathname === item.href;
    return (
      <Link
        key={item.id}
        href={item.href!}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-black uppercase tracking-[0.05em] transition-colors duration-150",
          nested && "ml-5 rounded-xl py-2.5 text-[0.78rem]",
          active
            ? "border-primary/30 bg-primary/10 text-primary"
            : "border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        )}
      >
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-[10px] transition-colors duration-150", nested && "size-8 rounded-lg", active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-foreground")}>
          <Icon className={nested ? "size-4" : "size-5"} />
        </span>
        {item.label}
      </Link>
    );
  };

  return (
    <aside className="zc-scroll-hidden hidden h-dvh w-[288px] shrink-0 flex-col overflow-y-auto border-r border-border bg-card px-5 py-7 lg:flex">
      <div className="flex items-center justify-between px-1 pb-2">
        <Link href="/home" className="flex items-center gap-2.5">
          {mounted ? <Image src={logo} alt="" width={40} height={40} className="rounded-xl" /> : <div style={{ width: 40, height: 40 }} />}
          <span className="text-xl font-black tracking-tight text-foreground">ZulCode</span>
        </Link>
        {isAdminArea && <Link href="/home" title="Sair do administrativo" aria-label="Sair do administrativo" className="flex size-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><LogOut className="size-5" /></Link>}
      </div>

      <nav className="mt-6 flex flex-col gap-1">
        {isAdminArea ? <>
          {renderNavLink(adminNavItems[0])}
          <button
            type="button"
            onClick={() => setCadastrosAberto((aberto) => !aberto)}
            className="group mt-1 flex w-full items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-left text-sm font-black uppercase tracking-[0.05em] text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            <span className="flex size-9 items-center justify-center rounded-[10px] bg-muted text-muted-foreground group-hover:text-foreground"><FolderPlus className="size-5" /></span>
            <span className="flex-1">Cadastros</span><ChevronDown className={cn("size-4 transition-transform", cadastrosAberto && "rotate-180")} />
          </button>
          {cadastrosAberto && adminNavItems.slice(1, 3).map((item) => renderNavLink(item, true))}
          {adminNavItems.slice(3).map((item) => renderNavLink(item))}
        </> : navItems.map((item) => renderNavLink(item))}
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
