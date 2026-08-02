"use client";

import { useRouter } from "next/navigation";
import { Hammer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ComingSoonProps {
  titulo?: string;
  descricao?: string;
}

export function ComingSoon({
  titulo = "Estamos construindo isso",
  descricao = "Essa área está a caminho. Volte em breve pra continuar por aqui.",
}: ComingSoonProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("isNivelado");
    router.replace("/welcome");
  };

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="flex size-16 animate-fade-in-up items-center justify-center rounded-full bg-primary/10">
        <Hammer className="size-7 text-primary" strokeWidth={1.75} />
      </span>

      <div className="animate-fade-in-up flex flex-col gap-2" style={{ animationDelay: "60ms" }}>
        <h1 className="text-2xl font-extrabold text-foreground">{titulo}</h1>
        <p className="max-w-sm text-sm text-muted-foreground">{descricao}</p>
      </div>

      <Button variant="outline" onClick={handleLogout} className="animate-fade-in-up" style={{ animationDelay: "120ms" }}>
        Sair
      </Button>
    </div>
  );
}
