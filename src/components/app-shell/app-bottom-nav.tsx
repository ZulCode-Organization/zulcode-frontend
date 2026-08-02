"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { bottomNavItems } from "./nav-items";

export function AppBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-20 flex items-center justify-around border-t border-border/60 bg-background/95 px-2 py-2 backdrop-blur-md lg:hidden">
      {bottomNavItems.map((item) => {
        const Icon = item.icon;
        const active = item.href ? pathname === item.href : false;
        const content = (
          <>
            <Icon className="size-5" />
            <span className="text-[0.65rem] font-bold uppercase tracking-wide">{item.label}</span>
          </>
        );

        if (!item.href) {
          return (
            <div
              key={item.id}
              className="flex flex-1 cursor-default flex-col items-center gap-1 py-1 text-muted-foreground/40"
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
              "flex flex-1 flex-col items-center gap-1 py-1 transition-colors duration-150",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
