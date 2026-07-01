"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function WelcomeHero() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const imgSrc = resolvedTheme !== "dark" ? "/icon-only.svg" : "/icon-only-dark.svg";

  return (
    <div className="h-full sm:h-auto flex flex-col gap-3 justify-center items-center">
      {mounted ? (
        <img src={imgSrc} alt="" width="120" height="120" />
      ) : (
        <div style={{ width: 120, height: 120 }} />
      )}
      <div className="flex flex-col gap-4 justify-center items-center">
        <h1 className="text-4xl font-bold text-foreground">ZulCode</h1>
        <p className="text-center text-foreground">Aprenda programação de forma gamificada</p>
      </div>
    </div>
  );
}