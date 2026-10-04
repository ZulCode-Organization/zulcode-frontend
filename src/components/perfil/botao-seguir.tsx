"use client";

import { Check, UserPlus } from "lucide-react";
import { useSeguir } from "@/hooks/use-seguir";
import { cn } from "@/lib/utils";

/**
 * Seguir / Seguindo.
 *
 * O rótulo vira na hora do toque, antes da resposta do servidor — quem segue
 * alguém num carrossel costuma seguir vários seguidos, e esperar a rede a cada
 * um faz o toque parecer perdido. Se a chamada falhar, o estado volta sozinho
 * (quem cuida disso é o useSeguir).
 *
 * Enquanto a chamada está no ar o botão fica desabilitado, mas com o texto já
 * trocado: é o clique repetido que atrapalha, não a leitura.
 */
export function BotaoSeguir({
  id,
  className,
  larguraCheia = false,
}: {
  id: string;
  className?: string;
  larguraCheia?: boolean;
}) {
  const { sigo, ocupado, alternar } = useSeguir();
  const seguindo = sigo(id);
  const noAr = ocupado(id);

  return (
    <button
      type="button"
      onClick={() => alternar(id)}
      disabled={noAr}
      aria-pressed={seguindo}
      className={cn(
        "zc-press zc-press-shadow flex items-center justify-center gap-1.5 rounded-[14px] px-4 py-3 text-[0.78rem] font-black uppercase tracking-[0.06em] transition-colors duration-150",
        larguraCheia && "w-full",
        seguindo
          ? "border border-border bg-card text-muted-foreground"
          : "bg-primary text-primary-foreground",
        noAr && "opacity-70",
        className
      )}
      style={{ ["--zc-press-color" as string]: seguindo ? "rgba(0,0,0,0.14)" : "rgba(0,0,0,0.32)" }}
    >
      {seguindo ? <Check className="size-4" strokeWidth={3} /> : <UserPlus className="size-4" strokeWidth={2.6} />}
      {seguindo ? "Seguindo" : "Seguir"}
    </button>
  );
}
