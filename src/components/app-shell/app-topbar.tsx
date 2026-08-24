"use client";

import { Coins, Feather, Flame, Zap } from "lucide-react";
import { usePerfil } from "@/hooks/use-perfil";

/**
 * Barra de status fixa no topo do conteúdo (formato do redesign: chips de
 * 44px alinhados à direita).
 *
 * Cada chip só mostra número quando a API devolve o campo de verdade. O XP
 * já vem do GET /user; vidas (as penas) e moedas ainda não existem no
 * backend, então esses dois aparecem só com o ícone — um número ali seria
 * saldo inventado. Assim que os campos entrarem na resposta, o valor aparece
 * sozinho, sem mexer aqui.
 */
export function AppTopBar() {
  const { perfil, loading } = usePerfil();

  const chip =
    "flex h-11 items-center gap-2 rounded-2xl border border-border bg-card px-4 text-[0.95rem] font-extrabold";

  const valor = (numero: number | null | undefined) => {
    if (loading || !perfil) return "…";
    return typeof numero === "number" ? numero.toLocaleString("pt-BR") : null;
  };

  return (
    <div className="sticky top-0 z-20 flex items-center justify-end gap-3 bg-background px-4 pb-3 pt-4 lg:px-8">
      <span className={`${chip} text-sky-500`} title="XP acumulado">
        <Zap className="size-5" />
        {valor(perfil?.xp)}
      </span>

      {/* Pena no lugar do coração: a marca é uma ave, então a vida do app é
          uma pena dela. */}
      <span className={`${chip} text-rose-500`} title="Vidas">
        <Feather className="size-5" />
        {valor(perfil?.vidas)}
      </span>

      <span className={`${chip} text-yellow-500`} title="Moedas">
        <Coins className="size-5" />
        {valor(perfil?.moedas)}
      </span>

      <span className={`${chip} text-orange-500`} title="Dias seguidos">
        <Flame className="size-5 fill-current" />
        {valor(perfil?.streakAtual)}
      </span>
    </div>
  );
}
