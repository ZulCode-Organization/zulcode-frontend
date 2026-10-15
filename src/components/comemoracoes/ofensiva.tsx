"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { Check } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { ChamaDupla, faixaDaChama, type FaixaDaChama } from "@/components/shared/chama-dupla";
import { estourarConfete } from "@/lib/motion/efeitos";
import { reagir } from "@/lib/reacoes";
import { MARCOS_DA_SEQUENCIA } from "@/lib/sequencia";
import type { OfensivaDoDia } from "@/lib/types/comemoracao";
import { cn } from "@/lib/utils";
import { MolduraDeComemoracao } from "./moldura";
import { BotaoCompartilharOfensiva } from "@/components/shared/botao-compartilhar-ofensiva";

/** A cor de cada faixa da chama, em hexadecimal, para o brilho e as brasas. */
const COR_DA_FAIXA: Record<FaixaDaChama["id"], string> = { azul: "#3b82f6", ciano: "#06b6d4", dourada: "#f59e0b" };

/** Brasas subindo da chama: posição, atraso e para que lado cada uma desvia. */
const BRASAS = [
  { esquerda: "34%", atraso: 0, deriva: -18 },
  { esquerda: "62%", atraso: 260, deriva: 14 },
  { esquerda: "46%", atraso: 520, deriva: -6 },
  { esquerda: "70%", atraso: 780, deriva: 22 },
  { esquerda: "28%", atraso: 1040, deriva: -24 },
  { esquerda: "54%", atraso: 1300, deriva: 8 },
];

/**
 * A ofensiva depois da primeira lição do dia.
 *
 * É a chama da barra de cima, grande: mesma forma e mesma cor da faixa (azul,
 * ciano, dourada), para a pessoa reconhecer que é o mesmo fogo. Ela nasce,
 * salta e fica tremulando; o número rola do valor de ontem para o de hoje, e a
 * semana acende o dia de hoje.
 */
export function ComemoracaoOfensiva({ ofensiva, aoContinuar }: { ofensiva: OfensivaDoDia; aoContinuar: () => void }) {
  const t = useTranslations("comemoracoes.ofensiva");
  const formato = useFormatter();
  const { antes, depois, protegida } = ofensiva;
  const faixa = faixaDaChama(depois);
  const cor = COR_DA_FAIXA[faixa.id];
  const marco = MARCOS_DA_SEQUENCIA.includes(depois);
  const chama = useRef<HTMLSpanElement>(null);

  // Nos marcos (7, 30, 100, 365 dias) a festa é maior: confete saindo da
  // chama e a vinheta de conquista logo depois do salto.
  useEffect(() => {
    if (!marco) return;
    const id = setTimeout(() => {
      if (chama.current) estourarConfete(chama.current, [cor, "#ffffff", "#fde68a"]);
      reagir("conquista");
    }, 900);
    return () => clearTimeout(id);
  }, [marco, cor]);

  const mensagem = protegida
    ? t("protegida")
    : depois === 1
      ? antes > 1 ? t("recomecou") : t("comecou")
      : marco ? t("marco", { n: depois }) : t("normal");

  // A semana de domingo a sábado. Acesos são os dias que a sequência cobre
  // (os últimos `depois` dias, até hoje); o de ontem fica roxo quando foi o gás
  // que o segurou.
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const semana = Array.from({ length: 7 }, (_, i) => {
    const dia = new Date(hoje);
    dia.setDate(hoje.getDate() - hoje.getDay() + i);
    const atras = Math.round((hoje.getTime() - dia.getTime()) / 86_400_000);
    return {
      dia,
      futuro: atras < 0,
      hoje: atras === 0,
      aceso: atras >= 0 && atras < depois,
      protegido: protegida && atras === 1,
    };
  });

  return (
    <MolduraDeComemoracao
      cor={cor}
      momento="ofensiva"
      aoContinuar={aoContinuar}
      peca={
        <span ref={chama} className="relative grid size-44 place-items-center">
          {BRASAS.map((b, i) => (
            <span key={i} aria-hidden className="zc-com-brasa" style={{ left: b.esquerda, "--atraso": `${900 + b.atraso}ms`, "--deriva": `${b.deriva}px` } as CSSProperties} />
          ))}
          <span className="zc-com-nasce">
            <span className="zc-com-tremula block">
              <ChamaDupla dias={depois} className="size-40 drop-shadow-[0_10px_30px_rgba(0,0,0,0.25)]" />
            </span>
          </span>
        </span>
      }
      titulo={
        <>
          <span className={cn("block text-[4.5rem] font-black leading-none tabular-nums", faixa.texto)}>
            <span aria-hidden className="zc-com-rolo">
              <span>
                <span>{antes}</span>
                <span>{depois}</span>
              </span>
            </span>
            <span className="sr-only">{depois}</span>
          </span>
          <span className="mt-2 block text-[1.5rem]">{t("dias", { n: depois })}</span>
        </>
      }
    >
      <div className="zc-com-sobe mt-7 w-full rounded-2xl border border-border bg-card px-4 py-3.5" style={{ "--atraso": "1100ms" } as CSSProperties}>
        <p className="text-left text-[0.7rem] font-black uppercase tracking-[0.1em] text-muted-foreground">{t("semana")}</p>
        <ol className="mt-2.5 grid grid-cols-7 gap-1">
          {semana.map((d) => (
            <li key={d.dia.toISOString()} className="flex flex-col items-center gap-1.5">
              <span className={cn("text-[0.72rem] font-black uppercase", d.hoje ? faixa.texto : "text-muted-foreground")}>
                {formato.dateTime(d.dia, { weekday: "narrow" })}
              </span>
              <span
                className={cn(
                  "grid size-9 place-items-center rounded-full",
                  d.futuro && "border-2 border-dashed border-border",
                  !d.futuro && !d.aceso && "bg-muted",
                  d.aceso && (d.protegido ? "bg-violet-600" : faixa.fundo),
                  d.hoje && "zc-com-hoje",
                )}
              >
                {d.aceso && <Check className="size-4.5 text-white" strokeWidth={3.5} />}
              </span>
            </li>
          ))}
        </ol>
      </div>
      <p className="zc-com-sobe mt-5 max-w-xs text-[0.95rem] leading-snug text-muted-foreground" style={{ "--atraso": "1250ms" } as CSSProperties}>
        {mensagem}
      </p>
      <div className="zc-com-sobe mt-4" style={{ "--atraso": "1350ms" } as CSSProperties}>
        <BotaoCompartilharOfensiva dias={depois} className="bg-muted text-foreground hover:bg-muted/70" />
      </div>
    </MolduraDeComemoracao>
  );
}
