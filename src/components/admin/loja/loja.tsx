"use client";

import { useState, type ReactNode } from "react";
import { CircleDollarSign, Feather, HeartPulse, Pencil, Plus, ShieldCheck, ShoppingBag, Trash2, Zap } from "lucide-react";
import { Pagina } from "../shell";
import { AreaDeTexto, Botao, Cabecalho, Entrada, Erro, Escolha, Esqueleto, Interruptor, Rotulo, Segmentado, Selo, Vazio } from "../ui";
import { Dialogo, perguntar } from "../dialogo";
import { apagarComDesfazer, avisar } from "../avisos";
import { GasOfensiva } from "@/components/shared/gas-ofensiva";
import { Rupee } from "@/components/shared/rupee";
import { AVATARES, AvatarIcon } from "@/components/shared/avatar-icon";
import { invalidar, pedir, trocarNoCache, useDados } from "@/lib/admin/api";
import { data, numero } from "@/lib/admin/formato";
import { cn } from "@/lib/utils";
import type { Cosmetico, EfeitoDaLoja, ItemDaLoja, TipoDeCosmetico } from "@/lib/admin/tipos";

const EFEITOS: { efeito: EfeitoDaLoja; nome: string; descricao: string }[] = [
  { efeito: "RECOVER_LIVES", nome: "Recuperar penas", descricao: "Enche as penas na hora" },
  { efeito: "HEAL_ONE_LIFE", nome: "Uma pena", descricao: "Devolve uma pena" },
  { efeito: "FREEZE_STREAK", nome: "Protetor de ofensiva", descricao: "Guarda um dia de proteção" },
  { efeito: "FEATHER_SHIELD", nome: "Escudo de pena", descricao: "O próximo erro não gasta pena" },
  { efeito: "DOUBLE_XP", nome: "XP em dobro", descricao: "Dobra o XP por um tempo" },
  { efeito: "DOUBLE_COINS", nome: "Rupees em dobro", descricao: "Dobra as rupees por um tempo" },
];

function IconeDoEfeito({ efeito, className }: { efeito: EfeitoDaLoja; className?: string }) {
  if (efeito === "RECOVER_LIVES") return <Feather className={className} />;
  if (efeito === "FREEZE_STREAK") return <GasOfensiva className={className} />;
  if (efeito === "FEATHER_SHIELD") return <ShieldCheck className={className} />;
  if (efeito === "DOUBLE_COINS") return <CircleDollarSign className={className} />;
  if (efeito === "HEAL_ONE_LIFE") return <HeartPulse className={className} />;
  return <Zap className={className} />;
}

/** A situação de venda de um item agora: no ar, desligado, agendado ou encerrado. */
function situacao(i: Pick<ItemDaLoja, "active" | "availableFrom" | "availableUntil">) {
  const agora = new Date();
  if (!i.active) return { texto: "Desligado", tom: "neutro" as const };
  if (i.availableFrom && new Date(i.availableFrom) > agora) return { texto: `Começa ${data(i.availableFrom, { day: "2-digit", month: "short" })}`, tom: "azul" as const };
  if (i.availableUntil && new Date(i.availableUntil) <= agora) return { texto: "Encerrado", tom: "neutro" as const };
  if (i.availableUntil) return { texto: `À venda até ${data(i.availableUntil, { day: "2-digit", month: "short" })}`, tom: "ambar" as const };
  return { texto: "À venda", tom: "verde" as const };
}

type Aba = "itens" | "cosmeticos";

export function LojaDoAdmin() {
  const [aba, setAba] = useState<Aba>("itens");
  const [editandoItem, setEditandoItem] = useState<ItemDaLoja | "novo" | null>(null);
  const [editandoCosmetico, setEditandoCosmetico] = useState<Cosmetico | "novo" | null>(null);

  return (
    <Pagina>
      <Cabecalho
        titulo="Loja"
        descricao="O que está à venda, por quanto e quanto vende. Desligar tira da loja sem apagar; a janela de venda faz itens por tempo limitado."
        acoes={
          <Botao variante="primario" icone={<Plus className="size-4" />} onClick={() => (aba === "itens" ? setEditandoItem("novo") : setEditandoCosmetico("novo"))}>
            {aba === "itens" ? "Novo item" : "Novo cosmético"}
          </Botao>
        }
      />
      <div className="mb-4">
        <Segmentado<Aba> rotulo="Tipo" valor={aba} aoMudar={setAba} opcoes={[{ valor: "itens", texto: "Itens de efeito" }, { valor: "cosmeticos", texto: "Cosméticos" }]} />
      </div>
      {aba === "itens" ? <Itens aoEditar={setEditandoItem} /> : <Cosmeticos aoEditar={setEditandoCosmetico} />}
      {editandoItem && <EditorDeItem item={editandoItem === "novo" ? null : editandoItem} aoFechar={() => setEditandoItem(null)} />}
      {editandoCosmetico && <EditorDeCosmetico cosmetico={editandoCosmetico === "novo" ? null : editandoCosmetico} aoFechar={() => setEditandoCosmetico(null)} />}
    </Pagina>
  );
}

// ── Itens de efeito ──────────────────────────────────────────────────────

const CHAVE_ITENS = "/admin/loja/itens";
const CHAVE_COSMETICOS = "/admin/loja/cosmeticos";

function Itens({ aoEditar }: { aoEditar: (i: ItemDaLoja) => void }) {
  const { dados, erro, recarregar, atualizando } = useDados<ItemDaLoja[]>(CHAVE_ITENS);

  const ligar = async (i: ItemDaLoja, active: boolean) => {
    trocarNoCache<ItemDaLoja[]>(CHAVE_ITENS, (l) => (l ?? []).map((x) => (x.id === i.id ? { ...x, active } : x)));
    try {
      await pedir(`/admin/loja/itens/${i.id}`, { method: "PATCH", json: { active } });
      avisar(active ? `"${i.title}" de volta na loja.` : `"${i.title}" saiu da loja.`);
    } catch (e) {
      avisar(e instanceof Error ? e.message : "Não foi possível salvar.", { tom: "erro" });
    } finally {
      invalidar(CHAVE_ITENS);
    }
  };

  if (erro && !dados) return <Erro tentarDeNovo={recarregar}>{erro}</Erro>;
  if (!dados) return <Esqueleto linhas={6} />;
  if (!dados.length) return <Vazio titulo="Nenhum item na loja" icone={<ShoppingBag className="size-5" />} />;

  return (
    <div className={cn("overflow-hidden rounded-xl border bg-card transition-opacity", atualizando && "opacity-70")}>
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 text-left font-bold">Item</th>
            <th className="px-3 py-2.5 text-right font-bold">Preço</th>
            <th className="px-3 py-2.5 text-left font-bold">Situação</th>
            <th className="px-3 py-2.5 text-right font-bold">Vendas (30 dias)</th>
            <th className="px-3 py-2.5 text-center font-bold">Na loja</th>
            <th className="w-20 px-3 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {dados.map((i) => {
            const s = situacao(i);
            return (
              <tr key={i.id} className="border-b last:border-0">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10"><IconeDoEfeito efeito={i.effect} className="size-5 text-amber-400" /></span>
                    <div className="min-w-0">
                      <p className="truncate font-bold">{i.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{EFEITOS.find((e) => e.efeito === i.effect)?.nome}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right"><span className="inline-flex items-center gap-1 font-black tabular-nums text-emerald-600 dark:text-emerald-400"><Rupee className="size-3.5" />{numero(i.price)}</span></td>
                <td className="px-3 py-2.5"><Selo tom={s.tom}>{s.texto}</Selo></td>
                <td className="px-3 py-2.5 text-right tabular-nums"><b>{numero(i.vendas30)}</b> <span className="text-xs text-muted-foreground">/ {numero(i.vendas)} no total</span></td>
                <td className="px-3 py-2.5 text-center"><Interruptor rotulo={`${i.title} na loja`} ligado={i.active} aoMudar={(v) => ligar(i, v)} /></td>
                <td className="px-3 py-2.5 text-right">
                  <span className="inline-flex">
                    <button type="button" onClick={() => aoEditar(i)} aria-label={`Editar ${i.title}`} className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"><Pencil className="size-4" /></button>
                    <button
                      type="button"
                      aria-label={`Apagar ${i.title}`}
                      className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-rose-500"
                      onClick={() => {
                        const antes = dados;
                        apagarComDesfazer({
                          texto: `"${i.title}" apagado da loja.`,
                          tirarDaTela: () => trocarNoCache<ItemDaLoja[]>(CHAVE_ITENS, (l) => (l ?? []).filter((x) => x.id !== i.id)),
                          restaurar: () => trocarNoCache<ItemDaLoja[]>(CHAVE_ITENS, () => antes),
                          executar: () => pedir(`/admin/loja/itens/${i.id}`, { method: "DELETE" }).then(() => invalidar(CHAVE_ITENS)),
                        });
                      }}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Converte o instante do banco para o valor de um campo datetime-local (horário do navegador). */
const paraCampo = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};
const doCampo = (v: string) => (v ? new Date(v).toISOString() : null);

function EditorDeItem({ item, aoFechar }: { item: ItemDaLoja | null; aoFechar: () => void }) {
  const [f, setF] = useState({
    title: item?.title ?? "",
    description: item?.description ?? "",
    price: String(item?.price ?? 50),
    effect: item?.effect ?? ("RECOVER_LIVES" as EfeitoDaLoja),
    active: item?.active ?? true,
    availableFrom: paraCampo(item?.availableFrom ?? null),
    availableUntil: paraCampo(item?.availableUntil ?? null),
  });
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const s = situacao({ active: f.active, availableFrom: doCampo(f.availableFrom), availableUntil: doCampo(f.availableUntil) });

  return (
    <Dialogo
      aberto
      aoFechar={aoFechar}
      largura="max-w-3xl"
      titulo={item ? `Editar "${item.title}"` : "Novo item"}
      rodape={
        <>
          <Botao variante="fantasma" onClick={aoFechar}>Cancelar</Botao>
          <Botao
            variante="primario"
            disabled={!f.title.trim()}
            carregando={enviando}
            onClick={async () => {
              setEnviando(true);
              setErro("");
              try {
                const corpo = { ...f, price: Math.max(0, Math.trunc(Number(f.price) || 0)), availableFrom: doCampo(f.availableFrom), availableUntil: doCampo(f.availableUntil) };
                await pedir(item ? `/admin/loja/itens/${item.id}` : "/admin/loja/itens", { method: item ? "PATCH" : "POST", json: corpo });
                invalidar(CHAVE_ITENS);
                avisar(item ? "Item salvo." : "Item criado.");
                aoFechar();
              } catch (e) {
                setErro(e instanceof Error ? e.message : "Não foi possível salvar.");
              } finally {
                setEnviando(false);
              }
            }}
          >
            Salvar
          </Botao>
        </>
      }
    >
      <div className="grid gap-5 md:grid-cols-[1fr_240px]">
        <div className="space-y-3">
          <Rotulo texto="Nome"><Entrada value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} maxLength={80} autoFocus /></Rotulo>
          <Rotulo texto="Descrição"><AreaDeTexto value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} maxLength={300} className="min-h-16" /></Rotulo>
          <div className="grid grid-cols-2 gap-3">
            <Rotulo texto="Preço (rupees)"><Entrada inputMode="numeric" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value.replace(/\D/g, "") })} /></Rotulo>
            <Rotulo texto="Efeito">
              <Escolha value={f.effect} onChange={(e) => setF({ ...f, effect: e.target.value as EfeitoDaLoja })}>
                {EFEITOS.map((x) => <option key={x.efeito} value={x.efeito}>{x.nome}</option>)}
              </Escolha>
            </Rotulo>
          </div>
          <div className="rounded-lg border p-3">
            <p className="mb-2 text-xs font-bold text-muted-foreground">Janela de venda (opcional) — para item por tempo limitado</p>
            <div className="grid grid-cols-2 gap-3">
              <Rotulo texto="Começa em"><Entrada type="datetime-local" value={f.availableFrom} onChange={(e) => setF({ ...f, availableFrom: e.target.value })} /></Rotulo>
              <Rotulo texto="Acaba em"><Entrada type="datetime-local" value={f.availableUntil} onChange={(e) => setF({ ...f, availableUntil: e.target.value })} /></Rotulo>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-bold">
            <Interruptor rotulo="Na loja" ligado={f.active} aoMudar={(v) => setF({ ...f, active: v })} /> Na loja
          </label>
          {erro && <p role="alert" className="text-sm font-bold text-rose-600 dark:text-rose-400">{erro}</p>}
        </div>
        <Previa titulo="Como aparece na loja" situacao={<Selo tom={s.tom}>{s.texto}</Selo>}>
          <article className="overflow-hidden rounded-[20px] border bg-card">
            <div className="grid h-24 place-items-center bg-emerald-500/10"><IconeDoEfeito efeito={f.effect} className="size-10 text-amber-400" /></div>
            <div className="p-4">
              <span className="text-[0.62rem] font-black uppercase tracking-[0.1em] text-amber-400">Power-up</span>
              <h2 className="mt-1 font-black leading-snug">{f.title || "Nome do item"}</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.description || "A descrição aparece aqui."}</p>
              <div className="mt-4 flex items-center justify-between">
                <b className="flex items-center gap-1.5 font-black text-emerald-500"><Rupee className="size-4" />{Number(f.price) || 0}</b>
                <span className="rounded-xl bg-primary px-4 py-2.5 text-[0.72rem] font-black uppercase tracking-[0.06em] text-primary-foreground">Comprar</span>
              </div>
            </div>
          </article>
        </Previa>
      </div>
    </Dialogo>
  );
}

function Previa({ titulo, situacao: s, children }: { titulo: string; situacao?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-bold text-muted-foreground">{titulo}</p>
        {s}
      </div>
      <div className="pointer-events-none select-none">{children}</div>
    </div>
  );
}

// ── Cosméticos ───────────────────────────────────────────────────────────

const TIPOS_DE_COSMETICO: { tipo: TipoDeCosmetico; nome: string; cor: string }[] = [
  { tipo: "THEME", nome: "Tema", cor: "text-sky-400" },
  { tipo: "AVATAR", nome: "Avatar", cor: "text-violet-400" },
  { tipo: "BANNER", nome: "Banner", cor: "text-pink-400" },
];

function VitrineDoCosmetico({ kind, value, className }: { kind: TipoDeCosmetico; value: Cosmetico["value"]; className?: string }) {
  if (kind === "THEME") {
    return (
      <div className={cn("flex", className)}>
        {[value.primary, value.accent].map((c, i) => <span key={i} className="flex-1" style={{ background: c ?? "#1892ff" }} />)}
      </div>
    );
  }
  if (kind === "BANNER") return <div className={className} style={{ background: value.gradient ?? "linear-gradient(135deg,#0284c7,#8b5cf6)" }} />;
  return (
    <div className={cn("grid place-items-center bg-violet-500/10", className)}>
      <AvatarIcon id={value.avatarId} className="size-8 text-violet-400" />
    </div>
  );
}

function Cosmeticos({ aoEditar }: { aoEditar: (c: Cosmetico) => void }) {
  const { dados, erro, recarregar, atualizando } = useDados<Cosmetico[]>(CHAVE_COSMETICOS);

  const ligar = async (c: Cosmetico, active: boolean) => {
    trocarNoCache<Cosmetico[]>(CHAVE_COSMETICOS, (l) => (l ?? []).map((x) => (x.id === c.id ? { ...x, active } : x)));
    try {
      await pedir(`/admin/loja/cosmeticos/${c.id}`, { method: "PATCH", json: { active } });
    } catch (e) {
      avisar(e instanceof Error ? e.message : "Não foi possível salvar.", { tom: "erro" });
    } finally {
      invalidar(CHAVE_COSMETICOS);
    }
  };

  if (erro && !dados) return <Erro tentarDeNovo={recarregar}>{erro}</Erro>;
  if (!dados) return <Esqueleto linhas={6} />;
  if (!dados.length) return <Vazio titulo="Nenhum cosmético" icone={<ShoppingBag className="size-5" />} />;

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", atualizando && "opacity-70")}>
      {dados.map((c) => {
        const tipo = TIPOS_DE_COSMETICO.find((t) => t.tipo === c.kind)!;
        return (
          <article key={c.id} className={cn("overflow-hidden rounded-xl border bg-card", !c.active && "opacity-60")}>
            <VitrineDoCosmetico kind={c.kind} value={c.value} className="h-20" />
            <div className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className={cn("text-[0.62rem] font-black uppercase tracking-[0.1em]", tipo.cor)}>{tipo.nome}</span>
                  <p className="truncate font-black">{c.name}</p>
                </div>
                <Interruptor rotulo={`${c.name} na loja`} ligado={c.active} aoMudar={(v) => ligar(c, v)} />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1 font-black text-emerald-600 dark:text-emerald-400"><Rupee className="size-3.5" />{numero(c.price)}</span>
                <span className="text-muted-foreground"><b className="text-foreground">{numero(c.vendas)}</b> vendidos · {numero(c.vendas30)} em 30 dias</span>
              </div>
              <div className="mt-2 flex justify-end gap-1">
                <Botao tamanho="sm" variante="fantasma" icone={<Pencil className="size-3.5" />} onClick={() => aoEditar(c)}>Editar</Botao>
                <Botao
                  tamanho="sm"
                  variante="fantasma"
                  icone={<Trash2 className="size-3.5" />}
                  onClick={async () => {
                    if (c.vendas > 0 && !(await perguntar({ titulo: `Apagar "${c.name}"?`, texto: `${numero(c.vendas)} ${c.vendas === 1 ? "pessoa comprou e perde" : "pessoas compraram e perdem"} o item. Para só tirar da loja, desligue em vez de apagar.`, sim: "Apagar mesmo assim", perigoso: true }))) return;
                    const antes = dados;
                    apagarComDesfazer({
                      texto: `"${c.name}" apagado.`,
                      tirarDaTela: () => trocarNoCache<Cosmetico[]>(CHAVE_COSMETICOS, (l) => (l ?? []).filter((x) => x.id !== c.id)),
                      restaurar: () => trocarNoCache<Cosmetico[]>(CHAVE_COSMETICOS, () => antes),
                      executar: () => pedir(`/admin/loja/cosmeticos/${c.id}`, { method: "DELETE" }).then(() => invalidar(CHAVE_COSMETICOS)),
                    });
                  }}
                  aria-label={`Apagar ${c.name}`}
                />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function EditorDeCosmetico({ cosmetico, aoFechar }: { cosmetico: Cosmetico | null; aoFechar: () => void }) {
  const [kind, setKind] = useState<TipoDeCosmetico>(cosmetico?.kind ?? "THEME");
  const [name, setName] = useState(cosmetico?.name ?? "");
  const [description, setDescription] = useState(cosmetico?.description ?? "");
  const [price, setPrice] = useState(String(cosmetico?.price ?? 150));
  const [active, setActive] = useState(cosmetico?.active ?? true);
  const [primary, setPrimary] = useState(cosmetico?.value.primary ?? "#0284c7");
  const [accent, setAccent] = useState(cosmetico?.value.accent ?? "#0ea5e9");
  const [gradient, setGradient] = useState(cosmetico?.value.gradient ?? "linear-gradient(135deg, #14b8a6, #8b5cf6)");
  const [avatarId, setAvatarId] = useState(cosmetico?.value.avatarId ?? AVATARES[0].id);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const value = kind === "THEME" ? { primary, accent } : kind === "BANNER" ? { gradient } : { avatarId };

  return (
    <Dialogo
      aberto
      aoFechar={aoFechar}
      largura="max-w-3xl"
      titulo={cosmetico ? `Editar "${cosmetico.name}"` : "Novo cosmético"}
      rodape={
        <>
          <Botao variante="fantasma" onClick={aoFechar}>Cancelar</Botao>
          <Botao
            variante="primario"
            disabled={!name.trim()}
            carregando={enviando}
            onClick={async () => {
              setEnviando(true);
              setErro("");
              try {
                const corpo = { name, description, price: Math.trunc(Number(price) || 0), active, value, ...(cosmetico ? {} : { kind }) };
                await pedir(cosmetico ? `/admin/loja/cosmeticos/${cosmetico.id}` : "/admin/loja/cosmeticos", { method: cosmetico ? "PATCH" : "POST", json: corpo });
                invalidar(CHAVE_COSMETICOS);
                avisar(cosmetico ? "Cosmético salvo." : "Cosmético criado.");
                aoFechar();
              } catch (e) {
                setErro(e instanceof Error ? e.message : "Não foi possível salvar.");
              } finally {
                setEnviando(false);
              }
            }}
          >
            Salvar
          </Botao>
        </>
      }
    >
      <div className="grid gap-5 md:grid-cols-[1fr_240px]">
        <div className="space-y-3">
          {!cosmetico && (
            <Segmentado<TipoDeCosmetico> rotulo="Tipo" valor={kind} aoMudar={setKind} opcoes={TIPOS_DE_COSMETICO.map((t) => ({ valor: t.tipo, texto: t.nome }))} />
          )}
          <Rotulo texto="Nome"><Entrada value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoFocus /></Rotulo>
          <Rotulo texto="Descrição"><Entrada value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} /></Rotulo>
          <Rotulo texto="Preço (rupees)"><Entrada inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} className="w-32" /></Rotulo>
          {kind === "THEME" && (
            <div className="grid grid-cols-2 gap-3">
              <Rotulo texto="Cor principal"><input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} className="h-9 w-full cursor-pointer rounded-lg border bg-background" /></Rotulo>
              <Rotulo texto="Cor de destaque"><input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-9 w-full cursor-pointer rounded-lg border bg-background" /></Rotulo>
            </div>
          )}
          {kind === "BANNER" && (
            <Rotulo texto="Cor ou gradiente" dica='Ex.: linear-gradient(135deg, #14b8a6, #8b5cf6) ou #1d4ed8'>
              <Entrada value={gradient} onChange={(e) => setGradient(e.target.value)} className="font-mono text-xs" />
            </Rotulo>
          )}
          {kind === "AVATAR" && (
            <div>
              <p className="mb-1 text-xs font-bold text-muted-foreground">Avatar</p>
              <div className="grid grid-cols-6 gap-1.5">
                {AVATARES.map((a) => (
                  <button key={a.id} type="button" onClick={() => setAvatarId(a.id)} aria-pressed={avatarId === a.id} title={a.label} className={cn("flex aspect-square items-center justify-center rounded-lg border text-lg", avatarId === a.id ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted")}>
                    <AvatarIcon id={a.id} className="size-[1.1em]" />
                  </button>
                ))}
              </div>
            </div>
          )}
          <label className="flex items-center gap-2 text-sm font-bold"><Interruptor rotulo="Na loja" ligado={active} aoMudar={setActive} /> Na loja</label>
          {erro && <p role="alert" className="text-sm font-bold text-rose-600 dark:text-rose-400">{erro}</p>}
        </div>
        <Previa titulo="Como aparece na loja">
          <article className="overflow-hidden rounded-[20px] border bg-card">
            <VitrineDoCosmetico kind={kind} value={value} className="h-24" />
            <div className="p-4">
              <span className={cn("text-[0.62rem] font-black uppercase tracking-[0.1em]", TIPOS_DE_COSMETICO.find((t) => t.tipo === kind)!.cor)}>{TIPOS_DE_COSMETICO.find((t) => t.tipo === kind)!.nome}</span>
              <h2 className="mt-1 font-black leading-snug">{name || "Nome do cosmético"}</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{description || "A descrição aparece aqui."}</p>
              <div className="mt-4 flex items-center justify-between">
                <b className="flex items-center gap-1.5 font-black text-emerald-500"><Rupee className="size-4" />{Number(price) || 0}</b>
                <span className="rounded-xl bg-primary px-4 py-2.5 text-[0.72rem] font-black uppercase tracking-[0.06em] text-primary-foreground">Comprar</span>
              </div>
            </div>
          </article>
        </Previa>
      </div>
    </Dialogo>
  );
}
