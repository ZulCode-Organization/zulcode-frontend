"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { Rupee } from "@/components/shared/rupee";
import { SeloConquista } from "@/components/shared/selo-conquista";
import type { ConquistaNova } from "@/lib/types/comemoracao";
import { MolduraDeComemoracao } from "./moldura";

/**
 * Uma conquista recém-desbloqueada.
 *
 * O selo é o mesmo do perfil (a arte do Zul e a cor da família da conquista),
 * agora em destaque, com os raios girando atrás.
 */
export function ComemoracaoConquista({ conquista, aoContinuar }: { conquista: ConquistaNova; aoContinuar: () => void }) {
  const t = useTranslations("comemoracoes.conquista");

  return (
    <MolduraDeComemoracao
      cor="#f59e0b"
      momento="conquista"
      aoContinuar={aoContinuar}
      rotulo={t("rotulo")}
      titulo={conquista.title}
      peca={
        <span className="relative grid size-44 place-items-center">
          <span aria-hidden className="zc-com-raios" />
          <span className="zc-com-nasce relative">
            <SeloConquista id={conquista.id} className="w-44" />
          </span>
        </span>
      }
    >
      <p className="zc-com-sobe mt-3 max-w-xs text-[0.95rem] leading-snug text-muted-foreground" style={{ "--atraso": "1100ms" } as CSSProperties}>
        {conquista.description}
      </p>
      {conquista.coins > 0 && (
        <p className="zc-com-sobe mt-5 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/12 px-3.5 py-1.5 text-[0.9rem] font-black text-emerald-600 dark:text-emerald-400" style={{ "--atraso": "1250ms" } as CSSProperties}>
          <Rupee className="size-4.5" />
          {t("recompensa", { n: conquista.coins })}
        </p>
      )}
    </MolduraDeComemoracao>
  );
}
