"use client";

import { Coins, Zap } from "lucide-react";
import { usePerfil } from "@/hooks/use-perfil";

/**
 * Barra de status fixa no topo do conteúdo (formato do redesign: chips de 38px
 * alinhados à direita). O chip de XP mostra um número que o backend realmente
 * devolve em GET /user. O de moedas é só o ícone, sem valor: moedas ainda não
 * existem do lado do servidor e um número ali seria saldo inventado pro
 * usuário — a sequência (streak) já mudou pro rodapé da sidebar.
 */
export function AppTopBar() {
  const { perfil, loading } = usePerfil();

  const chip =
    "flex h-11 items-center gap-2 rounded-2xl border border-border bg-card px-4 text-[0.95rem] font-extrabold";

  return (
    <div className="sticky top-0 z-20 flex items-center justify-end gap-3 bg-background px-4 pb-3 pt-4 lg:px-8">
      <span className={`${chip} text-sky-500`}>
        <Zap className="size-5" />
        {loading || !perfil ? "…" : perfil.xp.toLocaleString("pt-BR")}
      </span>

      <span className={`${chip} text-yellow-500`}>
        <Coins className="size-5" />
      </span>
    </div>
  );
}
