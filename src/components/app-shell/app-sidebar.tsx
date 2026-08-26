"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { ChevronDown, FolderPlus, LogOut } from "lucide-react";
import { usePerfil } from "@/hooks/use-perfil";
import { cn } from "@/lib/utils";
import { adminEntry, adminNavItems, sidebarNavItems } from "./nav-items";

export function AppSidebar() {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const { perfil } = usePerfil();
  const [mounted, setMounted] = useState(false);
  const [cadastrosAberto, setCadastrosAberto] = useState(true);

  useEffect(() => setMounted(true), []);

  const logo = resolvedTheme !== "dark" ? "/icon-only.svg" : "/icon-only-dark.svg";
  const isAdminArea = pathname.startsWith("/admin");
  const navItems = perfil?.role === "ADMIN" ? [...sidebarNavItems, adminEntry] : sidebarNavItems;

  const renderNavLink = (item: (typeof sidebarNavItems)[number], nested = false) => {
    const Icon = item.icon;
    const active = pathname === item.href;
    const className = cn(
      "group flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-black uppercase tracking-[0.05em] transition-colors duration-150",
      nested && "ml-5 rounded-xl py-2.5 text-[0.78rem]",
      active
        ? "border-primary/30 bg-primary/10 text-primary"
        : "border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"
    );
    if (item.external) return (
      <a key={item.id} href={item.href} className={className}>
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-[10px] transition-colors duration-150", nested && "size-8 rounded-lg", "bg-muted text-muted-foreground group-hover:text-foreground")}><Icon className={nested ? "size-4" : "size-5"} /></span>
        {item.label}
      </a>
    );
    return (
      <Link
        key={item.id}
        href={item.href!}
        aria-current={active ? "page" : undefined}
        className={className}
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
      <div className="sticky top-0 z-10 -mx-5 flex items-center justify-between bg-card px-6 pb-2 pt-1">
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

    </aside>
  );
}
