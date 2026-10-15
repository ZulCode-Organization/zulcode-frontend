"use client";

import { useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { Barrel, Feather, ShieldCheck, Zap } from "lucide-react";
import { GasOfensiva } from "@/components/shared/gas-ofensiva";
import { Rupee } from "@/components/shared/rupee";
import { COR_DA_RARIDADE, abrirBarril, type Barril, type ConteudoDoBarril, type ItemDoBarril } from "@/lib/barril";
import { MolduraDeComemoracao } from "./moldura";

function IconeDoItem({ item, className }: { item: ItemDoBarril; className?: string }) {
  if (item === "pena") return <Feather className={className} />;
  if (item === "gas") return <GasOfensiva className={className} />;
  if (item === "escudo") return <ShieldCheck className={className} />;
  return <Zap className={className} />;
}

/**
 * Um barril surpresa: primeiro fechado (a pessoa toca em "Abrir"), depois o
 * que saiu dele. O desenho é provisório — o barril pirata ganha arte própria.
 */
export function ComemoracaoBarril({ barril, aoContinuar }: { barril: Barril; aoContinuar: () => void }) {
  const t = useTranslations("comemoracoes.barril");
  const [conteudo, setConteudo] = useState<ConteudoDoBarril | null>(null);
  const [abrindo, setAbrindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const cor = COR_DA_RARIDADE[barril.raridade];
  const marco = /^ofensiva-(\d+)$/.exec(barril.origem)?.[1];

  const abrir = async () => {
    if (conteudo) return aoContinuar();
    if (abrindo) return;
    setAbrindo(true);
    setErro(null);
    try {
      setConteudo((await abrirBarril(barril.id)).conteudo);
    } catch (e) {
      setErro(e instanceof Error ? e.message : t("erro"));
    } finally {
      setAbrindo(false);
    }
  };

  return (
    <MolduraDeComemoracao
      key={conteudo ? "aberto" : "fechado"}
      cor={cor}
      momento={conteudo ? "rupees" : "conquista"}
      aoContinuar={() => void abrir()}
      textoDoBotao={conteudo ? undefined : abrindo ? t("abrindo") : t("abrir")}
      rotulo={t(`raridade.${barril.raridade}`)}
      titulo={conteudo ? t("abriu") : marco ? t("marco", { n: Number(marco) }) : t("titulo")}
      peca={
        <span className="relative grid size-44 place-items-center">
          <span aria-hidden className="zc-com-raios" />
          <span
            className="zc-com-nasce relative grid size-36 place-items-center rounded-[36px] bg-amber-900/15 shadow-xl ring-4"
            style={{ ["--tw-ring-color" as string]: cor }}
          >
            <Barrel className="size-20 text-amber-700 dark:text-amber-500" strokeWidth={2} />
            <span aria-hidden className="zc-com-varre" />
          </span>
        </span>
      }
    >
      {conteudo ? (
        <ul className="zc-com-sobe mt-5 flex flex-wrap justify-center gap-2" style={{ "--atraso": "1100ms" } as CSSProperties}>
          {conteudo.rupees > 0 && (
            <li className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/12 px-3.5 py-1.5 text-[0.9rem] font-black text-emerald-600 dark:text-emerald-400">
              <Rupee className="size-4.5" />+{conteudo.rupees}
            </li>
          )}
          {conteudo.itens.map(({ item, quantidade }) => (
            <li key={item} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3.5 py-1.5 text-[0.9rem] font-black">
              <IconeDoItem item={item} className="size-4.5" />
              {t(`itens.${item}`, { n: quantidade, min: quantidade * 15 })}
            </li>
          ))}
        </ul>
      ) : (
        <p className="zc-com-sobe mt-3 max-w-xs text-[0.95rem] leading-snug text-muted-foreground" style={{ "--atraso": "1100ms" } as CSSProperties}>
          {erro ?? t("convite")}
        </p>
      )}
    </MolduraDeComemoracao>
  );
}
