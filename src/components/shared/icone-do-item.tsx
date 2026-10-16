import { cn } from "@/lib/utils";
import { PenaDaBarra } from "@/components/app-shell/barra-viva/tema";
import { GasOfensiva } from "./gas-ofensiva";
import { DuoCurar, DuoEscudo, DuoFimDeSemana, DuoXp } from "./icone-duo";
import { Rupee } from "./rupee";

export type EfeitoDoItem =
  | "RECOVER_LIVES" | "FREEZE_STREAK" | "DOUBLE_XP" | "FEATHER_SHIELD"
  | "DOUBLE_COINS" | "HEAL_ONE_LIFE" | "WEEKEND_FREE";

/** A cor de cada item (o desenho e o círculo em volta). As classes são literais para o Tailwind gerar. */
export const COR_DO_ITEM: Record<EfeitoDoItem, { cor: string; fundo: string }> = {
  RECOVER_LIVES: { cor: "text-violet-500", fundo: "bg-violet-500/15" },
  HEAL_ONE_LIFE: { cor: "text-rose-400", fundo: "bg-rose-500/15" },
  FEATHER_SHIELD: { cor: "text-sky-500", fundo: "bg-sky-500/15" },
  FREEZE_STREAK: { cor: "text-violet-500", fundo: "bg-violet-500/15" },
  WEEKEND_FREE: { cor: "text-teal-500", fundo: "bg-teal-500/15" },
  DOUBLE_XP: { cor: "text-amber-500", fundo: "bg-amber-400/15" },
  DOUBLE_COINS: { cor: "text-emerald-500", fundo: "bg-emerald-500/15" },
};

/**
 * O ícone de um item da loja, igual em toda tela que mostra o item (a loja, os
 * painéis da barra e o administrativo).
 *
 * São os de duas camadas da Solar, como os do perfil: corpo translúcido e o
 * detalhe cheio, em `currentColor`. A pena é a mesma da barra de cima, e o
 * rupee é o do app; os dois trazem as próprias cores.
 */
export function IconeDoItem({ efeito, className }: { efeito: EfeitoDoItem; className?: string }) {
  switch (efeito) {
    case "RECOVER_LIVES":
      return <PenaDaBarra tema="normal" className={className} />;
    case "HEAL_ONE_LIFE":
      return <DuoCurar className={className} />;
    case "FEATHER_SHIELD":
      return <DuoEscudo className={className} />;
    case "FREEZE_STREAK":
      return <GasOfensiva className={className} />;
    case "WEEKEND_FREE":
      return <DuoFimDeSemana className={className} />;
    case "DOUBLE_COINS":
      return <Rupee className={cn("text-emerald-500", className)} />;
    default:
      return <DuoXp className={className} />;
  }
}
