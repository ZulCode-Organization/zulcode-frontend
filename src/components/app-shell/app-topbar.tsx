"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { User } from "lucide-react";

export function AppTopbar() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const logo = resolvedTheme !== "dark" ? "/icon-only.svg" : "/icon-only-dark.svg";

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-md lg:hidden">
      <Link href="/home" className="flex items-center gap-2">
        {mounted ? (
          <Image src={logo} alt="" width={28} height={28} className="rounded-lg" />
        ) : (
          <div style={{ width: 28, height: 28 }} />
        )}
        <span className="text-base font-black tracking-tight text-foreground">ZulCode</span>
      </Link>

      <Link
        href="/perfil"
        aria-label="Perfil"
        className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors duration-150 hover:text-foreground"
      >
        <User className="size-4.5" />
      </Link>
    </header>
  );
}
