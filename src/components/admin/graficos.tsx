"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Table2, LineChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { numero } from "@/lib/admin/formato";

/**
 * Os gráficos do administrativo, em SVG feito à mão.
 *
 * Seguem as mesmas regras em todos: linha de 2px, colunas de no máximo 24px
 * com a ponta arredondada e a base reta, grade em fio fino, um eixo só, cor
 * da série nunca no texto (o texto usa a tinta do tema; a série aparece no
 * traço ao lado). Toda série tem legenda e todo gráfico tem a opção de ver os
 * números em tabela — a cor nunca é o único jeito de ler.
 *
 * As cores vêm de variáveis (`--viz-1`…) definidas no globals.css para o
 * claro e para o escuro, validadas contra daltonismo nos dois fundos.
 */

export type Serie<K extends string> = { chave: K; nome: string; cor: 1 | 2 | 3 };

const COR = (n: 1 | 2 | 3) => `var(--viz-${n})`;

function useLargura<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [largura, setLargura] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () => setLargura(el.clientWidth);
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, largura] as const;
}

/** Um teto "redondo" para o eixo: 0 / 50 / 100 / 150, e não 0 / 37 / 74. */
function tetoRedondo(max: number) {
  if (max <= 4) return 4;
  const passo = Math.pow(10, Math.floor(Math.log10(max)));
  for (const m of [1, 2, 2.5, 5, 10]) if (max <= m * passo) return m * passo;
  return 10 * passo;
}

function Legenda<K extends string>({ series, forma }: { series: Serie<K>[]; forma: "linha" | "bloco" }) {
  if (series.length < 2) return null;
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {series.map((s) => (
        <li key={s.chave} className="flex items-center gap-1.5">
          {forma === "linha" ? (
            <span className="h-0.5 w-3.5 rounded-full" style={{ background: COR(s.cor) }} />
          ) : (
            <span className="size-2.5 rounded-[3px]" style={{ background: COR(s.cor) }} />
          )}
          {s.nome}
        </li>
      ))}
    </ul>
  );
}

/** O botão que troca o gráfico pela tabela com os mesmos números. */
function TrocaTabela({ tabela, aoMudar }: { tabela: boolean; aoMudar: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => aoMudar(!tabela)}
      aria-pressed={tabela}
      title={tabela ? "Ver gráfico" : "Ver os números em tabela"}
      className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[0.7rem] font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      {tabela ? <LineChart className="size-3.5" /> : <Table2 className="size-3.5" />}
      {tabela ? "Gráfico" : "Tabela"}
    </button>
  );
}

function TabelaSimples({ colunas, linhas }: { colunas: string[]; linhas: (string | number)[][] }) {
  return (
    <div className="max-h-72 overflow-auto rounded-lg border">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-muted/80 backdrop-blur">
          <tr>
            {colunas.map((c, i) => (
              <th key={c} className={cn("px-3 py-2 font-bold text-muted-foreground", i === 0 ? "text-left" : "text-right")}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {linhas.map((l, i) => (
            <tr key={i} className="border-t">
              {l.map((v, j) => (
                <td key={j} className={cn("px-3 py-1.5", j === 0 ? "text-left" : "text-right")}>{typeof v === "number" ? numero(v) : v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Linhas ───────────────────────────────────────────────────────────────

/**
 * Linhas ao longo dos dias. Uma mira vertical segue o ponteiro e encaixa no dia
 * mais próximo, e a dica mostra todas as séries daquele dia — ninguém precisa
 * acertar uma linha de 2px com o mouse. Pelo teclado, as setas fazem o mesmo.
 */
export function GraficoDeLinhas<K extends string>({
  dados, series, rotuloX, altura = 200, formatar = numero,
}: {
  dados: ({ dia: string } & Record<K, number>)[];
  series: Serie<K>[];
  rotuloX: (dia: string) => string;
  altura?: number;
  formatar?: (n: number) => string;
}) {
  const [ref, largura] = useLargura<HTMLDivElement>();
  const [foco, setFoco] = useState<number | null>(null);
  const [tabela, setTabela] = useState(false);
  const idArea = useId();

  const margem = { topo: 10, dir: 12, base: 22, esq: 40 };
  const w = Math.max(0, largura - margem.esq - margem.dir);
  const h = altura - margem.topo - margem.base;
  const max = tetoRedondo(Math.max(1, ...dados.flatMap((d) => series.map((s) => d[s.chave] ?? 0))));
  const x = (i: number) => margem.esq + (dados.length <= 1 ? w / 2 : (i / (dados.length - 1)) * w);
  const y = (v: number) => margem.topo + h - (v / max) * h;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));
  // Rótulos do eixo X sem encavalar: no máximo um a cada ~70px.
  const cadaQuantos = Math.max(1, Math.ceil(dados.length / Math.max(2, Math.floor(w / 70))));

  const caminho = (k: K) => dados.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d[k] ?? 0).toFixed(1)}`).join(" ");
  const sozinha = series.length === 1;

  const aoMover = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left - margem.esq;
    const i = Math.round((px / Math.max(1, w)) * (dados.length - 1));
    setFoco(Math.max(0, Math.min(dados.length - 1, i)));
  };

  const ponto = foco !== null ? dados[foco] : null;
  const dicaEsq = foco !== null ? Math.min(Math.max(x(foco) + 12, 0), Math.max(0, largura - 170)) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Legenda series={series} forma="linha" />
        <span className="ml-auto"><TrocaTabela tabela={tabela} aoMudar={setTabela} /></span>
      </div>
      {tabela ? (
        <TabelaSimples colunas={["Dia", ...series.map((s) => s.nome)]} linhas={dados.map((d) => [rotuloX(d.dia), ...series.map((s) => d[s.chave] ?? 0)])} />
      ) : (
        <div ref={ref} className="relative" style={{ height: altura }}>
          {largura > 0 && (
            <svg
              width={largura}
              height={altura}
              role="img"
              aria-label={`Gráfico de ${series.map((s) => s.nome).join(" e ")} por dia`}
              tabIndex={0}
              className="block touch-none outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              onPointerMove={aoMover}
              onPointerLeave={() => setFoco(null)}
              onBlur={() => setFoco(null)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") setFoco((f) => Math.min(dados.length - 1, (f ?? -1) + 1));
                if (e.key === "ArrowLeft") setFoco((f) => Math.max(0, (f ?? dados.length) - 1));
              }}
            >
              <defs>
                <linearGradient id={idArea} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor={COR(series[0]?.cor ?? 1)} stopOpacity="0.14" />
                  <stop offset="1" stopColor={COR(series[0]?.cor ?? 1)} stopOpacity="0" />
                </linearGradient>
              </defs>
              {ticks.map((t) => (
                <g key={t}>
                  <line x1={margem.esq} x2={margem.esq + w} y1={y(t)} y2={y(t)} stroke="var(--viz-grade)" strokeWidth={1} />
                  <text x={margem.esq - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted-foreground text-[10px] tabular-nums">{formatar(t)}</text>
                </g>
              ))}
              {dados.map((d, i) =>
                // O último dia sempre aparece; o rótulo regular perto dele sai,
                // senão os dois encavalam no fim do eixo.
                (i % cadaQuantos === 0 && dados.length - 1 - i >= cadaQuantos / 2) || i === dados.length - 1 ? (
                  <text key={d.dia} x={x(i)} y={altura - 6} textAnchor={i === 0 ? "start" : i === dados.length - 1 ? "end" : "middle"} className="fill-muted-foreground text-[10px]">
                    {rotuloX(d.dia)}
                  </text>
                ) : null,
              )}
              {sozinha && dados.length > 1 && (
                <path d={`${caminho(series[0].chave)} L${x(dados.length - 1)},${y(0)} L${x(0)},${y(0)} Z`} fill={`url(#${idArea})`} />
              )}
              {series.map((s) => (
                <path key={s.chave} d={caminho(s.chave)} fill="none" stroke={COR(s.cor)} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              ))}
              {foco !== null && (
                <g>
                  <line x1={x(foco)} x2={x(foco)} y1={margem.topo} y2={margem.topo + h} stroke="var(--viz-mira)" strokeWidth={1} />
                  {series.map((s) => (
                    <circle key={s.chave} cx={x(foco)} cy={y(dados[foco][s.chave] ?? 0)} r={4.5} fill={COR(s.cor)} stroke="var(--card)" strokeWidth={2} />
                  ))}
                </g>
              )}
            </svg>
          )}
          {ponto && (
            <div className="pointer-events-none absolute top-1 z-10 min-w-36 rounded-lg border bg-popover px-2.5 py-2 text-xs shadow-lg" style={{ left: dicaEsq }}>
              <p className="mb-1 font-bold text-muted-foreground">{rotuloX(ponto.dia)}</p>
              {series.map((s) => (
                <p key={s.chave} className="flex items-center gap-2">
                  <span className="h-0.5 w-3 rounded-full" style={{ background: COR(s.cor) }} />
                  <b className="tabular-nums">{formatar(ponto[s.chave] ?? 0)}</b>
                  <span className="text-muted-foreground">{s.nome}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Colunas agrupadas ────────────────────────────────────────────────────

/** Colunas por categoria (um mês, uma faixa), com até três séries lado a lado. */
export function GraficoDeColunas<K extends string>({
  dados, series, rotulo, altura = 200,
}: {
  dados: ({ rotulo: string } & Record<K, number>)[];
  series: Serie<K>[];
  rotulo?: string;
  altura?: number;
}) {
  const [ref, largura] = useLargura<HTMLDivElement>();
  const [foco, setFoco] = useState<{ i: number; k: K } | null>(null);
  const [tabela, setTabela] = useState(false);
  const margem = { topo: 16, dir: 8, base: 22, esq: 36 };
  const w = Math.max(0, largura - margem.esq - margem.dir);
  const h = altura - margem.topo - margem.base;
  const max = tetoRedondo(Math.max(1, ...dados.flatMap((d) => series.map((s) => d[s.chave] ?? 0))));
  const faixa = dados.length ? w / dados.length : 0;
  const coluna = Math.min(24, Math.max(4, (faixa * 0.7 - (series.length - 1) * 2) / series.length));
  const grupo = coluna * series.length + (series.length - 1) * 2;
  const y = (v: number) => margem.topo + h - (v / max) * h;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Legenda series={series} forma="bloco" />
        <span className="ml-auto"><TrocaTabela tabela={tabela} aoMudar={setTabela} /></span>
      </div>
      {tabela ? (
        <TabelaSimples colunas={[rotulo ?? "", ...series.map((s) => s.nome)]} linhas={dados.map((d) => [d.rotulo, ...series.map((s) => d[s.chave] ?? 0)])} />
      ) : (
        <div ref={ref} className="relative" style={{ height: altura }}>
          {largura > 0 && (
            <svg width={largura} height={altura} role="img" aria-label={rotulo ?? "Gráfico de colunas"} className="block">
              {[0, 0.5, 1].map((f) => (
                <g key={f}>
                  <line x1={margem.esq} x2={margem.esq + w} y1={y(max * f)} y2={y(max * f)} stroke="var(--viz-grade)" strokeWidth={1} />
                  <text x={margem.esq - 8} y={y(max * f)} dy="0.32em" textAnchor="end" className="fill-muted-foreground text-[10px] tabular-nums">{numero(Math.round(max * f))}</text>
                </g>
              ))}
              {dados.map((d, i) => {
                const inicio = margem.esq + i * faixa + (faixa - grupo) / 2;
                return (
                  <g key={d.rotulo}>
                    {series.map((s, j) => {
                      const v = d[s.chave] ?? 0;
                      const topo = y(v);
                      const alt = Math.max(0, margem.topo + h - topo);
                      const xc = inicio + j * (coluna + 2);
                      const r = Math.min(4, alt / 2, coluna / 2);
                      const ativa = foco?.i === i && foco.k === s.chave;
                      return (
                        <g key={s.chave}>
                          {/* Ponta arredondada, base reta: o arredondado só no topo. */}
                          <path
                            d={`M${xc},${topo + alt} V${topo + r} Q${xc},${topo} ${xc + r},${topo} H${xc + coluna - r} Q${xc + coluna},${topo} ${xc + coluna},${topo + r} V${topo + alt} Z`}
                            fill={COR(s.cor)}
                            opacity={foco && !ativa ? 0.45 : 1}
                          />
                          <rect
                            x={xc - 2} y={margem.topo} width={coluna + 4} height={h} fill="transparent" tabIndex={0}
                            aria-label={`${d.rotulo}, ${s.nome}: ${numero(v)}`}
                            onPointerEnter={() => setFoco({ i, k: s.chave })} onPointerLeave={() => setFoco(null)}
                            onFocus={() => setFoco({ i, k: s.chave })} onBlur={() => setFoco(null)}
                            className="cursor-default outline-none"
                          />
                        </g>
                      );
                    })}
                    <text x={margem.esq + i * faixa + faixa / 2} y={altura - 6} textAnchor="middle" className="fill-muted-foreground text-[10px]">{d.rotulo}</text>
                  </g>
                );
              })}
            </svg>
          )}
          {foco && (
            <div
              className="pointer-events-none absolute top-0 z-10 rounded-lg border bg-popover px-2.5 py-1.5 text-xs shadow-lg"
              style={{ left: Math.min(Math.max(0, margem.esq + foco.i * faixa), Math.max(0, largura - 150)) }}
            >
              <p className="font-bold text-muted-foreground">{dados[foco.i].rotulo}</p>
              <p className="flex items-center gap-2">
                <span className="size-2 rounded-[2px]" style={{ background: COR(series.find((s) => s.chave === foco.k)!.cor) }} />
                <b className="tabular-nums">{numero(dados[foco.i][foco.k] ?? 0)}</b>
                <span className="text-muted-foreground">{series.find((s) => s.chave === foco.k)!.nome}</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Barras de ranking ────────────────────────────────────────────────────

/**
 * Uma lista ordenada com barras: o nome à esquerda, a barra e o valor na
 * ponta. Para "aulas mais feitas", "itens mais vendidos". HTML em vez de SVG:
 * o nome precisa quebrar linha e ser clicável.
 */
export function Ranking({
  itens, formatar = numero, vazio = "Nada no período.", cor = 1,
}: {
  itens: { chave: string; nome: ReactNode; valor: number; detalhe?: ReactNode; href?: string; aoClicar?: () => void }[];
  formatar?: (n: number) => string;
  vazio?: string;
  cor?: 1 | 2 | 3;
}) {
  const max = Math.max(1, ...itens.map((i) => i.valor));
  if (!itens.length) return <p className="py-6 text-center text-sm text-muted-foreground">{vazio}</p>;
  return (
    <ol className="space-y-2.5">
      {itens.map((i) => {
        const conteudo = (
          <>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate font-bold">{i.nome}</span>
              <span className="shrink-0 font-black tabular-nums">{formatar(i.valor)}</span>
            </div>
            {i.detalhe && <p className="truncate text-xs text-muted-foreground">{i.detalhe}</p>}
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full" style={{ width: `${Math.max(2, (i.valor / max) * 100)}%`, background: COR(cor) }} />
            </div>
          </>
        );
        return (
          <li key={i.chave}>
            {i.aoClicar ? (
              <button type="button" onClick={i.aoClicar} className="block w-full rounded-md text-left hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                {conteudo}
              </button>
            ) : (
              conteudo
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ── Mapa de calor ────────────────────────────────────────────────────────

const DIAS_DA_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

/**
 * Dia da semana × hora. Uma cor só, do claro ao escuro (no tema escuro, do
 * apagado ao aceso): mais estudo, mais tinta. Sem dado é a cor da grade, e não
 * o primeiro degrau — "nada" não pode parecer "pouco".
 */
export function MapaDeCalor({ matriz }: { matriz: number[][] }) {
  const [foco, setFoco] = useState<{ d: number; h: number } | null>(null);
  const [tabela, setTabela] = useState(false);
  const max = Math.max(1, ...matriz.flat());
  const degrau = (v: number) => (v <= 0 ? 0 : Math.min(6, 1 + Math.floor((v / max) * 5.999)));

  const ordem = useMemo(() => [1, 2, 3, 4, 5, 6, 0], []); // a semana começa na segunda

  if (tabela) {
    return (
      <div className="space-y-2">
        <div className="flex justify-end"><TrocaTabela tabela aoMudar={setTabela} /></div>
        <TabelaSimples
          colunas={["Dia", ...Array.from({ length: 24 }, (_, h) => `${h}h`)]}
          linhas={ordem.map((d) => [DIAS_DA_SEMANA[d], ...matriz[d]])}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[0.7rem] text-muted-foreground">
          menos
          {[1, 2, 3, 4, 5, 6].map((n) => <span key={n} className="size-2.5 rounded-[3px]" style={{ background: `var(--viz-seq-${n})` }} />)}
          mais
        </div>
        <TrocaTabela tabela={false} aoMudar={setTabela} />
      </div>
      <div className="relative overflow-x-auto">
        <div className="grid min-w-[560px] gap-[3px]" style={{ gridTemplateColumns: "34px repeat(24, minmax(0, 1fr))" }}>
          <span />
          {Array.from({ length: 24 }, (_, h) => (
            <span key={h} className="text-center text-[9px] text-muted-foreground">{h % 3 === 0 ? `${h}h` : ""}</span>
          ))}
          {ordem.map((d) => (
            <div key={d} className="contents">
              <span className="pr-1 text-right text-[10px] leading-[18px] text-muted-foreground">{DIAS_DA_SEMANA[d]}</span>
              {matriz[d].map((v, h) => (
                <span
                  key={h}
                  tabIndex={0}
                  aria-label={`${DIAS_DA_SEMANA[d]}, ${h}h: ${numero(v)}`}
                  onPointerEnter={() => setFoco({ d, h })}
                  onPointerLeave={() => setFoco(null)}
                  onFocus={() => setFoco({ d, h })}
                  onBlur={() => setFoco(null)}
                  className={cn("h-[18px] rounded-[3px] outline-none transition-transform", foco?.d === d && foco.h === h && "scale-110 ring-2 ring-foreground/40")}
                  style={{ background: degrau(v) ? `var(--viz-seq-${degrau(v)})` : "var(--viz-vazio)" }}
                />
              ))}
            </div>
          ))}
        </div>
        {foco && (
          <p className="mt-2 text-xs text-muted-foreground">
            <b className="text-foreground">{DIAS_DA_SEMANA[foco.d]}, {foco.h}h–{foco.h + 1}h:</b> {numero(matriz[foco.d][foco.h])} registros de estudo
          </p>
        )}
      </div>
    </div>
  );
}
