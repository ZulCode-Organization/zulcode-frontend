"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Coins, Flame, Heart, Plus, Shield, Sparkles, Trash2, X, Zap } from "lucide-react";
import { API_BASE_URL } from "@/lib/api-config";
import { BotaoAcao } from "@/components/admin/botao-acao";
import { chamarAdmin, useAcao } from "@/components/admin/use-acao";
import { cn } from "@/lib/utils";

type EfeitoLoja = "RECOVER_LIVES" | "FREEZE_STREAK" | "DOUBLE_XP" | "FEATHER_SHIELD" | "DOUBLE_COINS" | "HEAL_ONE_LIFE";
type ItemLoja = { id: string; title: string; description: string; price: number; effect: EfeitoLoja; active: boolean; order: number };

/**
 * Os efeitos são os que o backend aceita no enum ShopEffect. Cada um leva o
 * próprio ícone e cor, então o item se reconhece de relance na listagem em vez
 * de virar mais uma linha de texto igual às outras.
 */
const EFEITOS: { valor: EfeitoLoja; rotulo: string; Icone: typeof Heart; cor: string }[] = [
  { valor: "RECOVER_LIVES", rotulo: "Recuperar penas", Icone: Heart, cor: "text-rose-500" },
  { valor: "HEAL_ONE_LIFE", rotulo: "Recuperar uma pena", Icone: Heart, cor: "text-pink-500" },
  { valor: "FREEZE_STREAK", rotulo: "Congelar ofensiva", Icone: Flame, cor: "text-sky-500" },
  { valor: "FEATHER_SHIELD", rotulo: "Escudo de pena", Icone: Shield, cor: "text-indigo-500" },
  { valor: "DOUBLE_XP", rotulo: "XP em dobro", Icone: Zap, cor: "text-amber-500" },
  { valor: "DOUBLE_COINS", rotulo: "Moedas em dobro", Icone: Coins, cor: "text-yellow-500" },
];

const efeitoDe = (valor: EfeitoLoja) => EFEITOS.find((e) => e.valor === valor);

const VAZIO: ItemLoja = { id: "", title: "", description: "", price: 0, effect: "RECOVER_LIVES", active: true, order: 0 };

/**
 * Excluir em dois toques, no lugar do window.confirm.
 *
 * O confirm do navegador trava a página inteira e some com o contexto do que
 * vai ser apagado. Aqui o próprio botão vira "Confirmar" por alguns segundos
 * e volta sozinho — quem clicou sem querer é só esperar.
 */
function BotaoExcluir({ item, aoExcluir }: { item: ItemLoja; aoExcluir: () => Promise<void> }) {
  const [armado, setArmado] = useState(false);
  const excluir = useAcao(async () => {
    await chamarAdmin(`${API_BASE_URL}/admin/shop/${item.id}`, { method: "DELETE" }, "Não foi possível excluir o item.");
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
        aria-label={`Excluir ${item.title}`}
        className="rounded-xl bg-muted p-2.5 text-muted-foreground transition-colors duration-150 hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </button>
    );
  }

  return (
    <BotaoAcao
      estado={excluir.estado}
      onClick={() => void excluir.rodar()}
      variante="perigo"
      rotuloEnviando="Excluindo…"
      rotuloConcluido="Excluído"
      className="px-3 py-2.5 text-xs"
    >
      Confirmar
    </BotaoAcao>
  );
}

export default function AdminLoja() {
  const [itens, setItens] = useState<ItemLoja[]>([]);
  const [carregado, setCarregado] = useState(false);
  const [erro, setErro] = useState("");
  const [editando, setEditando] = useState<ItemLoja | null>(null);

  const carregar = useCallback(async () => {
    try {
      const dados = await chamarAdmin(`${API_BASE_URL}/admin/shop`, {}, "Não foi possível carregar a loja.");
      setItens(Array.isArray(dados) ? dados : []);
      setErro("");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível carregar a loja.");
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
      description: String(form.get("description") ?? "").trim(),
      price: Number(form.get("price")),
      effect: form.get("effect") as EfeitoLoja,
      active: form.get("active") === "on",
      order: Number(form.get("order")),
    };
    await chamarAdmin(
      `${API_BASE_URL}/admin/shop${editando.id ? `/${editando.id}` : ""}`,
      { method: editando.id ? "PATCH" : "POST", body: JSON.stringify(corpo) },
      "Não foi possível salvar o item."
    );
    setEditando(null);
    await carregar();
  });

  const abrirNovo = () => {
    salvar.limpar();
    setEditando({ ...VAZIO, order: itens.length });
  };

  return (
    <section className="py-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-wider text-primary">Economia</p>
          <h1 className="mt-1.5 text-3xl font-black sm:text-4xl">Loja</h1>
          <p className="mt-2 text-muted-foreground">O que dá pra comprar com moedas, e por quanto.</p>
        </div>
        <button
          type="button"
          onClick={abrirNovo}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground transition-all duration-150 hover:brightness-110"
        >
          <Plus className="size-4" /> Novo item
        </button>
      </div>

      {erro && <p className="mt-5 rounded-xl bg-destructive/10 p-3 text-sm font-bold text-destructive">{erro}</p>}

      {!carregado ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      ) : !itens.length ? (
        <div className="mt-6 rounded-2xl border bg-card p-10 text-center">
          <Sparkles className="mx-auto size-7 text-muted-foreground/60" />
          <p className="mt-3 font-black">A loja está vazia</p>
          <p className="mt-1 text-sm text-muted-foreground">Crie o primeiro item para as pessoas gastarem moedas.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {itens.map((item, indice) => {
            const efeito = efeitoDe(item.effect);
            const Icone = efeito?.Icone ?? Sparkles;
            return (
              <article
                key={item.id}
                style={{ animationDelay: `${Math.min(indice, 10) * 30}ms` }}
                className={cn(
                  "animate-fade-in-up flex flex-col rounded-2xl border bg-card p-4 transition-colors duration-150",
                  !item.active && "opacity-60"
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-muted">
                    <Icone className={cn("size-5", efeito?.cor)} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <b className="truncate">{item.title}</b>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[0.65rem] font-black uppercase",
                          item.active ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {item.active ? "Na loja" : "Fora"}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-sm font-black text-yellow-600 dark:text-yellow-400">
                    <Coins className="size-4" /> {item.price}
                    <span className="ml-2 font-bold text-muted-foreground">{efeito?.rotulo ?? item.effect}</span>
                  </span>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => { salvar.limpar(); setEditando(item); }}
                      className="rounded-xl bg-muted px-3 py-2.5 text-xs font-black transition-colors duration-150 hover:bg-muted/60"
                    >
                      Editar
                    </button>
                    <BotaoExcluir item={item} aoExcluir={carregar} />
                  </div>
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
              <div>
                <h2 className="text-xl font-black">{editando.id ? "Editar item" : "Novo item"}</h2>
                <p className="text-sm text-muted-foreground">A mudança aparece na loja assim que salvar.</p>
              </div>
              <button type="button" onClick={() => setEditando(null)} aria-label="Fechar" className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted">
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <label className="block text-sm font-black">
                Título
                <input name="title" required defaultValue={editando.title} placeholder="Ex.: Recuperar penas" className="mt-1.5 w-full rounded-xl border bg-background p-3 font-medium outline-none focus:border-primary" />
              </label>
              <label className="block text-sm font-black">
                Descrição
                <textarea name="description" required defaultValue={editando.description} placeholder="O que a pessoa ganha ao comprar" className="mt-1.5 min-h-24 w-full rounded-xl border bg-background p-3 font-medium outline-none focus:border-primary" />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-black">
                  Preço em moedas
                  <input name="price" type="number" min="0" required defaultValue={editando.price} className="mt-1.5 w-full rounded-xl border bg-background p-3 font-bold tabular-nums outline-none focus:border-primary" />
                </label>
                <label className="block text-sm font-black">
                  Ordem na vitrine
                  <input name="order" type="number" min="0" required defaultValue={editando.order} className="mt-1.5 w-full rounded-xl border bg-background p-3 font-bold tabular-nums outline-none focus:border-primary" />
                </label>
              </div>
              <label className="block text-sm font-black">
                Efeito
                <select name="effect" defaultValue={editando.effect} className="mt-1.5 w-full rounded-xl border bg-background p-3 font-medium outline-none focus:border-primary">
                  {EFEITOS.map((e) => <option key={e.valor} value={e.valor}>{e.rotulo}</option>)}
                </select>
                <span className="mt-1.5 block text-xs font-medium text-muted-foreground">
                  O efeito é o que o app executa na compra. A lista é fechada porque cada um tem um tratamento próprio no servidor.
                </span>
              </label>
              <label className="flex items-center gap-2 text-sm font-black">
                <input name="active" type="checkbox" defaultChecked={editando.active} className="size-4" />
                Disponível para compra
              </label>
            </div>

            {salvar.erro && <p className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm font-bold text-destructive">{salvar.erro}</p>}

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setEditando(null)} className="rounded-xl bg-muted px-4 py-2.5 text-sm font-black transition-colors hover:bg-muted/60">
                Cancelar
              </button>
              <BotaoAcao estado={salvar.estado} type="submit" rotuloEnviando="Salvando…" rotuloConcluido="Salvo">
                {editando.id ? "Salvar alterações" : "Criar item"}
              </BotaoAcao>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
