"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Coins,
  Feather,
  Gift,
  History,
  LockKeyhole,
  Palette,
  ShieldCheck,
  Sparkles,
  UserRound,
  Zap,
} from "lucide-react";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { usePerfil } from "@/hooks/use-perfil";
import { AppShell } from "@/components/app-shell/app-shell";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";
import { AvatarIcon } from "@/components/shared/avatar-icon";
import { ProBanner } from "@/components/loja/pro-banner";

type Item = {
  id: string;
  title: string;
  description: string;
  price: number;
  effect: "RECOVER_LIVES" | "FREEZE_STREAK" | "DOUBLE_XP";
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
    <div className="mx-auto max-w-[1240px] py-7">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_270px]">
        <main className="min-w-0">
          <header className="mb-5">
            <h1 className="text-2xl font-black tracking-tight">LOJA</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Gaste suas moedas em itens exclusivos
            </p>
          </header>
          {!perfil?.isPro && <ProBanner />}
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1 xl:hidden">
            {categories.map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setCategory(value)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-black ${
                  category === value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>
          {category !== "POWER" && (
            <div className="mt-4 flex gap-2 text-xs font-bold text-muted-foreground">
              <span className="py-1.5">Mostrar:</span>
              {[
                ["ALL", "todos"],
                ["AVAILABLE", "não comprados"],
                ["OWNED", "comprados"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setOwnership(value as Ownership)}
                  className={`rounded-lg px-2.5 py-1.5 ${
                    ownership === value
                      ? "bg-primary/15 text-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleItems.map((item) => (
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
              <p className="col-span-full rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Nenhum item encontrado nesse filtro.
              </p>
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
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 text-center shadow-2xl">
            <h2
              className={`text-xl font-black ${
                notice.error ? "text-rose-500" : "text-primary"
              }`}
            >
              {notice.title}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {notice.message}
            </p>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="mt-6 w-full rounded-xl bg-primary py-3 font-black text-primary-foreground"
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
    <article className="flex min-h-48 flex-col rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/50">
      <span className="grid size-12 place-items-center rounded-xl bg-amber-400/15 text-amber-400">
        <Icon className="size-6" />
      </span>
      <span className="mt-4 text-[0.65rem] font-black uppercase tracking-wider text-muted-foreground">
        Power-up
      </span>
      <h2 className="mt-1 font-black">{item.title}</h2>
      <p className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">
        {item.description}
      </p>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <b className="flex items-center gap-1.5 text-sm text-amber-400">
          <Coins className="size-3.5" />
          {item.price}
        </b>
        <button
          type="button"
          disabled={working !== null || disabled}
          onClick={() => onBuy(item)}
          className="rounded-lg bg-primary px-3 py-2 text-xs font-black text-primary-foreground disabled:opacity-50"
        >
          {disabled ? "Ativo" : working === item.id ? "…" : "Comprar"}
        </button>
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
  return (
    <article className="flex min-h-48 flex-col rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/50">
      <div className="flex h-12 items-center justify-center overflow-hidden rounded-xl">
        {item.kind === "THEME" ? (
          <div className="flex h-full w-full">
            {[item.value.primary, item.value.accent].map((color) => (
              <span
                key={color}
                className="flex-1"
                style={{ background: color }}
              />
            ))}
          </div>
        ) : item.kind === "BANNER" ? (
          <div
            className="h-full w-full"
            style={{
              background:
                item.value.gradient ??
                "linear-gradient(135deg,#0284c7,#8b5cf6)",
            }}
          />
        ) : (
          <span className="grid size-12 place-items-center rounded-xl bg-violet-500/15 text-violet-400">
            <AvatarIcon id={item.value.avatarId} className="size-6" />
          </span>
        )}
      </div>
      <span className="mt-4 text-[0.65rem] font-black uppercase tracking-wider text-muted-foreground">
        {item.kind === "THEME"
          ? "Tema"
          : item.kind === "AVATAR"
          ? "Avatar"
          : "Banner"}
      </span>
      <h2 className="mt-1 font-black">{item.name}</h2>
      <p className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">
        {item.description}
      </p>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <b className="flex items-center gap-1.5 text-sm text-amber-400">
          <Coins className="size-3.5" />
          {item.price}
        </b>
        <button
          type="button"
          disabled={working !== null || item.equipped}
          onClick={() => onAction(item)}
          className="rounded-lg bg-primary px-3 py-2 text-xs font-black text-primary-foreground disabled:opacity-50"
        >
          {item.equipped
            ? "Comprado"
            : working === item.id
            ? "…"
            : item.owned
            ? "Usar"
            : "Comprar"}
        </button>
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
