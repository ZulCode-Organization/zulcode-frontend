"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Coins, Plus, Target, Trash2, X } from "lucide-react";
import { API_BASE_URL } from "@/lib/api-config";
import { BotaoAcao } from "./botao-acao";
import { chamarAdmin, useAcao } from "./use-acao";
import { cn } from "@/lib/utils";

type Periodo = "DAILY" | "WEEKLY" | "MONTHLY";
type TipoMeta = "LESSONS_COMPLETED" | "XP_EARNED" | "PERFECT_LESSONS" | "DAILY_MINUTES";
type Meta = { id: string; title: string; period: Periodo; type: TipoMeta; target: number; coinReward: number; order: number; active: boolean };

const PERIODOS: { valor: Periodo; rotulo: string }[] = [
  { valor: "DAILY", rotulo: "Diária" },
  { valor: "WEEKLY", rotulo: "Semanal" },
  { valor: "MONTHLY", rotulo: "Mensal" },
];

const TIPOS: { valor: TipoMeta; rotulo: string; unidade: string }[] = [
  { valor: "LESSONS_COMPLETED", rotulo: "Aulas concluídas", unidade: "aulas" },
  { valor: "XP_EARNED", rotulo: "XP ganho", unidade: "XP" },
  { valor: "PERFECT_LESSONS", rotulo: "Aulas sem erro", unidade: "aulas" },
  { valor: "DAILY_MINUTES", rotulo: "Minutos de estudo", unidade: "minutos" },
];

const VAZIA: Meta = { id: "", title: "", period: "DAILY", type: "LESSONS_COMPLETED", target: 1, coinReward: 5, order: 0, active: true };

/** Excluir em dois toques: o botão vira "Confirmar" e volta sozinho em 4s. */
function BotaoExcluir({ meta, aoExcluir }: { meta: Meta; aoExcluir: () => Promise<void> }) {
  const [armado, setArmado] = useState(false);
  const excluir = useAcao(async () => {
    await chamarAdmin(`${API_BASE_URL}/admin/goals/${meta.id}`, { method: "DELETE" }, "Não foi possível excluir a meta.");
    await aoExcluir();
  });

  useEffect(() => {
    if (!armado) return;
    const id = setTimeout(() => setArmado(false), 4000);
    return () => clearTimeout(id);
  }, [armado]);

  if (!armado) {
    return (
      <button
        type="button"
        onClick={() => setArmado(true)}
        aria-label={`Excluir ${meta.title}`}
        className="rounded-xl bg-muted p-2.5 text-muted-foreground transition-colors duration-150 hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </button>
    );
  }

  return (
    <BotaoAcao estado={excluir.estado} onClick={() => void excluir.rodar()} variante="perigo" rotuloEnviando="Excluindo…" rotuloConcluido="Excluída" className="px-3 py-2.5 text-xs">
      Confirmar
    </BotaoAcao>
  );
}

export function AdminMetas() {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [carregado, setCarregado] = useState(false);
  const [erro, setErro] = useState("");
  const [editando, setEditando] = useState<Meta | null>(null);

  const carregar = useCallback(async () => {
    try {
      const dados = await chamarAdmin(`${API_BASE_URL}/admin/goals`, {}, "Não foi possível carregar as metas.");
      setMetas(Array.isArray(dados) ? dados : []);
      setErro("");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível carregar as metas.");
    } finally {
      setCarregado(true);
    }
  }, []);

  // Todo setState do `carregar` vem depois do await, então não há atualização
  // síncrona dentro do efeito — a regra só não enxerga isso pelo useCallback.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void carregar(); }, [carregar]);

  const salvar = useAcao(async (evento: FormEvent<HTMLFormElement>) => {
    if (!editando) return;
    const form = new FormData(evento.currentTarget);
    const corpo = {
      title: String(form.get("title") ?? "").trim(),
      period: form.get("period") as Periodo,
      type: form.get("type") as TipoMeta,
      target: Number(form.get("target")),
      coinReward: Number(form.get("coinReward")),
      order: Number(form.get("order")),
      active: form.get("active") === "on",
    };
    await chamarAdmin(
      `${API_BASE_URL}/admin/goals${editando.id ? `/${editando.id}` : ""}`,
      { method: editando.id ? "PATCH" : "POST", body: JSON.stringify(corpo) },
      "Não foi possível salvar a meta."
    );
    setEditando(null);
    await carregar();
  });

  return (
    <section className="py-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-wider text-primary">Engajamento</p>
          <h1 className="mt-1.5 text-3xl font-black sm:text-4xl">Metas</h1>
          <p className="mt-2 text-muted-foreground">O que a pessoa precisa fazer no período, e quanto ganha por isso.</p>
        </div>
        <button
          type="button"
          onClick={() => { salvar.limpar(); setEditando({ ...VAZIA, order: metas.length }); }}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground transition-all duration-150 hover:brightness-110"
        >
          <Plus className="size-4" /> Nova meta
        </button>
      </div>

      {erro && <p className="mt-5 rounded-xl bg-destructive/10 p-3 text-sm font-bold text-destructive">{erro}</p>}

      {!carregado ? (
        <div className="mt-6 space-y-2.5">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      ) : !metas.length ? (
        <div className="mt-6 rounded-2xl border bg-card p-10 text-center">
          <Target className="mx-auto size-7 text-muted-foreground/60" />
          <p className="mt-3 font-black">Nenhuma meta cadastrada</p>
          <p className="mt-1 text-sm text-muted-foreground">Sem metas, a aba de metas do app fica vazia para todo mundo.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-2.5">
          {metas.map((meta, indice) => {
            const tipo = TIPOS.find((t) => t.valor === meta.type);
            const periodo = PERIODOS.find((p) => p.valor === meta.period);
            return (
              <article
                key={meta.id}
                style={{ animationDelay: `${Math.min(indice, 10) * 30}ms` }}
                className={cn("animate-fade-in-up flex flex-wrap items-center gap-4 rounded-2xl border bg-card p-4", !meta.active && "opacity-60")}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <b className="truncate">{meta.title}</b>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.65rem] font-black uppercase text-primary">{periodo?.rotulo ?? meta.period}</span>
                    {!meta.active && <span className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-black uppercase text-muted-foreground">Inativa</span>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {tipo?.rotulo ?? meta.type} · alvo de {meta.target} {tipo?.unidade}
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-1.5 text-sm font-black text-yellow-600 dark:text-yellow-400">
                  <Coins className="size-4" /> {meta.coinReward}
                </span>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => { salvar.limpar(); setEditando(meta); }}
                    className="rounded-xl bg-muted px-3 py-2.5 text-xs font-black transition-colors duration-150 hover:bg-muted/60"
                  >
                    Editar
                  </button>
                  <BotaoExcluir meta={meta} aoExcluir={carregar} />
                </div>
              </article>
            );
          })}
        </div>
      )}

      {editando && (
        <div className="animate-fade-in fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <form
            onSubmit={(e) => { e.preventDefault(); void salvar.rodar(e); }}
            className="zc-scroll-hidden max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl border bg-card p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl font-black">{editando.id ? "Editar meta" : "Nova meta"}</h2>
              <button type="button" onClick={() => setEditando(null)} aria-label="Fechar" className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted">
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <label className="block text-sm font-black">
                Título
                <input name="title" required defaultValue={editando.title} placeholder="Ex.: Complete 3 aulas hoje" className="mt-1.5 w-full rounded-xl border bg-background p-3 font-medium outline-none focus:border-primary" />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-black">
                  Período
                  <select name="period" defaultValue={editando.period} className="mt-1.5 w-full rounded-xl border bg-background p-3 font-medium outline-none focus:border-primary">
                    {PERIODOS.map((p) => <option key={p.valor} value={p.valor}>{p.rotulo}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-black">
                  O que conta
                  <select name="type" defaultValue={editando.type} className="mt-1.5 w-full rounded-xl border bg-background p-3 font-medium outline-none focus:border-primary">
                    {TIPOS.map((t) => <option key={t.valor} value={t.valor}>{t.rotulo}</option>)}
                  </select>
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block text-sm font-black">
                  Alvo
                  <input name="target" type="number" min="1" required defaultValue={editando.target} className="mt-1.5 w-full rounded-xl border bg-background p-3 font-bold tabular-nums outline-none focus:border-primary" />
                </label>
                <label className="block text-sm font-black">
                  Moedas
                  <input name="coinReward" type="number" min="0" required defaultValue={editando.coinReward} className="mt-1.5 w-full rounded-xl border bg-background p-3 font-bold tabular-nums outline-none focus:border-primary" />
                </label>
                <label className="block text-sm font-black">
                  Ordem
                  <input name="order" type="number" min="0" required defaultValue={editando.order} className="mt-1.5 w-full rounded-xl border bg-background p-3 font-bold tabular-nums outline-none focus:border-primary" />
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm font-black">
                <input name="active" type="checkbox" defaultChecked={editando.active} className="size-4" />
                Meta ativa
              </label>
            </div>

            {salvar.erro && <p className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm font-bold text-destructive">{salvar.erro}</p>}

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setEditando(null)} className="rounded-xl bg-muted px-4 py-2.5 text-sm font-black transition-colors hover:bg-muted/60">
                Cancelar
              </button>
              <BotaoAcao estado={salvar.estado} type="submit" rotuloEnviando="Salvando…" rotuloConcluido="Salva">
                {editando.id ? "Salvar alterações" : "Criar meta"}
              </BotaoAcao>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
