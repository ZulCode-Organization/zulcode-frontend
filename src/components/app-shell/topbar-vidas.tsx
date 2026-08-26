"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Coins, Feather, Infinity as InfinityIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";
import { usePerfil } from "@/hooks/use-perfil";

interface EstadoVidas {
  lives: number;
  maxLives: number;
  isUnlimited: boolean;
  nextRefillAt: string | null;
}

interface ItemLoja {
  id: string;
  title: string;
  description: string;
  price: number;
  effect: "RECOVER_LIVES" | "FREEZE_STREAK" | "DOUBLE_XP";
}

const MAX_PADRAO = 5;

function tempoRestante(alvo: string | null) {
  if (!alvo) return null;
  const restante = new Date(alvo).getTime() - Date.now();
  if (restante <= 0) return null;
  const minutos = Math.ceil(restante / 60000);
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  return `${horas}h ${minutos % 60}min`;
}

/**
 * Tela das penas: quantas restam, quando volta a próxima, e as duas saídas —
 * recuperar todas com moedas (o mesmo item RECOVER_LIVES da Loja, comprado
 * pela mesma rota) ou assinar o PRO, que dá penas ilimitadas.
 */
export function PainelVidas({ onNavegar }: { onNavegar?: () => void }) {
  const { perfil, retry } = usePerfil();
  const [estado, setEstado] = useState<EstadoVidas | null>(null);
  const [item, setItem] = useState<ItemLoja | null>(null);
  const [comprando, setComprando] = useState(false);
  const [aviso, setAviso] = useState<{ texto: string; erro: boolean } | null>(null);

  const carregar = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    const [vidas, itens] = await Promise.all([
      fetchComTimeout(`${API_BASE_URL}/user/lives`, { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetchComTimeout(`${API_BASE_URL}/user/zulcoins/items`, { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]);
    if (vidas) setEstado(vidas);
    if (Array.isArray(itens)) setItem(itens.find((atual: ItemLoja) => atual.effect === "RECOVER_LIVES") ?? null);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const ilimitado = estado?.isUnlimited ?? perfil?.isPro ?? false;
  const maximo = estado?.maxLives ?? MAX_PADRAO;
  const atuais = ilimitado ? maximo : estado?.lives ?? perfil?.vidas ?? 0;
  const cheio = atuais >= maximo;
  const proxima = tempoRestante(estado?.nextRefillAt ?? null);
  const saldo = perfil?.moedas ?? 0;
  const podePagar = !!item && saldo >= item.price;

  const recuperar = async () => {
    if (!item || comprando) return;
    if (!podePagar) {
      setAviso({ texto: `Você tem ${saldo} moedas e este item custa ${item.price}.`, erro: true });
      return;
    }
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    setComprando(true);
    setAviso(null);
    try {
      const res = await fetchComTimeout(`${API_BASE_URL}/user/zulcoins/spend`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ itemId: item.id }),
      });
      const corpo = await res.json().catch(() => null);
      if (!res.ok) throw new Error(corpo?.message ?? "Não foi possível concluir.");
      setAviso({ texto: corpo?.message ?? "Penas recuperadas!", erro: false });
      await Promise.all([carregar(), Promise.resolve(retry())]);
    } catch (erro) {
      setAviso({ texto: erro instanceof Error ? erro.message : "Tente novamente.", erro: true });
    } finally {
      setComprando(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md pb-2">
      <div className="rounded-[20px] border border-border bg-card px-5 py-6 text-center">
        <div className="flex items-center justify-center gap-2">
          {ilimitado ? (
            <InfinityIcon className="size-11 text-rose-500" strokeWidth={2.6} />
          ) : (
            Array.from({ length: maximo }, (_, indice) => (
              <Feather
                key={indice}
                className={cn("size-7", indice < atuais ? "fill-rose-500 text-rose-500" : "text-muted-foreground/35")}
                aria-hidden
              />
            ))
          )}
        </div>

        <p className="mt-4 text-lg font-black">
          {ilimitado ? "Você tem penas ilimitadas!" : cheio ? "Você está com todas as penas!" : `${atuais} de ${maximo} penas`}
        </p>
        <p className="mt-1 text-[0.85rem] leading-snug text-muted-foreground">
          {ilimitado
            ? "Erre à vontade: nenhuma aula fica travada pra você."
            : cheio
            ? "Assim você pode continuar a aprender."
            : proxima
            ? `Você ganha a próxima pena em ${proxima}.`
            : "Uma pena volta a cada hora."}
        </p>
      </div>

      {/* PRO: roxo próprio do app, o mesmo do ProCard — é o que separa o
          premium de qualquer outro botão azul da tela. */}
      {!ilimitado && (
        <Link
          href="/pro"
          onClick={onNavegar}
          className="mt-3 flex items-center gap-3 rounded-[20px] border border-border bg-card px-4 py-4 transition-colors duration-150 hover:border-violet-500/40"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-violet-600/15 text-violet-500">
            <InfinityIcon className="size-6" strokeWidth={2.6} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[0.9rem] font-black">Penas ilimitadas</span>
            <span className="block text-[0.78rem] text-muted-foreground">Com o ZulCode PRO você nunca fica sem.</span>
          </span>
          <span className="shrink-0 text-[0.75rem] font-black uppercase tracking-[0.06em] text-violet-500">Conhecer</span>
        </Link>
      )}

      {!ilimitado && item && (
        <button
          type="button"
          onClick={recuperar}
          disabled={cheio || comprando}
          className={cn(
            "mt-3 flex w-full items-center gap-3 rounded-[20px] border border-border bg-card px-4 py-4 text-left transition-colors duration-150",
            cheio || comprando ? "opacity-50" : "hover:border-primary/40"
          )}
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-500">
            <Feather className="size-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[0.9rem] font-black">{item.title}</span>
            <span className="block text-[0.78rem] text-muted-foreground">
              {cheio ? "Suas penas já estão cheias." : item.description}
            </span>
          </span>
          <span className={cn("flex shrink-0 items-center gap-1 text-[0.9rem] font-black", podePagar ? "text-yellow-500" : "text-muted-foreground")}>
            <Coins className="size-4.5" />
            {item.price}
          </span>
        </button>
      )}

      {aviso && (
        <p className={cn("mt-3 rounded-2xl px-4 py-3 text-[0.82rem] font-bold", aviso.erro ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>
          {aviso.texto}
        </p>
      )}
    </div>
  );
}
