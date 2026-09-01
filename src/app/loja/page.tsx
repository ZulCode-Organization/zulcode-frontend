"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Coins,
  Feather,
  Check,
  Gift,
  History,
  LockKeyhole,
  Palette,
  ShieldCheck,
  Sparkles,
  UserRound,
  Zap,
  HeartPulse,
  CircleDollarSign,
} from "lucide-react";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { usePerfil } from "@/hooks/use-perfil";
import { AppShell } from "@/components/app-shell/app-shell";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";
import { AvatarIcon } from "@/components/shared/avatar-icon";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  title: string;
  description: string;
  price: number;
  effect: "RECOVER_LIVES" | "FREEZE_STREAK" | "DOUBLE_XP" | "FEATHER_SHIELD" | "DOUBLE_COINS" | "HEAL_ONE_LIFE";
};
type Kind = "THEME" | "AVATAR" | "BANNER";
type Cosmetic = {
  id: string;
  name: string;
  description: string;
  kind: Kind;
  price: number;
  owned: boolean;
  equipped?: boolean;
  value: {
    primary?: string;
    accent?: string;
    gradient?: string;
    imageUrl?: string;
    avatarId?: string;
  };
};
type Category = "ALL" | "POWER" | Kind;
type Ownership = "ALL" | "AVAILABLE" | "OWNED";
type Transaction = { id: string; amount: number; reason: string };
const categories: { value: Category; label: string; Icon: typeof Sparkles }[] =
  [
    { value: "ALL", label: "Todos", Icon: Sparkles },
    { value: "THEME", label: "Temas", Icon: Palette },
    { value: "AVATAR", label: "Avatares", Icon: UserRound },
    { value: "BANNER", label: "Banners", Icon: Gift },
    { value: "POWER", label: "Power-ups", Icon: Zap },
  ];
const powerIcon = (effect: Item["effect"]) =>
  effect === "RECOVER_LIVES"
    ? Feather
    : effect === "FREEZE_STREAK"
    ? ShieldCheck
    : effect === "FEATHER_SHIELD"
    ? ShieldCheck
    : effect === "DOUBLE_COINS"
    ? CircleDollarSign
    : effect === "HEAL_ONE_LIFE"
    ? HeartPulse
    : Zap;

function Store() {
  const { perfil, retry } = usePerfil();
  const [items, setItems] = useState<Item[]>([]);
  const [cosmetics, setCosmetics] = useState<Cosmetic[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [category, setCategory] = useState<Category>("ALL");
  const [ownership, setOwnership] = useState<Ownership>("ALL");
  const [working, setWorking] = useState<string | null>(null);
  const [notice, setNotice] = useState<{
    title: string;
    message: string;
    error?: boolean;
  } | null>(null);
  const load = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    const [a, b, c] = await Promise.all([
      fetchComTimeout(`${API_BASE_URL}/user/zulcoins/items`, { headers }),
      fetchComTimeout(`${API_BASE_URL}/user/zulcoins/cosmetics`, { headers }),
      fetchComTimeout(`${API_BASE_URL}/user/zulcoins/history`, { headers }),
    ]);
    if (a.ok) setItems(await a.json());
    if (b.ok) {
      const dados = await b.json();
      setCosmetics(dados.map((item: Cosmetic) => ({ ...item, kind: String(item.kind).toUpperCase() as Kind })));
    }
    if (c.ok) setTransactions((await c.json()).transactions ?? []);
  };
  useEffect(() => {
    load().catch(() => undefined);
  }, []);
  const xpActive = !!(
    perfil?.doubleXpUntil && new Date(perfil.doubleXpUntil) > new Date()
  );
  const visibleCosmetics = useMemo(
    () =>
      cosmetics.filter(
        (item) =>
          (category === "ALL" || category === item.kind) &&
          (ownership === "ALL" ||
            (ownership === "OWNED" ? item.owned : !item.owned))
      ),
    [category, cosmetics, ownership]
  );
  // Poderes são consumíveis, não entram em "Comprados" (que representa o
  // inventário permanente: temas, avatares e banners adquiridos).
  const visibleItems =
    ownership === "OWNED" || (category !== "ALL" && category !== "POWER")
      ? []
      : items;
  const count = (categoryValue: Category) =>
    categoryValue === "ALL"
      ? items.length + cosmetics.length
      : categoryValue === "POWER"
      ? items.length
      : cosmetics.filter((item) => item.kind === categoryValue).length;
  const send = async (id: string, url: string, body?: object) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;
    setWorking(id);
    try {
      const res = await fetchComTimeout(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok)
        throw new Error(data?.message ?? "Não foi possível concluir.");
      await Promise.all([load(), Promise.resolve(retry())]);
      return data;
    } catch (error) {
      setNotice({
        title: "Não foi possível concluir",
        message: error instanceof Error ? error.message : "Tente novamente.",
        error: true,
      });
      return null;
    } finally {
      setWorking(null);
    }
  };
  const buyPower = async (item: Item) => {
    if ((perfil?.moedas ?? 0) < item.price)
      return setNotice({
        title: "Saldo insuficiente",
        message: `Você tem ${perfil?.moedas ?? 0} moedas e este item custa ${
          item.price
        }.`,
        error: true,
      });
    const data = await send(item.id, `${API_BASE_URL}/user/zulcoins/spend`, {
      itemId: item.id,
    });
    if (data)
      setNotice({
        title: "Power-up ativado",
        message: data.message ?? "O benefício já está disponível.",
      });
  };
  const cosmeticAction = async (item: Cosmetic) => {
    if (!item.owned && (perfil?.moedas ?? 0) < item.price)
      return setNotice({
        title: "Saldo insuficiente",
        message: `Você tem ${perfil?.moedas ?? 0} moedas e este item custa ${
          item.price
        }.`,
        error: true,
      });
    const data = await send(
      item.id,
      `${API_BASE_URL}/user/zulcoins/cosmetics/${item.id}/${
        item.owned ? "equip" : "buy"
      }`
    );
    if (data)
      setNotice({
        title: item.owned ? "Item em uso" : "Item comprado",
        message: item.owned
          ? "Sua personalização foi aplicada."
          : "Agora ele está disponível para usar.",
      });
  };
  return (
    <div className="mx-auto max-w-[1240px] pb-5 pt-1 sm:pb-7 sm:pt-2">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_270px]">
        <main className="min-w-0">
          {/* Cabeçalho com o saldo em destaque: numa loja, quanto se tem é a
              primeira informação que importa — antes ela só existia na barra
              de status lá em cima. */}
          <header className="mb-4 flex items-center justify-between gap-3 rounded-[18px] border border-border bg-card px-4 py-3 sm:mb-5 sm:rounded-[20px] sm:px-5 sm:py-4">
            <div className="min-w-0">
              <h1 className="text-xl font-black tracking-tight sm:text-2xl">Loja</h1>
              <p className="mt-0.5 hidden text-sm text-muted-foreground sm:block">
                Troque suas moedas por power-ups e personalizações
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 rounded-xl bg-amber-400/10 px-3 py-2 sm:gap-2 sm:rounded-2xl sm:px-4 sm:py-2.5">
              <Coins className="size-5 text-amber-400 sm:size-6" />
              <span className="text-lg font-black text-amber-400 sm:text-xl">
                {perfil?.moedas?.toLocaleString("pt-BR") ?? "—"}
              </span>
            </div>
          </header>
          <div className="flex flex-wrap gap-2 pb-1 xl:hidden">
            {categories.map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setCategory(value)}
                className={cn(
                  "zc-press inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-black transition-colors duration-150 sm:px-4 sm:text-sm",
                  category === value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                <Icon className="size-3.5" />
                {label}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[0.65rem]",
                    category === value ? "bg-black/20" : "bg-muted"
                  )}
                >
                  {count(value)}
                </span>
              </button>
            ))}
          </div>
          {category !== "POWER" && (
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-muted-foreground">
              <span className="w-full py-1 sm:w-auto">Mostrar:</span>
              <div className="grid flex-1 grid-cols-3 gap-1.5 sm:flex sm:flex-none sm:gap-2">
              {[
                ["ALL", "todos"],
                ["AVAILABLE", "não comprados"],
                ["OWNED", "comprados"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setOwnership(value as Ownership)}
                  className={`rounded-lg px-2 py-1.5 text-center ${
                    ownership === value
                      ? "bg-primary/15 text-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
              </div>
            </div>
          )}
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ownership !== "OWNED" &&
              visibleItems.map((item) => (
                <PowerCard
                  key={item.id}
                  item={item}
                  working={working}
                  disabled={item.effect === "DOUBLE_XP" && xpActive}
                  onBuy={buyPower}
                />
              ))}
            {visibleCosmetics.map((item) => (
              <CosmeticCard
                key={item.id}
                item={item}
                working={working}
                onAction={cosmeticAction}
              />
            ))}
            {!visibleItems.length && !visibleCosmetics.length && (
              <div className="col-span-full flex flex-col items-center gap-3 rounded-[20px] border border-dashed border-border px-6 py-12 text-center">
                <Sparkles className="size-8 text-muted-foreground/50" />
                <p className="text-sm font-black text-foreground">Nada por aqui com esse filtro</p>
                <button
                  type="button"
                  onClick={() => { setCategory("ALL"); setOwnership("ALL"); }}
                  className="text-[0.78rem] font-black uppercase tracking-[0.06em] text-primary transition-opacity duration-150 hover:opacity-70"
                >
                  Ver a loja inteira
                </button>
              </div>
            )}
          </div>
        </main>
        <aside className="space-y-5 xl:border-l xl:border-border xl:pl-5">
          <section>
            <p className="px-1 text-xs font-black uppercase tracking-wider text-muted-foreground">
              Categorias
            </p>
            <div className="mt-2 space-y-1">
              {categories.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCategory(value)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-bold ${
                    category === value
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span>{label}</span>
                  <span className="text-xs">{count(value)}</span>
                </button>
              ))}
            </div>
          </section>
          <section className="rounded-2xl border border-border bg-card p-5">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
              <History className="size-4" />
              Histórico
            </p>
            {transactions.length ? (
              <div className="mt-3 space-y-3">
                {transactions.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="border-b border-border pb-2 last:border-0"
                  >
                    <p className="text-xs font-bold">{item.reason}</p>
                    <span
                      className={
                        item.amount < 0
                          ? "text-xs text-rose-400"
                          : "text-xs text-emerald-400"
                      }
                    >
                      {item.amount > 0 ? "+" : ""}
                      {item.amount} moedas
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 flex gap-3 text-xs text-muted-foreground">
                <LockKeyhole className="size-5 shrink-0" />
                Faça sua primeira compra para ver o histórico.
              </div>
            )}
          </section>
        </aside>
      </div>
      {notice && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="animate-pop-in w-full max-w-sm rounded-3xl border border-border bg-card p-6 text-center shadow-2xl">
            <span
              className={cn(
                "mx-auto grid size-14 place-items-center rounded-2xl",
                notice.error ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-500"
              )}
            >
              {notice.error ? <LockKeyhole className="size-7" /> : <Check className="size-8" strokeWidth={3} />}
            </span>
            <h2 className={cn("mt-4 text-xl font-black", notice.error ? "text-destructive" : "text-foreground")}>
              {notice.title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{notice.message}</p>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="zc-press zc-press-shadow mt-6 w-full rounded-2xl bg-primary py-3.5 text-[0.8rem] font-black uppercase tracking-[0.06em] text-primary-foreground"
              style={{ ["--zc-press-color" as string]: "rgba(0,0,0,0.32)" }}
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
function PowerCard({
  item,
  working,
  disabled,
  onBuy,
}: {
  item: Item;
  working: string | null;
  disabled: boolean;
  onBuy: (item: Item) => void;
}) {
  const Icon = powerIcon(item.effect);
  return (
    <article className="animate-fade-in-up group flex flex-row overflow-hidden rounded-[18px] border border-border bg-card transition-colors duration-200 hover:border-primary/50 sm:min-h-56 sm:flex-col sm:rounded-[20px]">
      {/* Vitrine: o ícone grande sobre o âmbar da moeda, que é a cor do
          power-up no app inteiro. */}
      <div className="relative grid w-[86px] shrink-0 place-items-center bg-amber-400/10 sm:h-24 sm:w-auto">
        <Icon className="size-8 text-amber-400 transition-transform duration-200 group-hover:scale-110 sm:size-10" />
        {disabled && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[0.6rem] font-black uppercase tracking-[0.06em] text-white">
            <Check className="size-3" strokeWidth={3} />
            Ativo
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
        <span className="text-[0.62rem] font-black uppercase tracking-[0.1em] text-amber-400">Power-up</span>
        <h2 className="mt-1 font-black leading-snug">{item.title}</h2>
        <p className="mt-1 line-clamp-2 flex-1 text-[0.7rem] leading-relaxed text-muted-foreground sm:mt-1.5 sm:line-clamp-none sm:text-xs">{item.description}</p>

        <div className="mt-2.5 flex items-center justify-between gap-2 sm:mt-4 sm:gap-3">
          <b className="flex items-center gap-1.5 text-[0.95rem] font-black text-amber-400">
            <Coins className="size-4" />
            {item.price}
          </b>
          <button
            type="button"
            disabled={working !== null || disabled}
            onClick={() => onBuy(item)}
            className="zc-press zc-press-shadow shrink-0 rounded-xl bg-primary px-3 py-2 text-[0.68rem] font-black uppercase tracking-[0.06em] text-primary-foreground disabled:opacity-50 disabled:shadow-none sm:px-4 sm:py-2.5 sm:text-[0.72rem]"
            style={{ ["--zc-press-color" as string]: "rgba(0,0,0,0.32)" }}
          >
            {disabled ? "Ativo" : working === item.id ? "…" : "Comprar"}
          </button>
        </div>
      </div>
    </article>
  );
}
function CosmeticCard({
  item,
  working,
  onAction,
}: {
  item: Cosmetic;
  working: string | null;
  onAction: (item: Cosmetic) => void;
}) {
  const rotulo = item.kind === "THEME" ? "Tema" : item.kind === "AVATAR" ? "Avatar" : "Banner";
  const corDoTipo =
    item.kind === "THEME" ? "text-sky-400" : item.kind === "AVATAR" ? "text-violet-400" : "text-pink-400";

  return (
    <article className="animate-fade-in-up group flex flex-row overflow-hidden rounded-[18px] border border-border bg-card transition-colors duration-200 hover:border-primary/50 sm:min-h-56 sm:flex-col sm:rounded-[20px]">
      {/* Vitrine alta: o tema e o banner aparecem no tamanho de verdade, em vez
          da faixa de 48px de antes, onde não dava pra julgar a cor. */}
      <div className="relative w-[86px] shrink-0 overflow-hidden sm:h-24 sm:w-auto">
        {item.kind === "THEME" ? (
          <div className="flex h-full w-full">
            {[item.value.primary, item.value.accent].map((color) => (
              <span key={color} className="flex-1" style={{ background: color }} />
            ))}
          </div>
        ) : item.kind === "BANNER" ? (
          <div
            className="h-full w-full"
            style={{ background: item.value.imageUrl ? `url(${item.value.imageUrl}) center / cover` : item.value.gradient ?? "linear-gradient(135deg,#0284c7,#8b5cf6)" }}
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-violet-500/10">
            <AvatarIcon
              id={item.value.avatarId}
              className="size-8 text-violet-400 transition-transform duration-200 group-hover:scale-110 sm:size-10"
            />
          </div>
        )}

        {(item.equipped || item.owned) && (
          <span
            className={cn(
              "absolute right-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.6rem] font-black uppercase tracking-[0.06em] text-white",
              item.equipped ? "bg-emerald-500" : "bg-black/55"
            )}
          >
            <Check className="size-3" strokeWidth={3} />
            {item.equipped ? "Em uso" : "Seu"}
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
        <span className={cn("text-[0.62rem] font-black uppercase tracking-[0.1em]", corDoTipo)}>{rotulo}</span>
        <h2 className="mt-1 font-black leading-snug">{item.name}</h2>
        <p className="mt-1 line-clamp-2 flex-1 text-[0.7rem] leading-relaxed text-muted-foreground sm:mt-1.5 sm:line-clamp-none sm:text-xs">{item.description}</p>

        <div className="mt-2.5 flex items-center justify-between gap-2 sm:mt-4 sm:gap-3">
          {/* Já comprado: o preço deixa de ser cobrança e vira histórico. */}
          <b
            className={cn(
              "flex items-center gap-1.5 text-[0.95rem] font-black",
              item.owned ? "text-muted-foreground line-through" : "text-amber-400"
            )}
          >
            <Coins className="size-4" />
            {item.price}
          </b>
          <button
            type="button"
            disabled={working !== null || item.equipped}
            onClick={() => onAction(item)}
            className="zc-press zc-press-shadow shrink-0 rounded-xl bg-primary px-3 py-2 text-[0.68rem] font-black uppercase tracking-[0.06em] text-primary-foreground disabled:opacity-50 disabled:shadow-none sm:px-4 sm:py-2.5 sm:text-[0.72rem]"
            style={{ ["--zc-press-color" as string]: "rgba(0,0,0,0.32)" }}
          >
            {item.equipped ? "Em uso" : working === item.id ? "…" : item.owned ? "Usar" : "Comprar"}
          </button>
        </div>
      </div>
    </article>
  );
}
export default function LojaPage() {
  useRequireAuth();
  return (
    <AppShell contentClassName="max-w-none">
      <Store />
    </AppShell>
  );
}
