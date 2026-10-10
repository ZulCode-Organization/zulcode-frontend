"use client";

import type { CSSProperties } from "react";
import { Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { DIVISOES } from "@/lib/divisoes";
import { cn } from "@/lib/utils";
import { MolduraDeComemoracao } from "./moldura";

/**
 * A divisão nova. O escudo é o mesmo do perfil e da tabela de líderes, cheio
 * na cor da divisão, com os raios atrás.
 */
export function ComemoracaoDivisao({ divisaoId, aoContinuar }: { divisaoId: string; aoContinuar: () => void }) {
  const t = useTranslations("comemoracoes.divisao");
  const nomes = useTranslations("divisoes");
  const divisao = DIVISOES.find((d) => d.id === divisaoId) ?? DIVISOES[0];
  const nome = nomes(divisao.id as Parameters<typeof nomes>[0]);

  return (
    <MolduraDeComemoracao
      cor={divisao.hex}
      momento="nivel"
      aoContinuar={aoContinuar}
      rotulo={t("rotulo")}
      titulo={t("titulo", { nome })}
      peca={
        <span className="relative grid size-44 place-items-center">
          <span aria-hidden className="zc-com-raios" />
          <Shield className={cn("zc-com-nasce relative size-36 drop-shadow-[0_10px_30px_rgba(0,0,0,0.25)]", divisao.preenchimento, divisao.contorno)} strokeWidth={1.8} />
        </span>
      }
    >
      <p className="zc-com-sobe mt-3 max-w-xs text-[0.95rem] leading-snug text-muted-foreground" style={{ "--atraso": "1100ms" } as CSSProperties}>
        {t("texto")}
      </p>
    </MolduraDeComemoracao>
  );
}
