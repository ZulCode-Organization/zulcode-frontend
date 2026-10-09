"use client";

import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { ArrowDownRight, ArrowUpRight, Loader2, Minus } from "lucide-react";
import { AvatarIcon } from "@/components/shared/avatar-icon";
import { cn } from "@/lib/utils";
import { variacao as textoDaVariacao } from "@/lib/admin/formato";

/**
 * As peças do administrativo.
 *
 * Mais densas que as do app: aqui a pessoa trabalha, compara e corrige, então
 * cabe mais coisa por tela, os cantos são menores e as bordas são finas. As
 * cores são os mesmos tokens do app (fundo, cartão, borda, primária), e por
 * isso o claro e o escuro funcionam sem nada a mais.
 */

// ── Estrutura ────────────────────────────────────────────────────────────

export function Cabecalho({ titulo, descricao, acoes, voltar }: { titulo: ReactNode; descricao?: ReactNode; acoes?: ReactNode; voltar?: ReactNode }) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {voltar}
        <h1 className="truncate text-[1.6rem] font-black leading-tight tracking-tight">{titulo}</h1>
        {descricao && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{descricao}</p>}
      </div>
      {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
    </header>
  );
}

export function Cartao({
  titulo, descricao, acoes, children, className, corpo = "p-4", atualizando = false, id,
}: {
  titulo?: ReactNode; descricao?: ReactNode; acoes?: ReactNode; children: ReactNode; className?: string; corpo?: string; atualizando?: boolean; id?: string;
}) {
  return (
    <section id={id} className={cn("min-w-0 rounded-xl border bg-card", className)}>
      {(titulo || acoes) && (
        <div className="flex flex-wrap items-start justify-between gap-2 border-b px-4 py-3">
          <div className="min-w-0">
            {titulo && <h2 className="text-sm font-black">{titulo}</h2>}
            {descricao && <p className="mt-0.5 text-xs text-muted-foreground">{descricao}</p>}
          </div>
          {acoes && <div className="flex items-center gap-1.5">{acoes}</div>}
        </div>
      )}
      {/* Enquanto busca de novo, o conteúdo antigo fica esmaecido em vez de
          sumir: o número que estava lá continua legível até chegar o novo. */}
      <div className={cn(corpo, "transition-opacity duration-200", atualizando && "opacity-55")}>{children}</div>
    </section>
  );
}

/**
 * Um número de destaque: rótulo, valor e a variação contra o período anterior.
 *
 * `bomQuandoSobe` decide a cor da variação: mais cadastros é bom, mais
 * bloqueios não. A seta e o sinal vão sempre junto, então a cor nunca é a
 * única pista.
 */
export function BlocoNumero({
  rotulo, valor, nota, variacao, bomQuandoSobe = true, icone, carregando,
}: {
  rotulo: string; valor: ReactNode; nota?: ReactNode; variacao?: number | null; bomQuandoSobe?: boolean; icone?: ReactNode; carregando?: boolean;
}) {
  const texto = textoDaVariacao(variacao);
  const bom = typeof variacao === "number" && (variacao === 0 ? null : variacao > 0 === bomQuandoSobe);
  const Seta = typeof variacao !== "number" || variacao === 0 ? Minus : variacao > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="min-w-0 rounded-xl border bg-card px-4 py-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs font-bold text-muted-foreground">{rotulo}</p>
        {icone && <span className="text-muted-foreground">{icone}</span>}
      </div>
      {carregando ? (
        <div className="mt-2 h-8 w-20 animate-pulse rounded-md bg-muted" />
      ) : (
        <p className="mt-1 text-[1.7rem] font-black leading-none tracking-tight">{valor}</p>
      )}
      <div className="mt-2 flex min-h-4 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
        {texto && (
          <span className={cn("inline-flex items-center gap-0.5 font-bold", bom === null ? "text-muted-foreground" : bom ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
            <Seta className="size-3.5" strokeWidth={2.6} />
            {texto}
          </span>
        )}
        {nota && <span className="text-muted-foreground">{nota}</span>}
      </div>
    </div>
  );
}

export function Grade({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-4", className)}>{children}</div>;
}

export function Esqueleto({ linhas = 3, className }: { linhas?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden>
      {Array.from({ length: linhas }, (_, i) => (
        <div key={i} className="h-4 animate-pulse rounded bg-muted" style={{ width: `${92 - ((i * 17) % 40)}%` }} />
      ))}
    </div>
  );
}

export function Vazio({ titulo, children, icone, acao }: { titulo: string; children?: ReactNode; icone?: ReactNode; acao?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      {icone && <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">{icone}</span>}
      <p className="text-sm font-black">{titulo}</p>
      {children && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{children}</p>}
      {acao && <div className="mt-4">{acao}</div>}
    </div>
  );
}

export function Erro({ children, tentarDeNovo }: { children: ReactNode; tentarDeNovo?: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm font-bold text-rose-700 dark:text-rose-300">
      <span>{children}</span>
      {tentarDeNovo && <Botao tamanho="sm" variante="secundario" onClick={tentarDeNovo}>Tentar de novo</Botao>}
    </div>
  );
}

// ── Botões e campos ──────────────────────────────────────────────────────

type Variante = "primario" | "secundario" | "fantasma" | "perigo";
type Tamanho = "sm" | "md";

const VARIANTES: Record<Variante, string> = {
  primario: "bg-primary text-primary-foreground hover:brightness-110",
  secundario: "border bg-card text-foreground hover:bg-muted",
  fantasma: "text-muted-foreground hover:bg-muted hover:text-foreground",
  perigo: "bg-rose-600 text-white hover:bg-rose-700",
};

export const Botao = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; tamanho?: Tamanho; carregando?: boolean; icone?: ReactNode }>(
  function Botao({ variante = "secundario", tamanho = "md", carregando, icone, className, children, disabled, type = "button", ...resto }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || carregando}
        className={cn(
          "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg font-bold transition-[background-color,filter,color,opacity] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50",
          tamanho === "sm" ? "h-8 px-2.5 text-xs" : "h-9 px-3.5 text-sm",
          VARIANTES[variante],
          className,
        )}
        {...resto}
      >
        {carregando ? <Loader2 className="size-4 animate-spin" /> : icone}
        {children}
      </button>
    );
  },
);

const CAMPO = "w-full rounded-lg border bg-background px-3 text-sm outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-60";

export const Entrada = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Entrada({ className, ...p }, ref) {
  return <input ref={ref} className={cn(CAMPO, "h-9", className)} {...p} />;
});

export const AreaDeTexto = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function AreaDeTexto({ className, ...p }, ref) {
  return <textarea ref={ref} className={cn(CAMPO, "min-h-20 py-2 leading-relaxed", className)} {...p} />;
});

export function Escolha({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(CAMPO, "h-9 cursor-pointer pr-8", className)} {...p}>
      {children}
    </select>
  );
}

export function Rotulo({ texto, dica, children, className }: { texto: ReactNode; dica?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-xs font-bold text-muted-foreground">{texto}</span>
      {children}
      {dica && <span className="mt-1 block text-[0.72rem] text-muted-foreground">{dica}</span>}
    </label>
  );
}

/** Um interruptor de verdade (role="switch"), e não uma caixinha de marcar fantasiada. */
export function Interruptor({ ligado, aoMudar, rotulo, desativado }: { ligado: boolean; aoMudar: (v: boolean) => void; rotulo: string; desativado?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      aria-label={rotulo}
      disabled={desativado}
      onClick={() => aoMudar(!ligado)}
      className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50", ligado ? "bg-primary" : "bg-muted-foreground/30")}
    >
      <span className={cn("absolute left-0 top-0.5 size-4 rounded-full bg-white shadow transition-transform duration-200", ligado ? "translate-x-[18px]" : "translate-x-0.5")} />
    </button>
  );
}

/** Botões lado a lado em que só um vale — o período, o tipo de extrato. */
export function Segmentado<T extends string | number>({ opcoes, valor, aoMudar, rotulo }: { opcoes: { valor: T; texto: ReactNode }[]; valor: T; aoMudar: (v: T) => void; rotulo: string }) {
  return (
    <div role="radiogroup" aria-label={rotulo} className="inline-flex rounded-lg border bg-card p-0.5">
      {opcoes.map((o) => (
        <button
          key={String(o.valor)}
          type="button"
          role="radio"
          aria-checked={o.valor === valor}
          onClick={() => aoMudar(o.valor)}
          className={cn(
            "h-7 rounded-md px-2.5 text-xs font-bold transition-colors",
            o.valor === valor ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.texto}
        </button>
      ))}
    </div>
  );
}

// ── Marcas pequenas ──────────────────────────────────────────────────────

type Tom = "neutro" | "azul" | "verde" | "ambar" | "vermelho" | "roxo";
const TONS: Record<Tom, string> = {
  neutro: "bg-muted text-muted-foreground",
  azul: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
  verde: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  ambar: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  vermelho: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
  roxo: "bg-violet-500/12 text-violet-700 dark:text-violet-300",
};

export function Selo({ tom = "neutro", children, className, icone }: { tom?: Tom; children: ReactNode; className?: string; icone?: ReactNode }) {
  return (
    <span className={cn("inline-flex h-5 shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-1.5 text-[0.68rem] font-black", TONS[tom], className)}>
      {icone}
      {children}
    </span>
  );
}

export function AvatarPequeno({ id, className }: { id?: string | null; className?: string }) {
  return (
    <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[0.95rem] text-primary", className)}>
      <AvatarIcon id={id} className="size-[1.15em]" />
    </span>
  );
}

export function Atalho({ children }: { children: ReactNode }) {
  return <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border bg-muted px-1 font-mono text-[0.65rem] font-bold text-muted-foreground">{children}</kbd>;
}
