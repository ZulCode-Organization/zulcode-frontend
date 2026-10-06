"use client";
import Image from "next/image";
import { useMontado } from "@/hooks/use-montado";
import { useTheme } from "next-themes";

export default function WelcomeHero() {
  const { resolvedTheme } = useTheme();
  const mounted = useMontado();

  const imgSrc = resolvedTheme !== "dark" ? "/icon-only.svg" : "/icon-only-dark.svg";

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 sm:h-auto">
      <div className="animate-pop-in relative flex items-center justify-center">
        {mounted ? (
          <Image src={imgSrc} alt="" width={120} height={120} />
        ) : (
          <div style={{ width: 120, height: 120 }} />
        )}
      </div>
      <div className="animate-fade-in-up flex flex-col items-center justify-center gap-3" style={{ animationDelay: "80ms" }}>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">ZulCode</h1>
        <p className="text-center text-muted-foreground">Aprenda programação de forma gamificada</p>
      </div>
    </div>
  );
}