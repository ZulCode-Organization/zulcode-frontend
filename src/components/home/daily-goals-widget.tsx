"use client";

import Link from "next/link";
import { Coins } from "lucide-react";
import { useEffect, useState } from "react";
import { useMetasDiarias } from "@/hooks/use-metas-diarias";

function BarraProgresso({ atual, alvo }: { atual: number; alvo: number }) {
  const percentual = alvo > 0 ? Math.min(100, Math.round((atual / alvo) * 100)) : 0;
  const [largura, setLargura] = useState(0);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setLargura(percentual));
    return () => window.cancelAnimationFrame(frame);
  }, [percentual]);

  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-muted" aria-label={`Progresso: ${percentual}%`}>
      <div className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out" style={{ width: `${largura}%` }} />
    </div>
  );
}

export function DailyGoalsWidget() {
  const { metas, conectada, resgatar } = useMetasDiarias();
  const metasVisiveis = metas.filter((meta) => meta.period === "DAILY" && !meta.completed);
  const [resgatando, setResgatando] = useState<string | null>(null);
  const [recompensa, setRecompensa] = useState(0);
  const [erro, setErro] = useState("");

  const resgatarMeta = async (id: string) => {
    setResgatando(id);
    setErro("");
    const ganho = await resgatar(id);
    setResgatando(null);
    if (ganho > 0) {
      setRecompensa(ganho);
      window.setTimeout(() => setRecompensa(0), 1800);
    } else {
      setErro("Não foi possível resgatar agora. Tente novamente.");
    }
  };

  return (
    <div
      className="animate-fade-in-up rounded-[20px] border border-border bg-card p-6"
      style={{ animationDelay: "60ms" }}
    >
      <div className="mb-5 flex items-center justify-between gap-2">
        <h3 className="text-base font-black text-foreground">Metas do dia</h3>
        <Link
          href="/metas"
          className="shrink-0 text-[0.75rem] font-black uppercase tracking-[0.06em] text-primary"
        >
          Ver todas
        </Link>
      </div>

      {!conectada && (
        <p className="mb-5 rounded-xl bg-muted px-3.5 py-2.5 text-[0.78rem] leading-snug text-muted-foreground">
          A contagem do dia ainda não vem do servidor — por isso as barras
          estão zeradas.
        </p>
      )}

      {recompensa > 0 && <p role="status" className="animate-pop-in mb-4 rounded-xl bg-amber-400 px-3 py-2 text-center text-xs font-black text-amber-950">+{recompensa} moedas adicionadas!</p>}
      {erro && <p role="alert" className="mb-4 rounded-xl bg-destructive/10 px-3 py-2 text-center text-xs font-bold text-destructive">{erro}</p>}

      <div className="flex flex-col gap-4">
        {metasVisiveis.map((meta) => {
          const feito = Math.min(meta.current, meta.target);
          const unidade = meta.type === "DAILY_MINUTES" ? " min" : "";

          return (
            <div key={meta.id} className="animate-fade-in-up flex items-center gap-4 py-1">
              <span className="relative flex size-10.5 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-500">
                <Coins className="size-6" />
                <span className="absolute -bottom-1 -right-1 grid min-w-5 place-items-center rounded-full bg-amber-400 px-1 py-0.5 text-[0.58rem] font-black leading-none text-amber-950 shadow-sm">+{meta.coinReward}</span>
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-[0.86rem] font-extrabold leading-snug text-foreground text-pretty">
                  {meta.title}
                </p>
                <div className="mt-2 flex items-center justify-between gap-3 text-[0.68rem] font-black uppercase tracking-[0.04em] text-muted-foreground">
                  <span>Progresso</span>
                  <span className="text-foreground">{feito}/{meta.target}{unidade}</span>
                </div>
                <div className="mt-1.5"><BarraProgresso atual={meta.current} alvo={meta.target} /></div>
                {meta.claimable && <button disabled={resgatando === meta.id} onClick={() => void resgatarMeta(meta.id)} className="zc-press zc-press-shadow mt-3 w-full rounded-xl bg-amber-400 px-3 py-2 text-[0.68rem] font-black uppercase text-amber-950 disabled:cursor-wait disabled:opacity-70">{resgatando === meta.id ? "Resgatando…" : "Resgatar"}</button>}
              </div>
            </div>
          );
        })}
        {conectada && metasVisiveis.length === 0 && <p className="rounded-xl bg-primary/10 px-4 py-3 text-center text-sm font-bold text-primary">Você concluiu todas as metas de hoje! ✦</p>}
      </div>
    </div>
  );
}
