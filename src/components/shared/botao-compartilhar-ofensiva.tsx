"use client";

import { useState } from "react";
import { Loader2, Share2 } from "lucide-react";
import { usePerfil } from "@/hooks/use-perfil";
import { compartilharOfensiva } from "@/lib/compartilhar-ofensiva";
import { cn } from "@/lib/utils";

/** Gera a imagem da ofensiva e abre o compartilhar (ou baixa, no navegador sem ele). */
export function BotaoCompartilharOfensiva({ dias, className }: { dias: number; className?: string }) {
  const { perfil } = usePerfil();
  const [ocupado, setOcupado] = useState(false);
  if (dias <= 0) return null;

  const compartilhar = async () => {
    setOcupado(true);
    try {
      await compartilharOfensiva({ dias, nome: perfil?.nome ?? "", perfeita: (perfil?.ofensivaPerfeita ?? 0) >= 7 });
    } catch {
      // Quem fecha o compartilhar sem escolher nada não precisa de aviso.
    } finally {
      setOcupado(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void compartilhar()}
      disabled={ocupado}
      aria-label="Compartilhar a ofensiva"
      className={cn("grid size-10 place-items-center rounded-xl bg-white/20 text-white transition-colors hover:bg-white/30 disabled:opacity-60", className)}
    >
      {ocupado ? <Loader2 className="size-5 animate-spin" /> : <Share2 className="size-5" />}
    </button>
  );
}
