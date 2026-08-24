"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { bottomNavItems, moreNavItems } from "./nav-items";
import { MaisMenu } from "./mais-menu";
import { usePerfil } from "@/hooks/use-perfil";

export function AppBottomNav() {
  const pathname = usePathname();
  const [maisAberto, setMaisAberto] = useState(false);
  const { perfil } = usePerfil();

  // Metas e Líderes só existem dentro do menu "Mais" no celular — sem
  // checar isso aqui, nenhum ícone da barra ficaria "ativo" quando a
  // pessoa estivesse numa dessas duas telas.
  const maisAtivo = moreNavItems.some((item) => item.href === pathname) || (perfil?.role === "ADMIN" && pathname.startsWith("/admin"));

  return (
    <nav className="sticky bottom-0 z-20 flex items-center justify-around border-t border-border bg-background/95 px-2 py-2 backdrop-blur-md lg:hidden">
      {bottomNavItems.map((item) => {
        const Icon = item.icon;
        const active = item.href ? pathname === item.href : false;
        const content = (
          <>
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-[10px] transition-colors duration-150",
                active ? "bg-primary text-primary-foreground" : "bg-transparent"
              )}
            >
              <Icon className="size-5" />
            </span>
            <span className="text-[0.62rem] font-black uppercase tracking-[0.05em]">
              {item.label}
            </span>
          </>
        );

        if (!item.href) {
          return (
            <div
              key={item.id}
              className="flex flex-1 cursor-default flex-col items-center gap-0.5 py-1 text-muted-foreground/40"
            >
              {content}
            </div>
          );
        }

        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-1 transition-colors duration-150",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {content}
          </Link>
        );
      })}

      <button
        type="button"
        onClick={() => setMaisAberto(true)}
        aria-haspopup="dialog"
        aria-expanded={maisAberto}
        className={cn(
          "flex flex-1 flex-col items-center gap-0.5 py-1 transition-colors duration-150",
          maisAtivo ? "text-primary" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-[10px] transition-colors duration-150",
            maisAtivo ? "bg-primary text-primary-foreground" : "bg-transparent"
          )}
        >
          <MoreHorizontal className="size-5" />
        </span>
        <span className="text-[0.62rem] font-black uppercase tracking-[0.05em]">Mais</span>
      </button>

      {maisAberto && <MaisMenu onClose={() => setMaisAberto(false)} />}
    </nav>
  );
}
