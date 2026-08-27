"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Flame, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const DIAS_DA_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function chaveDoDia(data: Date) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
}

interface OfensivaProps {
  streakAtual: number | null;
  streakRecorde: number | null;
  protecoes: number;
  diasProtegidos: string[];
  onNavegar?: () => void;
}

/**
 * O backend informa os dias que foram protegidos; eles aparecem em azul.
 * Os demais dias da sequência continuam sendo inferidos a partir do total.
 */
export function PainelOfensiva({ streakAtual, streakRecorde, protecoes, diasProtegidos, onNavegar }: OfensivaProps) {
  const sequencia = streakAtual ?? 0;
  const hoje = useMemo(() => {
    const data = new Date();
    data.setHours(0, 0, 0, 0);
    return data;
  }, []);
  const [mesVisivel, setMesVisivel] = useState(() => new Date(hoje.getFullYear(), hoje.getMonth(), 1));

  const diasAcesos = useMemo(() => {
    const dias = new Set<string>();
    for (let voltar = 0; voltar < sequencia; voltar += 1) {
      const data = new Date(hoje);
      data.setDate(hoje.getDate() - voltar);
      dias.add(chaveDoDia(data));
    }
    return dias;
  }, [sequencia, hoje]);
  const diasComProtecao = useMemo(() => new Set(diasProtegidos), [diasProtegidos]);

  const ano = mesVisivel.getFullYear();
  const mes = mesVisivel.getMonth();
  const primeiraColuna = new Date(ano, mes, 1).getDay();
  const totalDeDias = new Date(ano, mes + 1, 0).getDate();
  const celulas = [...Array(primeiraColuna).fill(null), ...Array.from({ length: totalDeDias }, (_, i) => i + 1)];

  const mudarMes = (passo: number) => setMesVisivel(new Date(ano, mes + passo, 1));
  const aceso = (dia: number) => diasAcesos.has(chaveDoDia(new Date(ano, mes, dia)));

  return (
    <div className="mx-auto w-full max-w-md pb-2">
      {/* Cabeçalho: o número grande com a chama atrás, como na referência. */}
      <div className="relative overflow-hidden rounded-[20px] border border-border bg-card px-5 py-6">
        <Flame
          className={cn("pointer-events-none absolute -right-3 top-1/2 size-32 -translate-y-1/2", sequencia > 0 ? "text-orange-500/15" : "text-muted-foreground/10")}
          fill="currentColor"
          aria-hidden
        />
        <p className={cn("relative text-6xl font-black leading-none", sequencia > 0 ? "text-orange-500" : "text-muted-foreground/50")}>
          {sequencia}
        </p>
        <p className={cn("relative mt-1 text-lg font-black", sequencia > 0 ? "text-foreground" : "text-muted-foreground")}>
          {sequencia === 1 ? "dia de ofensiva!" : "dias de ofensiva!"}
        </p>
        {(streakRecorde ?? 0) > 0 && (
          <p className="relative mt-1 text-[0.8rem] font-bold text-muted-foreground">
            Seu recorde é de {streakRecorde} {streakRecorde === 1 ? "dia" : "dias"}.
          </p>
        )}
      </div>

      {/* Proteções de sequência: o item existe na loja (FREEZE_STREAK), então o
          card leva pra lá em vez de prometer algo que não dá pra fazer aqui. */}
      <div className="mt-3 flex items-center gap-3 rounded-[20px] border border-border bg-card px-4 py-4">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-2xl",
            protecoes > 0 ? "bg-sky-500/15 text-sky-500" : "bg-muted text-muted-foreground"
          )}
        >
          <ShieldCheck className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.9rem] font-black leading-snug">
            {protecoes > 0
              ? `Você tem ${protecoes} ${protecoes === 1 ? "proteção" : "proteções"} de ofensiva`
              : "Você está sem proteção de ofensiva!"}
          </p>
          <Link
            href="/loja"
            onClick={onNavegar}
            className="mt-0.5 inline-block text-[0.78rem] font-black uppercase tracking-[0.06em] text-primary"
          >
            Obter mais
          </Link>
        </div>
      </div>

      {/* Calendário */}
      <div className="mt-3 rounded-[20px] border border-border bg-card px-3 py-4">
        <div className="mb-3 flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => mudarMes(-1)}
            aria-label="Mês anterior"
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-muted"
          >
            <ChevronLeft className="size-5" strokeWidth={2.6} />
          </button>
          <p className="text-[0.9rem] font-black">
            {MESES[mes]} de {ano}
          </p>
          <button
            type="button"
            onClick={() => mudarMes(1)}
            aria-label="Próximo mês"
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-muted"
          >
            <ChevronRight className="size-5" strokeWidth={2.6} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {DIAS_DA_SEMANA.map((dia) => (
            <span key={dia} className="pb-1 text-center text-[0.68rem] font-black uppercase tracking-[0.04em] text-muted-foreground">
              {dia}
            </span>
          ))}

          {celulas.map((dia, indice) => {
            if (dia === null) return <span key={`vazio-${indice}`} />;

            const coluna = indice % 7;
            const marcado = aceso(dia);
            const chave = chaveDoDia(new Date(ano, mes, dia));
            const protegido = diasComProtecao.has(chave);
            const ehHoje = chave === chaveDoDia(hoje);
            // A trilha contínua liga dias acesos seguidos dentro da mesma
            // semana, do jeito que a referência mostra.
            const ligaAntes = marcado && coluna > 0 && aceso(dia - 1);
            const ligaDepois = marcado && coluna < 6 && dia < totalDeDias && aceso(dia + 1);

            return (
              <span key={dia} className="relative flex h-10 items-center justify-center">
                {marcado && (ligaAntes || ligaDepois) && (
                  <span
                    className={cn(
                      "absolute inset-y-1.5 bg-orange-500/15",
                      ligaAntes ? "left-0" : "left-1/2",
                      ligaDepois ? "right-0" : "right-1/2"
                    )}
                    aria-hidden
                  />
                )}
                <span
                  className={cn(
                    "relative flex size-8 items-center justify-center rounded-full text-[0.82rem] font-black",
                    protegido ? "bg-sky-500 text-white" : marcado ? "bg-orange-500 text-white" : "text-muted-foreground",
                    ehHoje && !marcado && "ring-2 ring-inset ring-primary text-primary",
                    ehHoje && marcado && "ring-2 ring-offset-2 ring-orange-500 ring-offset-card"
                  )}
                >
                  {dia}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
