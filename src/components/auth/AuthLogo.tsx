"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";

export function AuthLogo() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const logo = resolvedTheme !== "dark" ? "/icon-only.svg" : "/icon-only-dark.svg";

  return (
    <div className="flex flex-col items-center mb-10 gap-3">
      <div className="w-16 h-16 relative flex items-center justify-center">
        {mounted ? (
          <Image src={logo} alt="Logo" width={64} height={64} className="object-contain rounded-2xl" />
        ) : (
          <div style={{ width: 64, height: 64 }} />
        )}
      </div>
      <h1 className="text-2xl font-black tracking-tight">ZulCode</h1>
      <p className="text-gray-500 text-sm text-center">Aprenda programação de forma gamificada</p>
    </div>
  );
}