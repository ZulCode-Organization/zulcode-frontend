"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { SeloConquista } from "@/components/shared/selo-conquista";
import { fraseDaConquista } from "@/lib/frase-da-conquista";
import { PerfilUsuario } from "@/lib/types/perfil";

type Conquista = NonNullable<PerfilUsuario["conquistas"]>[number];

/**
 * A conquista em tela cheia, como no Duolingo: o selo grande, o dia em que foi
 * desbloqueada e a frase com o nome de quem conquistou. Abre ao tocar num selo
 * do perfil (o meu ou o de outra pessoa) e fecha no X ou no Esc.
 */
export function DetalheDaConquista({ conquista, nome, aoFechar }: { conquista: Conquista; nome: string; aoFechar: () => void }) {
  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") aoFechar();
    };
    document.addEventListener("keydown", aoTeclar);
    // A página de trás não rola enquanto a conquista está aberta.
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = antes;
    };
  }, [aoFechar]);

  const data = new Date(conquista.unlockedAt);
  const quando = Number.isNaN(data.getTime()) ? null : data.toLocaleDateString("pt-BR");

  return createPortal(
    <div role="dialog" aria-modal aria-label={conquista.title} className="animate-fade-in fixed inset-0 z-[70] flex flex-col bg-background">
      <div className="px-4 pt-[calc(1rem+env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={aoFechar}
          aria-label="Fechar"
          className="grid size-10 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-7" strokeWidth={2.6} />
        </button>
      </div>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-6 pb-[calc(3rem+env(safe-area-inset-bottom))] text-center">
        <SeloConquista id={conquista.id} className="animate-fade-in-up w-[min(62vw,240px)]" />
        {quando && (
          <span className="rounded-lg bg-muted px-3 py-1.5 text-sm font-black text-amber-500">{quando}</span>
        )}
        <p className="text-[1.35rem] font-black leading-snug text-foreground">{fraseDaConquista(conquista.id, conquista.title, nome)}</p>
        <p className="-mt-3 text-sm font-bold text-muted-foreground">{conquista.title}</p>
      </div>
    </div>,
    document.body
  );
}
