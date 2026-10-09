"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { dia, numero } from "@/lib/admin/formato";
import type { Calendario } from "@/lib/admin/tipos";

const DIA = 86_400_000;
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

/** Os degraus de cor pelos minutos estudados no dia. Zero é a cor da grade: "nada" não pode parecer "pouco". */
function degrau(minutos: number) {
  if (!minutos) return 0;
  if (minutos <= 5) return 2;
  if (minutos <= 10) return 3;
  if (minutos <= 20) return 4;
  if (minutos <= 40) return 5;
  return 6;
}

/**
 * O calendário de estudo do último ano, estilo GitHub: uma coluna por semana,
 * uma linha por dia. Dias protegidos (o protetor da loja, o PRO, ou uma
 * restauração da equipe) ganham um anel roxo — dá para ver de onde veio cada
 * pedaço da ofensiva.
 */
export function CalendarioDeEstudo({ c }: { c: Calendario }) {
  const [foco, setFoco] = useState<string | null>(null);
  const { semanas, meses, porDia, protegidos, totalDias, totalMin } = useMemo(() => {
    const porDia = new Map(c.estudo.map((e) => [e.dia, e.minutos]));
    const protegidos = new Set(c.protegidos);
    const fim = new Date(`${c.fim}T00:00:00Z`).getTime();
    // Começa num domingo, 52 semanas antes da semana de hoje.
    const inicioDaSemanaAtual = fim - new Date(fim).getUTCDay() * DIA;
    const primeiro = inicioDaSemanaAtual - 52 * 7 * DIA;
    const semanas: string[][] = [];
    const meses: { coluna: number; nome: string }[] = [];
    for (let s = 0; s < 53; s++) {
      const semana: string[] = [];
      for (let d = 0; d < 7; d++) semana.push(iso(primeiro + (s * 7 + d) * DIA));
      semanas.push(semana);
      const primeiroDoMes = semana.find((x) => x.endsWith("-01"));
      if (primeiroDoMes) meses.push({ coluna: s, nome: dia(primeiroDoMes, { month: "short" }) });
    }
    return {
      semanas, meses, porDia, protegidos,
      totalDias: c.estudo.length,
      totalMin: c.estudo.reduce((a, e) => a + e.minutos, 0),
    };
  }, [c]);

  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div className="inline-block">
          <div className="relative ml-7 h-4 text-[10px] text-muted-foreground">
            {meses.map((m) => <span key={m.coluna} className="absolute" style={{ left: m.coluna * 13 }}>{m.nome}</span>)}
          </div>
          <div className="flex gap-[3px]">
            <div className="mr-1 flex w-6 flex-col gap-[3px] text-[9px] leading-[10px] text-muted-foreground">
              {["", "seg", "", "qua", "", "sex", ""].map((d, i) => <span key={i} className="h-[10px]">{d}</span>)}
            </div>
            {semanas.map((semana, s) => (
              <div key={s} className="flex flex-col gap-[3px]">
                {semana.map((d) => {
                  const futuro = d > c.fim;
                  const min = porDia.get(d) ?? 0;
                  const g = degrau(min);
                  return (
                    <span
                      key={d}
                      tabIndex={futuro ? -1 : 0}
                      aria-label={`${dia(d, { day: "2-digit", month: "long" })}: ${min ? `${min} minutos` : "sem estudo"}${protegidos.has(d) ? ", protegido" : ""}`}
                      onPointerEnter={() => setFoco(d)}
                      onFocus={() => setFoco(d)}
                      onPointerLeave={() => setFoco(null)}
                      className={cn(
                        "size-[10px] rounded-[2px] outline-none",
                        futuro && "opacity-0",
                        protegidos.has(d) && "ring-2 ring-violet-500 ring-offset-0",
                        foco === d && "ring-2 ring-foreground/50",
                      )}
                      style={{ background: g ? `var(--viz-seq-${g})` : "var(--viz-vazio)" }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {foco ? (
            <><b className="text-foreground">{dia(foco, { day: "2-digit", month: "long", year: "numeric" })}</b> · {porDia.get(foco) ? `${porDia.get(foco)} min` : "sem estudo"}{protegidos.has(foco) ? " · protegido" : ""}</>
          ) : (
            <><b className="text-foreground">{numero(totalDias)}</b> dias de estudo no último ano · {numero(totalMin)} min</>
          )}
        </span>
        <span className="flex items-center gap-1.5">
          menos {[0, 2, 3, 4, 5, 6].map((g) => <span key={g} className="size-2.5 rounded-[2px]" style={{ background: g ? `var(--viz-seq-${g})` : "var(--viz-vazio)" }} />)} mais
          <span className="ml-2 size-2.5 rounded-[2px] ring-2 ring-violet-500" /> protegido
        </span>
      </div>
    </div>
  );
}

/**
 * Os últimos 30 dias para escolher quais proteger na restauração de uma
 * ofensiva. Dias com estudo aparecem preenchidos e não precisam de proteção.
 */
export function EscolhaDeDias({ c, escolhidos, aoMudar }: { c: Calendario; escolhidos: Set<string>; aoMudar: (s: Set<string>) => void }) {
  const estudou = new Set(c.estudo.map((e) => e.dia));
  const fim = new Date(`${c.fim}T00:00:00Z`).getTime();
  const dias = Array.from({ length: 30 }, (_, i) => iso(fim - (30 - i) * DIA));
  return (
    <div className="grid grid-cols-10 gap-1">
      {dias.map((d) => {
        const marcado = escolhidos.has(d);
        const feito = estudou.has(d);
        return (
          <button
            key={d}
            type="button"
            disabled={feito}
            onClick={() => {
              const n = new Set(escolhidos);
              if (marcado) n.delete(d);
              else n.add(d);
              aoMudar(n);
            }}
            aria-pressed={marcado}
            title={feito ? "Estudou neste dia" : marcado ? "Será protegido" : "Clique para proteger"}
            className={cn(
              "flex h-9 flex-col items-center justify-center rounded-md border text-[10px] font-bold leading-tight transition-colors",
              feito && "border-transparent bg-[var(--viz-seq-3)] text-white",
              marcado && "border-violet-500 bg-violet-500/15 text-violet-700 dark:text-violet-300",
              !feito && !marcado && "hover:bg-muted",
            )}
          >
            <span>{d.slice(8, 10)}</span>
            <span className="font-normal opacity-70">{dia(d, { month: "short" })}</span>
          </button>
        );
      })}
    </div>
  );
}
