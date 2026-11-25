"use client";

import { useState, type FormEvent } from "react";
import { ChevronRight, Loader2, TicketPercent } from "lucide-react";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";
import { cn } from "@/lib/utils";

/** O que o código deu de fato (o PRO não entra para quem já paga, por exemplo). */
export type CodigoResgatado = { codigo: string; rupees: number; diasPro: number; cosmetico: string | null };

/** "Você ganhou 100 rupees, 7 dias de PRO e "Avatar X"." — ou nada, se o código não deu nada novo. */
export function textoDoCodigo(r: CodigoResgatado) {
  const partes = [
    r.rupees ? `${r.rupees.toLocaleString("pt-BR")} rupees` : "",
    r.diasPro ? `${r.diasPro} ${r.diasPro === 1 ? "dia" : "dias"} de PRO` : "",
    r.cosmetico ? `"${r.cosmetico}"` : "",
  ].filter(Boolean);
  if (!partes.length) return `O código ${r.codigo} foi aplicado.`;
  const lista = partes.length > 1 ? `${partes.slice(0, -1).join(", ")} e ${partes[partes.length - 1]}` : partes[0];
  return `Você ganhou ${lista}.`;
}

/**
 * O "Tem um código?" da loja: fechado é uma linha só; aberto, o campo e o
 * botão. Os códigos são criados no administrativo (Códigos promocionais), para
 * eventos, parceiros e posts nas redes.
 */
export function CampoDeCodigo({ aoResgatar, className }: { aoResgatar: (r: CodigoResgatado) => void | Promise<void>; className?: string }) {
  const [aberto, setAberto] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    const limpo = codigo.trim();
    const token = localStorage.getItem("accessToken");
    if (!limpo || !token) return;
    setEnviando(true);
    setErro("");
    try {
      const res = await fetchComTimeout(`${API_BASE_URL}/codigos/resgatar`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ codigo: limpo.slice(0, 40) }),
      });
      const corpo: Partial<CodigoResgatado> & { message?: string | string[] } = await res.json().catch(() => ({}));
      if (!res.ok) {
        // O servidor diz o porquê: inválido, expirado, já usado, tentativas demais...
        const mensagem = Array.isArray(corpo.message) ? corpo.message[0] : corpo.message;
        setErro(res.status < 500 && mensagem ? mensagem : "Não foi possível resgatar agora. Tente de novo.");
        return;
      }
      setCodigo("");
      setAberto(false);
      await aoResgatar({ codigo: corpo.codigo ?? limpo.toUpperCase(), rupees: corpo.rupees ?? 0, diasPro: corpo.diasPro ?? 0, cosmetico: corpo.cosmetico ?? null });
    } catch {
      setErro("Sem conexão. Tente de novo quando a internet voltar.");
    } finally {
      setEnviando(false);
    }
  };

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className={cn("flex w-full items-center gap-3 rounded-[18px] border border-border bg-card p-3.5 text-left transition-colors hover:bg-muted/50", className)}
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <TicketPercent className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-black">Tem um código?</span>
          <span className="block text-xs leading-snug text-muted-foreground">Resgate rupees, dias de PRO e itens de eventos.</span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </button>
    );
  }

  return (
    <form onSubmit={(e) => void enviar(e)} className={cn("rounded-[18px] border border-border bg-card p-3.5", className)}>
      <label htmlFor="codigo-promocional" className="block text-sm font-black">
        Código promocional
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="codigo-promocional"
          autoFocus
          value={codigo}
          onChange={(e) => {
            setCodigo(e.target.value.toUpperCase());
            setErro("");
          }}
          maxLength={40}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          placeholder="EX.: ZULINSTA"
          className="h-11 min-w-0 flex-1 rounded-xl border-2 border-border bg-background px-3 font-mono text-sm font-bold tracking-wider outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={!codigo.trim() || enviando}
          className="zc-press grid h-11 min-w-[6.5rem] shrink-0 place-items-center rounded-xl bg-primary px-4 text-[0.75rem] font-black uppercase tracking-[0.05em] text-primary-foreground disabled:opacity-50"
        >
          {enviando ? <Loader2 className="size-4 animate-spin" /> : "Resgatar"}
        </button>
      </div>
      {erro && (
        <p role="alert" className="mt-2 text-xs font-bold text-destructive">
          {erro}
        </p>
      )}
      <button
        type="button"
        onClick={() => {
          setAberto(false);
          setErro("");
        }}
        className="mt-2 text-xs font-bold text-muted-foreground hover:text-foreground"
      >
        Cancelar
      </button>
    </form>
  );
}
