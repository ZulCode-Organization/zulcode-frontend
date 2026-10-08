"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Feather, Infinity as InfinityIcon, Loader2, ShieldCheck, HeartPulse, type LucideIcon } from "lucide-react";
import { Rupee } from "@/components/shared/rupee";
import { SeloPro } from "@/components/shared/selo-pro";
import { cn } from "@/lib/utils";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";
import { usePerfil } from "@/hooks/use-perfil";
import { DIAS_DE_TESTE } from "@/lib/pro/planos";

interface EstadoVidas {
  lives: number;
  maxLives: number;
  isUnlimited: boolean;
  nextRefillAt: string | null;
}

type Efeito = "RECOVER_LIVES" | "HEAL_ONE_LIFE" | "FEATHER_SHIELD" | "FREEZE_STREAK" | "DOUBLE_XP" | "DOUBLE_COINS";

interface ItemLoja {
  id: string;
  title: string;
  description: string;
  price: number;
  effect: Efeito;
}

const MAX_PADRAO = 5;

/** Os efeitos que têm a ver com pena. Os outros são de outra tela.
 *
 * A classe vai no desenho, e não no quadrado em volta: a pena é preenchida com
 * contorno mais escuro — duas cores —, e herdar uma cor de texto só deixaria
 * ela vazada, diferente de todas as outras penas do app. */
const DESTA_TELA: Record<string, { Icone: LucideIcon; desenho: string; fundo: string }> = {
  RECOVER_LIVES: { Icone: Feather, desenho: "fill-rose-500 text-rose-800", fundo: "bg-rose-500/15" },
  HEAL_ONE_LIFE: { Icone: HeartPulse, desenho: "text-rose-400", fundo: "bg-rose-500/15" },
  FEATHER_SHIELD: { Icone: ShieldCheck, desenho: "text-sky-500", fundo: "bg-sky-500/15" },
};

/** "9H 51M", como no relógio de recarga. Devolve null quando não há o que
 * contar — a próxima pena já chegou, ou as penas estão cheias. */
function contagem(alvo: string | null) {
  if (!alvo) return null;
  const restante = new Date(alvo).getTime() - Date.now();
  if (restante <= 0) return null;
  const minutos = Math.ceil(restante / 60000);
  const horas = Math.floor(minutos / 60);
  return horas > 0 ? `${horas}H ${minutos % 60}M` : `${minutos}M`;
}

/**
 * A tela das penas no celular.
 *
 * Em cima, a recarga: quantas penas há, a barra até o máximo e quanto falta
 * pra próxima. Embaixo, as saídas — o PRO, que dá penas ilimitadas, e os itens
 * da Loja que mexem em pena.
 *
 * Os itens não são uma lista escrita aqui: vêm do mesmo
 * GET /user/zulcoins/items que a Loja usa, filtrados pelo efeito. Item novo
 * criado no admin que mexa em pena aparece aqui sozinho.
 *
 * O relógio é recalculado a cada minuto. Sem isso ele congelaria no valor de
 * quando a tela abriu, e esta é justamente a tela em que se fica olhando o
 * tempo passar.
 */
export function PainelVidas({ onNavegar }: { onNavegar?: () => void }) {
  // Silencioso: os chips da barra continuam com o número na tela e animam a
  // diferença quando a resposta chega, em vez de piscar "…".
  const { perfil, atualizar } = usePerfil();
  const [estado, setEstado] = useState<EstadoVidas | null>(null);
  const [itens, setItens] = useState<ItemLoja[] | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ texto: string; erro: boolean } | null>(null);
  const [, forcarRelogio] = useState(0);

  const carregar = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    const [vidas, lista] = await Promise.all([
      fetchComTimeout(`${API_BASE_URL}/user/lives`, { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetchComTimeout(`${API_BASE_URL}/user/zulcoins/items`, { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]);
    if (vidas) setEstado(vidas);
    setItens(Array.isArray(lista) ? lista.filter((item: ItemLoja) => item.effect in DESTA_TELA) : []);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    const id = window.setInterval(() => forcarRelogio((n) => n + 1), 60000);
    return () => window.clearInterval(id);
  }, []);

  const ilimitado = estado?.isUnlimited ?? perfil?.isPro ?? false;
  const maximo = estado?.maxLives ?? MAX_PADRAO;
  const atuais = ilimitado ? maximo : estado?.lives ?? perfil?.vidas ?? 0;
  const cheio = atuais >= maximo;
  const falta = contagem(estado?.nextRefillAt ?? null);
  const saldo = perfil?.moedas ?? 0;

  const comprar = async (item: ItemLoja) => {
    if (ocupado) return;
    if (saldo < item.price) {
      setAviso({ texto: `Você tem ${saldo} Rupees e este item custa ${item.price}.`, erro: true });
      return;
    }
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    setOcupado(item.id);
    setAviso(null);
    try {
      const res = await fetchComTimeout(`${API_BASE_URL}/user/zulcoins/spend`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ itemId: item.id }),
      });
      const corpo = await res.json().catch(() => null);
      if (!res.ok) throw new Error(corpo?.message ?? "Não foi possível concluir.");
      setAviso({ texto: corpo?.message ?? "Pronto!", erro: false });
      await Promise.all([carregar(), Promise.resolve(atualizar())]);
    } catch (erro) {
      setAviso({ texto: erro instanceof Error ? erro.message : "Tente novamente.", erro: true });
    } finally {
      setOcupado(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md pb-4">
      {/* A recarga. Com penas ilimitadas não há o que contar, então a barra dá
          lugar ao estado — uma barra cheia parada diria menos. */}
      {ilimitado ? (
        <div className="flex items-center gap-3 rounded-[18px] border border-border bg-card px-4 py-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-500">
            <InfinityIcon className="size-6" strokeWidth={2.6} />
          </span>
          <div className="min-w-0">
            <p className="text-[0.92rem] font-black">Penas ilimitadas</p>
            <p className="mt-0.5 text-[0.78rem] text-muted-foreground">Erre à vontade: nenhuma aula trava pra você.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-end justify-between gap-3">
            <p className="text-[0.72rem] font-black uppercase tracking-[0.1em] text-muted-foreground">
              {cheio ? "Penas cheias" : "Carrega em…"}
            </p>
            {!cheio && falta && (
              <p className="flex items-center gap-1 text-[0.72rem] font-black uppercase tracking-[0.06em] text-muted-foreground">
                <Feather className="size-3.5 fill-rose-500 text-rose-800" />
                {falta}
              </p>
            )}
          </div>

          <div className="mt-2 flex items-center gap-2">
            <div className="relative h-7 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-rose-500 transition-[width] duration-300"
                style={{ width: `${Math.round((atuais / maximo) * 100)}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[0.78rem] font-black text-foreground">
                {atuais} / {maximo}
              </span>
            </div>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted" aria-hidden>
              <Feather className="size-5 fill-rose-500 text-rose-800" />
            </span>
          </div>
        </>
      )}

      {aviso && (
        <p
          role="status"
          className={cn(
            "animate-pop-in mt-4 rounded-xl px-3 py-2.5 text-center text-[0.8rem] font-black",
            aviso.erro ? "bg-rose-500/15 text-rose-500" : "bg-emerald-500/15 text-emerald-500"
          )}
        >
          {aviso.texto}
        </p>
      )}

      {/* PRO: a única saída que resolve de vez, então vem antes dos consumos. */}
      {!ilimitado && (
        <Link
          href="/pro"
          onClick={onNavegar}
          className="mt-5 block overflow-hidden rounded-[18px] border border-border bg-card"
        >
          <div className="px-4 py-2.5" style={{ background: "linear-gradient(120deg, #4f63e3 0%, #8a63e6 48%, #bd73e9 100%)" }}>
            <SeloPro className="h-5" />
          </div>
          <div className="flex items-center gap-3.5 px-4 py-3.5">
            <span className="relative flex size-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15">
              <Feather className="size-6 fill-violet-500 text-violet-800" />
              <InfinityIcon className="absolute -right-0.5 -top-0.5 size-4 text-foreground" strokeWidth={3} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[0.92rem] font-black leading-snug">Ilimitada</p>
              <p className="mt-0.5 text-[0.78rem] leading-snug text-muted-foreground">
                Com o PRO, você nunca fica sem pena.
              </p>
            </div>
            <span className="shrink-0 text-right text-[0.72rem] font-black uppercase leading-tight tracking-[0.06em] text-violet-500">
              Testar
              <br />
              {DIAS_DE_TESTE} dias
            </span>
          </div>
        </Link>
      )}

      {itens === null ? (
        <div className="mt-3 flex flex-col gap-2.5">
          {[0, 1].map((i) => (
            <div key={i} className="h-[76px] animate-pulse rounded-[18px] bg-muted" />
          ))}
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-2.5">
          {itens.map((item) => {
            const { Icone, desenho, fundo } = DESTA_TELA[item.effect];
            // Recuperar tudo não faz nada com as penas cheias; os outros
            // (curar uma, escudo) continuam valendo.
            const inutil = item.effect === "RECOVER_LIVES" && cheio;
            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-3.5 rounded-[18px] border border-border bg-card px-4 py-3.5",
                  inutil && "opacity-50"
                )}
              >
                <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl", fundo)}>
                  <Icone className={cn("size-6", desenho)} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.92rem] font-black leading-snug text-foreground">{item.title}</p>
                  <p className="mt-0.5 text-[0.78rem] leading-snug text-muted-foreground">
                    {inutil ? "Suas penas já estão cheias." : item.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void comprar(item)}
                  disabled={inutil || ocupado === item.id}
                  className="zc-press flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-500/15 px-3 py-2 text-[0.82rem] font-black text-emerald-500 disabled:opacity-60"
                >
                  {ocupado === item.id ? <Loader2 className="size-4 animate-spin" /> : <Rupee className="size-4" />}
                  {item.price}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Link
        href="/loja"
        onClick={onNavegar}
        className="mt-6 block rounded-[14px] border border-border py-3.5 text-center text-[0.8rem] font-black uppercase tracking-[0.06em] text-muted-foreground"
      >
        Ver a loja inteira
      </Link>
    </div>
  );
}
