"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";

export function AuthLogo() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const logo = resolvedTheme !== "dark" ? "/icon-only.svg" : "/icon-only-dark.svg";

  return (
    <Link
      href="/welcome"
      className="absolute left-6 top-6 z-10 flex items-center gap-2 lg:left-10 lg:top-10"
    >
      {mounted ? (
        <Image src={logo} alt="" width={32} height={32} className="rounded-lg" />
      ) : (
        <div style={{ width: 32, height: 32 }} />
      )}
      <span className="text-lg font-black tracking-tight text-foreground">ZulCode</span>
    </Link>
  );
}
