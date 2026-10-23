"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/**
 * O topo das telas que saem do perfil ("Cursos de X", "Amigos de X", "5
 * seguidores em comum"): a seta de voltar e o título no meio, como no Duolingo.
 * A seta volta para a tela de antes; aberta direto pelo link, vai para o perfil.
 */
export function CabecalhoDaSubtela({ titulo, voltarPara }: { titulo: string; voltarPara: string }) {
  const router = useRouter();
  const voltar = () => {
    if (window.history.length > 1) router.back();
    else router.push(voltarPara);
  };

  return (
    <div className="relative mb-4 flex min-h-11 items-center justify-center border-b border-border pb-3">
      <button
        type="button"
        onClick={voltar}
        aria-label="Voltar"
        className="absolute left-0 grid size-10 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ArrowLeft className="size-6" strokeWidth={2.6} />
      </button>
      <h1 className="max-w-[calc(100%-6rem)] truncate text-center text-[1.05rem] font-black text-foreground">{titulo}</h1>
    </div>
  );
}
