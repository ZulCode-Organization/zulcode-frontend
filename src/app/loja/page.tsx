"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Check, History, LockKeyhole } from "lucide-react";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { usePerfil } from "@/hooks/use-perfil";
import { AppShell } from "@/components/app-shell/app-shell";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";
import { reagir } from "@/lib/reacoes";
import { Rupee } from "@/components/shared/rupee";
import { AvatarIcon } from "@/components/shared/avatar-icon";
import { Carrossel } from "@/components/shared/carrossel";
import { COR_DO_ITEM, IconeDoItem, type EfeitoDoItem } from "@/components/shared/icone-do-item";
import { GasOfensiva } from "@/components/shared/gas-ofensiva";
import { DuoEscudo, DuoFimDeSemana, DuoXp } from "@/components/shared/icone-duo";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  title: string;
  description: string;
  price: number;
  effect: EfeitoDoItem;
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
type Transaction = { id: string; amount: number; reason: string };
type Aviso = { title: string; message: string; error?: boolean };

/** Em qual seção cada power-up aparece: a mesma divisão do painel de rupees da barra de cima. */
const SECOES: { titulo: string; efeitos: EfeitoDoItem[] }[] = [
  { titulo: "Penas", efeitos: ["RECOVER_LIVES", "HEAL_ONE_LIFE", "FEATHER_SHIELD"] },
  { titulo: "Ofensiva", efeitos: ["FREEZE_STREAK", "WEEKEND_FREE"] },
  { titulo: "Superpoderes", efeitos: ["DOUBLE_XP", "DOUBLE_COINS"] },
];

/** Quanto dura um superpoder: a barrinha do "Valendo agora" mede o que falta disso. */
const DURACAO_DO_PODER_MS = 30 * 60 * 1000;

/** A cor de fundo do avatar na loja, por id. Os que não estão aqui ficam violeta. */
const COR_DO_AVATAR: Record<string, string> = {
  comet: "#6366f1", "neon-cat": "#ec4899", processor: "#0ea5e9", crystal: "#14b8a6", flame: "#f97316", arcade: "#8b5cf6",
};

const restante = (ate: string | null | undefined, agora: number) => (ate ? new Date(ate).getTime() - agora : 0);
const relogio = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

// ---------------------------------------------------------------------------
// Peças
// ---------------------------------------------------------------------------

/** O botão que já é o preço. Cinza quando não dá (sem saldo ou sem efeito), mas continua explicando ao tocar. */
function BotaoDePreco({ preco, apagado, ocupado, onClick }: { preco: number; apagado: boolean; ocupado: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={ocupado}
      aria-label={`Comprar por ${preco} rupees`}
      className={cn(
        "zc-press inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-[0.9rem] font-black",
        apagado ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground shadow-[inset_0_-3px_0_rgba(0,0,0,0.22)]",
      )}
    >
      <Rupee className={cn("size-4", apagado ? "text-muted-foreground" : "text-white")} />
      {ocupado ? "…" : preco}
    </button>
  );
}

function LinhaDePoder({
  item, saldo, ocupado, ativoAte, semEfeito, aoComprar,
}: {
  item: Item;
  saldo: number;
  ocupado: boolean;
  /** Superpoder valendo: o botão vira o tempo que falta. */
  ativoAte: number;
  /** Comprar agora não faria nada (ex.: penas cheias). */
  semEfeito: string | null;
  aoComprar: (item: Item) => void;
}) {
  const cor = COR_DO_ITEM[item.effect];
  return (
    <div className={cn("flex items-center gap-3 rounded-[18px] border border-border bg-card px-3 py-2.5", semEfeito && "opacity-70")}>
      <span className={cn("grid size-12 shrink-0 place-items-center rounded-full", cor.fundo, cor.cor)}>
        <IconeDoItem efeito={item.effect} className="size-7" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.95rem] font-black leading-snug">{item.title}</p>
        <p className="line-clamp-2 text-[0.76rem] leading-snug text-muted-foreground">{semEfeito ?? item.description}</p>
      </div>
      {ativoAte > 0 ? (
        <span className="shrink-0 rounded-xl bg-amber-500/15 px-2.5 py-2 text-[0.68rem] font-black uppercase tracking-[0.04em] text-amber-500">
          Ativo · {Math.ceil(ativoAte / 60000)} min
        </span>
      ) : (
        <BotaoDePreco preco={item.price} apagado={saldo < item.price || !!semEfeito} ocupado={ocupado} onClick={() => aoComprar(item)} />
      )}
    </div>
  );
}

/** A tela do app pintada com o tema: barra, cartão da unidade, trilha e botão. */
function MiniaturaDoTema({ primaria, destaque }: { primaria: string; destaque: string }) {
  return (
    <span aria-hidden className="relative block h-[118px] w-full rounded-xl border border-border bg-background p-2">
      <span className="mb-2 flex justify-between">
        <i className="h-1.5 w-4 rounded-full" style={{ background: primaria }} />
        <i className="h-1.5 w-4 rounded-full bg-orange-500" />
        <i className="h-1.5 w-4 rounded-full bg-emerald-500" />
      </span>
      <span className="block h-7 rounded-md p-1.5" style={{ background: primaria }}>
        <i className="mb-1 block h-1 w-4/5 rounded-full bg-white/60" />
        <i className="block h-1 w-1/2 rounded-full bg-white/60" />
      </span>
      <span className="mt-2 flex flex-col items-center gap-1.5">
        <i className="h-4 w-5 rounded-full shadow-[inset_0_-3px_0_rgba(0,0,0,0.25)]" style={{ background: destaque }} />
        <i className="ml-6 h-4 w-5 rounded-full shadow-[inset_0_-3px_0_rgba(0,0,0,0.25)]" style={{ background: primaria }} />
        <i className="ml-1.5 h-4 w-5 rounded-full bg-muted" />
      </span>
      <span className="absolute inset-x-3 bottom-2 h-2 rounded" style={{ background: destaque }} />
    </span>
  );
}

function AcaoDoCosmetico({ item, saldo, ocupado, aoAgir }: { item: Cosmetic; saldo: number; ocupado: boolean; aoAgir: (item: Cosmetic) => void }) {
  if (item.equipped) {
    return (
      <span className="inline-flex h-9 items-center gap-1 rounded-xl bg-emerald-500/15 px-3 text-[0.7rem] font-black uppercase tracking-[0.04em] text-emerald-500">
        <Check className="size-3.5" strokeWidth={3} /> Em uso
      </span>
    );
  }
  if (item.owned) {
    return (
      <button type="button" onClick={() => aoAgir(item)} disabled={ocupado} className="zc-press h-9 rounded-xl border-2 border-primary/40 px-4 text-[0.72rem] font-black uppercase tracking-[0.05em] text-primary">
        {ocupado ? "…" : "Usar"}
      </button>
    );
  }
  return <BotaoDePreco preco={item.price} apagado={saldo < item.price} ocupado={ocupado} onClick={() => aoAgir(item)} />;
}

function CartaoDeCosmetico({ item, saldo, ocupado, aoAgir }: { item: Cosmetic; saldo: number; ocupado: boolean; aoAgir: (item: Cosmetic) => void }) {
  const largo = item.kind === "BANNER";
  return (
    <div className={cn("flex shrink-0 snap-start flex-col items-center gap-2 rounded-[18px] border border-border bg-card p-2 pb-2.5 text-center", largo ? "w-[200px]" : "w-[124px]")}>
      {item.kind === "THEME" ? (
        <MiniaturaDoTema primaria={item.value.primary ?? "#1892ff"} destaque={item.value.accent ?? "#1892ff"} />
      ) : item.kind === "AVATAR" ? (
        <span className="grid h-[118px] w-full place-items-center">
          <span
            className="grid size-[76px] place-items-center rounded-full shadow-[inset_0_-5px_0_rgba(0,0,0,0.22)]"
            style={{ background: COR_DO_AVATAR[item.value.avatarId ?? ""] ?? "#8b5cf6" }}
          >
            <AvatarIcon id={item.value.avatarId} className="size-9 text-white" />
          </span>
        </span>
      ) : (
        <span className="relative mb-2 block h-[70px] w-full rounded-xl" style={{ background: item.value.imageUrl ? `url(${item.value.imageUrl}) center / cover` : item.value.gradient ?? "linear-gradient(135deg,#0284c7,#8b5cf6)" }}>
          <span className="absolute -bottom-2.5 left-2.5 size-7 rounded-lg border-[3px] border-card bg-primary" />
        </span>
      )}
      <span className="line-clamp-1 w-full text-[0.82rem] font-black">{item.name.replace(/^(Tema|Avatar|Banner)\s+/, "")}</span>
      <AcaoDoCosmetico item={item} saldo={saldo} ocupado={ocupado} aoAgir={aoAgir} />
    </div>
  );
}

/** O que está valendo agora. Some quando não há nada. */
function ValendoAgora({ agora, vertical = false, className }: { agora: number; vertical?: boolean; className?: string }) {
  const { perfil } = usePerfil();
  const xp = restante(perfil?.doubleXpUntil, agora);
  const rupees = restante(perfil?.doubleCoinsUntil, agora);
  const escudos = perfil?.escudos ?? 0;
  const gases = perfil?.streakFreezes ?? 0;
  const hoje = new Date(agora).toISOString().slice(0, 10);
  const fimDeSemana = (perfil?.protectedStreakDays ?? []).filter((dia) => dia >= hoje).length;

  const chips: { chave: string; icone: ReactNode; titulo: string; detalhe: string; cor: string; falta?: number }[] = [];
  if (xp > 0) chips.push({ chave: "xp", icone: <DuoXp className="size-5 text-amber-500" />, titulo: "XP em dobro", detalhe: `${relogio(xp)} restantes`, cor: "#f59e0b", falta: xp });
  if (rupees > 0) chips.push({ chave: "rupees", icone: <Rupee className="size-5 text-emerald-500" />, titulo: "Rupees em dobro", detalhe: `${relogio(rupees)} restantes`, cor: "#10b981", falta: rupees });
  if (escudos > 0) chips.push({ chave: "escudos", icone: <DuoEscudo className="size-5 text-sky-500" />, titulo: `${escudos} ${escudos === 1 ? "escudo" : "escudos"}`, detalhe: "guardados", cor: "#0ea5e9" });
  if (gases > 0) chips.push({ chave: "gas", icone: <GasOfensiva className="size-5" />, titulo: `${gases} ${gases === 1 ? "gás" : "gases"}`, detalhe: "guardado", cor: "#8b5cf6" });
  if (fimDeSemana > 0) chips.push({ chave: "fds", icone: <DuoFimDeSemana className="size-5 text-teal-500" />, titulo: "Fim de semana", detalhe: "protegido", cor: "#14b8a6" });
  if (!chips.length) return null;

  return (
    <div className={cn("rounded-[18px] border border-border bg-card p-3", className)}>
      <p className="mb-2 text-[0.7rem] font-black uppercase tracking-[0.12em] text-muted-foreground">Valendo agora</p>
      <div className={cn("flex gap-2", vertical ? "flex-col" : "zc-scroll-hidden overflow-x-auto")}>
        {chips.map((chip) => (
          <span
            key={chip.chave}
            className="relative flex shrink-0 items-center gap-2 overflow-hidden rounded-[14px] border px-3 pb-2.5 pt-2"
            style={{ background: `color-mix(in srgb, ${chip.cor} 13%, transparent)`, borderColor: `color-mix(in srgb, ${chip.cor} 35%, transparent)` }}
          >
            {chip.icone}
            <span>
              <b className="block text-[0.8rem] leading-tight">{chip.titulo}</b>
              <small className="block text-[0.68rem] text-muted-foreground">{chip.detalhe}</small>
            </span>
            {chip.falta !== undefined && (
              <span className="absolute inset-x-0 bottom-0 h-[3px] bg-black/20">
                <span className="block h-full" style={{ width: `${Math.min(100, (chip.falta / DURACAO_DO_PODER_MS) * 100)}%`, background: chip.cor }} />
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

function Historico({ transacoes }: { transacoes: Transaction[] }) {
  return (
    <section className="rounded-[18px] border border-border bg-card p-4">
      <p className="flex items-center gap-2 text-[0.7rem] font-black uppercase tracking-[0.12em] text-muted-foreground">
        <History className="size-4" /> Histórico
      </p>
      {transacoes.length ? (
        <div className="mt-2.5">
          {transacoes.slice(0, 5).map((item) => (
            <div key={item.id} className="border-b border-border py-2 last:border-0">
              <p className="text-[0.78rem] font-bold">{item.reason}</p>
              <span className={cn("text-[0.72rem] font-bold", item.amount < 0 ? "text-rose-400" : "text-emerald-400")}>
                {item.amount > 0 ? "+" : ""}{item.amount} Rupees
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 flex gap-3 text-xs text-muted-foreground">
          <LockKeyhole className="size-5 shrink-0" /> Faça sua primeira compra para ver o histórico.
        </p>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// A loja
// ---------------------------------------------------------------------------

type Catalogo = { items: Item[]; cosmetics: Cosmetic[]; transactions: Transaction[] };

async function buscarCatalogo(): Promise<Catalogo | null> {
  const token = localStorage.getItem("accessToken");
  if (!token) return null;
  const headers = { Authorization: `Bearer ${token}` };
  const [a, b, c] = await Promise.all([
    fetchComTimeout(`${API_BASE_URL}/user/zulcoins/items`, { headers }),
    fetchComTimeout(`${API_BASE_URL}/user/zulcoins/cosmetics`, { headers }),
    fetchComTimeout(`${API_BASE_URL}/user/zulcoins/history`, { headers }),
  ]);
  const cosmetics: Cosmetic[] = b.ok ? await b.json() : [];
  return {
    items: a.ok ? await a.json() : [],
    cosmetics: cosmetics.map((item) => ({ ...item, kind: String(item.kind).toUpperCase() as Kind })),
    transactions: c.ok ? ((await c.json()).transactions ?? []) : [],
  };
}

/**
 * A loja: uma página só, sem filtros. Primeiro o que está valendo agora;
 * depois os power-ups por seção, num cartão compacto em que o botão já é o
 * preço; por fim temas, avatares e banners em carrosséis, com a prévia de
 * verdade. No computador o "Valendo agora" e o histórico ficam na lateral.
 */
function Store() {
  const { perfil, retry } = usePerfil();
  const [catalogo, setCatalogo] = useState<Catalogo>({ items: [], cosmetics: [], transactions: [] });
  const [working, setWorking] = useState<string | null>(null);
  const [notice, setNotice] = useState<Aviso | null>(null);
  // O relógio dos superpoderes: anda de segundo em segundo enquanto a loja está aberta.
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const recarregar = () => buscarCatalogo().then((novo) => novo && setCatalogo(novo)).catch(() => undefined);
  useEffect(() => {
    let vivo = true;
    buscarCatalogo().then((novo) => vivo && novo && setCatalogo(novo)).catch(() => undefined);
    return () => {
      vivo = false;
    };
  }, []);

  const { items, cosmetics, transactions } = catalogo;
  const saldo = perfil?.moedas ?? 0;
  const penasCheias = typeof perfil?.vidas === "number" && perfil.vidas >= (perfil.maxVidas ?? 5);

  const send = async (id: string, url: string, body?: object) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;
    setWorking(id);
    try {
      const res = await fetchComTimeout(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? "Não foi possível concluir.");
      await Promise.all([recarregar(), Promise.resolve(retry())]);
      return data;
    } catch (error) {
      setNotice({ title: "Não foi possível concluir", message: error instanceof Error ? error.message : "Tente novamente.", error: true });
      return null;
    } finally {
      setWorking(null);
    }
  };

  const semSaldo = (preco: number) =>
    setNotice({ title: "Saldo insuficiente", message: `Você tem ${saldo} Rupees e este item custa ${preco}.`, error: true });

  const buyPower = async (item: Item) => {
    if (item.effect === "RECOVER_LIVES" && penasCheias) {
      return setNotice({ title: "Penas cheias", message: "Suas penas já estão cheias. Guarde as rupees para quando precisar.", error: true });
    }
    if (saldo < item.price) return semSaldo(item.price);
    const data = await send(item.id, `${API_BASE_URL}/user/zulcoins/spend`, { itemId: item.id });
    if (!data) return;
    reagir("compra");
    setNotice({ title: "Power-up ativado", message: data.message ?? "O benefício já está disponível." });
  };

  const cosmeticAction = async (item: Cosmetic) => {
    if (!item.owned && saldo < item.price) return semSaldo(item.price);
    const data = await send(item.id, `${API_BASE_URL}/user/zulcoins/cosmetics/${item.id}/${item.owned ? "equip" : "buy"}`);
    if (!data) return;
    reagir(item.owned ? "toque" : "compra");
    setNotice({
      title: item.owned ? "Item em uso" : "Item comprado",
      message: item.owned ? "Sua personalização foi aplicada." : "Agora ele está disponível para usar.",
    });
  };

  const tituloDeSecao = (texto: string) => <h2 className="text-[1.05rem] font-black">{texto}</h2>;

  return (
    <div className="mx-auto max-w-[1240px] pb-5 pt-1 sm:pb-7 sm:pt-2">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_290px]">
        <main className="min-w-0">
          <header className="flex items-center justify-between gap-3 rounded-[18px] border border-border bg-card px-4 py-3 sm:rounded-[20px] sm:px-5 sm:py-4">
            <div className="min-w-0">
              <h1 className="text-xl font-black tracking-tight sm:text-2xl">Loja</h1>
              <p className="mt-0.5 hidden text-sm text-muted-foreground sm:block">Troque suas Rupees por power-ups e personalizações</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-2 sm:gap-2 sm:rounded-2xl sm:px-4 sm:py-2.5">
              <Rupee className="size-5 text-emerald-500 sm:size-6" />
              <span className="text-lg font-black text-amber-400 sm:text-xl">{perfil?.moedas?.toLocaleString("pt-BR") ?? "—"}</span>
            </div>
          </header>

          <ValendoAgora agora={agora} className="mt-4 xl:hidden" />

          <div className="grid gap-x-5 lg:grid-cols-2">
            {SECOES.map(({ titulo, efeitos }) => {
              const daSecao = items.filter((item) => efeitos.includes(item.effect));
              if (!daSecao.length) return null;
              const larga = titulo === "Superpoderes";
              return (
                <section key={titulo} className={cn("mt-6", larga && "lg:col-span-2")}>
                  <div className="mb-2.5">{tituloDeSecao(titulo)}</div>
                  <div className={cn("flex flex-col gap-2", larga && "lg:grid lg:grid-cols-2")}>
                    {daSecao.map((item) => (
                      <LinhaDePoder
                        key={item.id}
                        item={item}
                        saldo={saldo}
                        ocupado={working === item.id}
                        ativoAte={
                          item.effect === "DOUBLE_XP" ? restante(perfil?.doubleXpUntil, agora)
                            : item.effect === "DOUBLE_COINS" ? restante(perfil?.doubleCoinsUntil, agora) : 0
                        }
                        semEfeito={item.effect === "RECOVER_LIVES" && penasCheias ? "Suas penas já estão cheias." : null}
                        aoComprar={buyPower}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          {(["AVATAR", "BANNER"] as const).map((tipo) => {
            const lista = cosmetics.filter((item) => item.kind === tipo);
            if (!lista.length) return null;
            return (
              <Carrossel key={tipo} className="mt-7" titulo={tituloDeSecao(tipo === "AVATAR" ? "Avatares" : "Banners")}>
                {lista.map((item) => (
                  <CartaoDeCosmetico key={item.id} item={item} saldo={saldo} ocupado={working === item.id} aoAgir={cosmeticAction} />
                ))}
              </Carrossel>
            );
          })}
        </main>

        <aside className="flex flex-col gap-4 xl:sticky xl:top-[calc(var(--zc-topbar-h,72px)+8px)] xl:self-start">
          <ValendoAgora agora={agora} vertical className="hidden xl:block" />
          <Historico transacoes={transactions} />
        </aside>
      </div>

      {notice && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" role="dialog" aria-modal="true">
          <div className="animate-pop-in w-full max-w-sm rounded-3xl border border-border bg-card p-6 text-center shadow-2xl">
            <span className={cn("mx-auto grid size-14 place-items-center rounded-2xl", notice.error ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-500")}>
              {notice.error ? <LockKeyhole className="size-7" /> : <Check className="size-8" strokeWidth={3} />}
            </span>
            <h2 className={cn("mt-4 text-xl font-black", notice.error ? "text-destructive" : "text-foreground")}>{notice.title}</h2>
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

export default function LojaPage() {
  useRequireAuth();
  return (
    <AppShell contentClassName="max-w-none">
      <Store />
    </AppShell>
  );
}
