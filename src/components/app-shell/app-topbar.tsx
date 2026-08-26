"use client";

import { Coins, Feather, Flame, ShieldCheck, Zap } from "lucide-react";
import { useEffect, useState } from "react";
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
  const [agora, setAgora] = useState(Date.now());
  useEffect(() => { const id = window.setInterval(() => setAgora(Date.now()), 1000); return () => window.clearInterval(id); }, []);

  const chip =
      "flex h-10 min-w-0 items-center justify-center gap-1 rounded-2xl border border-border bg-card px-1 text-[0.8rem] font-extrabold sm:h-11 sm:w-auto sm:gap-2 sm:px-4 sm:text-[0.95rem]";

  const valor = (numero: number | null | undefined) => {
    if (loading || !perfil) return "…";
    return typeof numero === "number" ? numero.toLocaleString("pt-BR") : null;
  };

  return (
    <div className="sticky top-0 z-20 grid grid-cols-4 gap-1 bg-background px-3 pb-3 pt-3 sm:flex sm:items-center sm:justify-end sm:gap-3 sm:px-4 sm:pt-4 lg:px-8">
      <span className={`${chip} text-sky-500`} title="XP acumulado">
        <Zap className="size-5" />
        {valor(perfil?.xp)}
        {perfil?.doubleXpUntil && new Date(perfil.doubleXpUntil).getTime() > agora && <b className="rounded-md bg-sky-500/15 px-1 text-xs">x2 · {Math.ceil((new Date(perfil.doubleXpUntil).getTime() - agora) / 60000)}m</b>}
      </span>

      {/* Pena no lugar do coração: a marca é uma ave, então a vida do app é
          uma pena dela. */}
      <span className={`${chip} text-rose-500`} title="Vidas">
        <Feather className="size-5" />
        {perfil?.isPro ? "∞" : valor(perfil?.vidas)}
      </span>

      <span className={`${chip} text-yellow-500`} title="Moedas">
        <Coins className="size-5" />
        {valor(perfil?.moedas)}
      </span>

      <span className={`${chip} text-orange-500`} title="Dias seguidos">
        <Flame className="size-5 fill-current" />
        {valor(perfil?.streakAtual)}
        {(perfil?.streakFreezes ?? 0) > 0 && <span className="flex items-center gap-0.5 text-sky-500" title="Proteções de sequência"><ShieldCheck className="size-4" />{perfil?.streakFreezes}</span>}
      </span>
    </div>
  );
}
