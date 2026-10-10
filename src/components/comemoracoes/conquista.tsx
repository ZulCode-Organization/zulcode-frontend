"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { Rupee } from "@/components/shared/rupee";
import { estiloDaConquista } from "@/lib/conquistas-icones";
import type { ConquistaNova } from "@/lib/types/comemoracao";
import { cn } from "@/lib/utils";
import { MolduraDeComemoracao } from "./moldura";

/**
 * Uma conquista recém-desbloqueada.
 *
 * O desenho é o mesmo do perfil (escolhido pelo id da conquista), agora em
 * destaque: raios girando atrás e um brilho que atravessa a peça. É uma versão
 * provisória — os troféus vão ganhar desenho próprio, com o Zul.
 */
export function ComemoracaoConquista({ conquista, aoContinuar }: { conquista: ConquistaNova; aoContinuar: () => void }) {
  const t = useTranslations("comemoracoes.conquista");
  const { Icone, cor, fundo } = estiloDaConquista(conquista.id);

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
          <span className={cn("zc-com-nasce relative grid size-36 place-items-center rounded-[36px] shadow-xl", fundo)}>
            <Icone className={cn("size-16", cor)} strokeWidth={2.2} />
            <span aria-hidden className="zc-com-varre" />
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
