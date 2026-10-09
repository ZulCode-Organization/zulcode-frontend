"use client";

import { AlertTriangle, CheckCircle2, Copy, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { numero, porcento } from "@/lib/admin/formato";
import { Botao, Escolha } from "../ui";
import { ICONE_DO_TIPO } from "./trilho";
import { MAX_ETAPAS, TIPOS, nomeDaEtapa } from "./regras";
import type { Problema, QuestaoDoRascunho, RascunhoDaAula, TipoDeQuestao } from "@/lib/admin/tipos";

/**
 * O painel da direita: o tipo e a etapa da questão aberta, como ela está indo
 * com os alunos, as configurações da aula e a conferência do que falta para
 * publicar. Abaixo da tela larga, o mesmo painel aparece embaixo da questão.
 */
export function Painel({
  className, rascunho, questao, problemas, desempenho, aoMudar, aoTrocarTipo, aoMudarEtapa, aoDuplicar, aoApagar, aoIrPara,
}: {
  className?: string;
  rascunho: RascunhoDaAula;
  questao: QuestaoDoRascunho | null;
  problemas: Problema[];
  desempenho?: { respostas: number; acertos: number };
  aoMudar: (f: (r: RascunhoDaAula) => RascunhoDaAula, campoDeTexto?: string) => void;
  aoTrocarTipo: (id: string, tipo: TipoDeQuestao) => void;
  aoMudarEtapa: (id: string, etapa: number) => void;
  aoDuplicar: (id: string) => void;
  aoApagar: (id: string) => void;
  aoIrPara: (p: Problema) => void;
}) {
  const erros = problemas.filter((p) => p.nivel === "erro");
  const avisos = problemas.filter((p) => p.nivel === "aviso");
  const taxa = desempenho && desempenho.respostas ? (desempenho.acertos / desempenho.respostas) * 100 : null;

  /** Menos etapas: as questões das etapas que somem vão para a última que fica. */
  const mudarEtapas = (n: number) =>
    aoMudar((r) => ({ ...r, etapas: n, questoes: r.questoes.map((q) => (q.etapa > n ? { ...q, etapa: n } : q)) }));

  return (
    <aside className={cn("min-h-0 flex-col gap-0 overflow-y-auto border-l bg-card/60", className)}>
      {questao && (
        <section className="border-b p-4">
          <h3 className="mb-2.5 text-[0.7rem] font-black uppercase tracking-wider text-muted-foreground">Esta questão</h3>
          <div role="radiogroup" aria-label="Tipo da questão" className="grid grid-cols-2 gap-1.5">
            {TIPOS.map((t) => {
              const Icone = ICONE_DO_TIPO[t.tipo];
              const ativo = questao.tipo === t.tipo;
              return (
                <button
                  key={t.tipo}
                  type="button"
                  role="radio"
                  aria-checked={ativo}
                  title={t.descricao}
                  onClick={() => aoTrocarTipo(questao.id, t.tipo)}
                  className={cn("flex flex-col items-start gap-1 rounded-lg border px-2.5 py-2 text-left text-xs font-bold transition-colors", ativo ? "border-primary bg-primary/10 text-primary" : "hover:border-primary/40")}
                >
                  <Icone className="size-4" />
                  {t.nome}
                </button>
              );
            })}
          </div>

          <label className="mt-3 block">
            <span className="mb-1 block text-xs font-bold text-muted-foreground">Etapa</span>
            <Escolha value={questao.etapa} onChange={(e) => aoMudarEtapa(questao.id, Number(e.target.value))}>
              {Array.from({ length: rascunho.etapas }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{nomeDaEtapa(n, rascunho.etapas)}</option>)}
            </Escolha>
          </label>

          <div className="mt-3 rounded-lg bg-muted/60 px-3 py-2.5 text-xs">
            <p className="font-bold text-muted-foreground">Com os alunos</p>
            {taxa === null ? (
              <p className="mt-0.5 text-muted-foreground">Ainda sem respostas registradas. Elas começam a contar a partir do administrativo novo.</p>
            ) : (
              <>
                <p className="mt-0.5">
                  <b className={cn("text-base", taxa < 30 ? "text-rose-600 dark:text-rose-400" : taxa < 50 ? "text-amber-600 dark:text-amber-400" : "")}>{porcento(taxa, 0)}</b> acertam de primeira · {numero(desempenho!.respostas)} respostas
                </p>
                {taxa < 30 && desempenho!.respostas >= 5 && (
                  <p className="mt-1 font-bold text-rose-700 dark:text-rose-300">Quase todo mundo erra: confira se a resposta marcada é mesmo a certa.</p>
                )}
              </>
            )}
          </div>

          <div className="mt-3 flex gap-2">
            <Botao tamanho="sm" icone={<Copy className="size-3.5" />} onClick={() => aoDuplicar(questao.id)} title="Ctrl+D">Duplicar</Botao>
            <Botao tamanho="sm" variante="fantasma" icone={<Trash2 className="size-3.5" />} onClick={() => aoApagar(questao.id)} className="hover:text-rose-500">Apagar</Botao>
          </div>
        </section>
      )}

      <section className="border-b p-4">
        <h3 className="mb-2.5 text-[0.7rem] font-black uppercase tracking-wider text-muted-foreground">A aula</h3>
        <div className="grid grid-cols-2 gap-2">
          <label>
            <span className="mb-1 block text-xs font-bold text-muted-foreground">XP</span>
            <input
              type="number"
              min={0}
              max={1000}
              value={rascunho.xp}
              onChange={(e) => aoMudar((r) => ({ ...r, xp: Math.max(0, Math.min(1000, Math.trunc(Number(e.target.value) || 0))) }), "xp")}
              className="h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-bold text-muted-foreground">Etapas</span>
            <Escolha value={rascunho.etapas} onChange={(e) => mudarEtapas(Number(e.target.value))}>
              {Array.from({ length: MAX_ETAPAS }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
            </Escolha>
          </label>
        </div>
        <p className="mt-2 text-[0.72rem] text-muted-foreground">
          Cada etapa é uma rodada da aula na trilha. Com 2 etapas, elas se chamam Teoria e Revisão.
        </p>
      </section>

      <section className="p-4">
        <h3 className="mb-2.5 text-[0.7rem] font-black uppercase tracking-wider text-muted-foreground">Antes de publicar</h3>
        {problemas.length === 0 ? (
          <p className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2.5 text-sm font-bold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="size-4" /> Pronta para publicar
          </p>
        ) : (
          <ul className="space-y-1.5">
            {[...erros, ...avisos].map((p, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => aoIrPara(p)}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-bold transition-colors",
                    p.nivel === "erro" ? "bg-rose-500/10 text-rose-700 hover:bg-rose-500/15 dark:text-rose-300" : "bg-amber-500/10 text-amber-800 hover:bg-amber-500/15 dark:text-amber-200",
                  )}
                >
                  <AlertTriangle className="mt-px size-3.5 shrink-0" />
                  {p.texto}
                </button>
              </li>
            ))}
          </ul>
        )}
        {erros.length > 0 && <p className="mt-2 text-[0.72rem] text-muted-foreground">Os itens em vermelho impedem a publicação; os em amarelo são só avisos.</p>}
      </section>
    </aside>
  );
}
