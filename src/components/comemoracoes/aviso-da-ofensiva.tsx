"use client";

import { useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { ChamaDupla } from "@/components/shared/chama-dupla";
import { usePerfil } from "@/hooks/use-perfil";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";
import { MolduraDeComemoracao } from "./moldura";

/**
 * O que aconteceu com a ofensiva enquanto a pessoa estava fora, mostrado uma
 * vez ao abrir o app: o gás de ofensiva que segurou os dias perdidos, ou a
 * ofensiva que apagou. Quem decide é o servidor (src/ofensiva no backend),
 * que acerta a ofensiva ao abrir o app e toda madrugada.
 */
export function AvisoDaOfensiva() {
  const t = useTranslations("comemoracoes.avisoDaOfensiva");
  const { perfil } = usePerfil();
  const [fechado, setFechado] = useState(false);
  const aviso = perfil?.ofensivaAviso;
  if (!aviso || fechado) return null;

  const continuar = () => {
    setFechado(true);
    const token = localStorage.getItem("accessToken");
    if (token) {
      void fetchComTimeout(`${API_BASE_URL}/user/ofensiva/aviso-visto`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null);
    }
  };

  if (aviso.tipo === "perdida") {
    return (
        <MolduraDeComemoracao
          cor="#64748b"
          momento="perdaDePena"
          aoContinuar={continuar}
          peca={
            <span className="zc-com-nasce">
              <ChamaDupla aceso={false} className="size-40 opacity-80" />
            </span>
          }
          titulo={<span className="block text-[2rem] leading-tight">{t("perdida.titulo")}</span>}
        >
          <p className="zc-com-sobe mt-4 max-w-xs text-[1rem] leading-snug text-muted-foreground" style={{ "--atraso": "700ms" } as CSSProperties}>
            {t("perdida.texto", { n: aviso.antes })}
          </p>
          <p className="zc-com-sobe mt-3 max-w-xs text-[0.9rem] font-bold leading-snug text-violet-500" style={{ "--atraso": "900ms" } as CSSProperties}>
            {t("perdida.dica")}
          </p>
        </MolduraDeComemoracao>
    );
  }

  return (
      <MolduraDeComemoracao
        cor="#8b5cf6"
        momento="ofensiva"
        aoContinuar={continuar}
        rotulo={t("gas.titulo")}
        peca={
          <span className="zc-com-nasce">
            <span className="zc-com-tremula block">
              <ChamaDupla dias={aviso.ofensiva} protegido className="size-40 drop-shadow-[0_10px_30px_rgba(0,0,0,0.25)]" />
            </span>
          </span>
        }
        titulo={
          <>
            <span className="block text-[4.5rem] font-black leading-none tabular-nums text-violet-500">{aviso.ofensiva}</span>
            <span className="mt-2 block text-[1.5rem]">{t("dias", { n: aviso.ofensiva })}</span>
          </>
        }
      >
        <p className="zc-com-sobe mt-5 max-w-xs text-[1rem] leading-snug text-muted-foreground" style={{ "--atraso": "900ms" } as CSSProperties}>
          {t("gas.texto", { dias: aviso.dias })}
          {aviso.pro && ` ${t("gas.pro")}`}
        </p>
        <p className="zc-com-sobe mt-3 text-[0.9rem] font-bold text-violet-500" style={{ "--atraso": "1100ms" } as CSSProperties}>
          {t("gas.restantes", { n: aviso.gasesRestantes })}
        </p>
      </MolduraDeComemoracao>
  );
}
