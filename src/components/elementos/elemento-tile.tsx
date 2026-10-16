"use client";

import { Lock } from "lucide-react";
import { IconeSolar } from "@/components/shared/icone-duo";
import { DOMINIO_CHEIO, corDoAssunto, simboloDe } from "@/lib/elementos";
import { ElementoGlossario } from "@/lib/types/elemento";
import { cn } from "@/lib/utils";

/**
 * O símbolo do elemento no quadradinho da cor do assunto: o próprio código
 * quando o termo é código, um ícone da Solar quando é conceito. Apagado nos
 * que ainda não foram aprendidos.
 */
export function SimboloDoElemento({ elemento, grande = false, className }: { elemento: ElementoGlossario; grande?: boolean; className?: string }) {
  const simbolo = simboloDe(elemento.term);
  const cor = corDoAssunto(elemento.category);
  const apagado = !elemento.aprendido;
  const tamanhoDoTexto = simbolo.tipo === "codigo"
    ? simbolo.texto.length <= 2 ? (grande ? "text-[1.9rem]" : "text-[1.45rem]")
      : simbolo.texto.length <= 4 ? (grande ? "text-[1.5rem]" : "text-[1.15rem]")
        : (grande ? "text-[1.15rem]" : "text-[0.9rem]")
    : "";

  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center",
        grande ? "h-[62px] w-[70px] rounded-[18px]" : "h-[46px] w-[58px] rounded-[14px]",
        apagado ? "bg-muted text-muted-foreground/45" : cn(cor.fundo, cor.texto),
        className,
      )}
    >
      {simbolo.tipo === "codigo" ? (
        <span className={cn("font-mono font-black leading-none tracking-tight", tamanhoDoTexto)}>{simbolo.texto}</span>
      ) : (
        <IconeSolar nome={simbolo.nome} className={grande ? "size-10" : "size-8"} />
      )}
    </span>
  );
}

/** A barrinha de domínio: quantos acertos seguidos na prática, até o cheio. */
export function BarraDeDominio({ elemento, className }: { elemento: ElementoGlossario; className?: string }) {
  const cor = corDoAssunto(elemento.category);
  return (
    <span className={cn("block h-1 overflow-hidden rounded-full bg-muted", className)}>
      <span
        className="block h-full rounded-full transition-[width] duration-500"
        style={{ width: `${(elemento.dominio / DOMINIO_CHEIO) * 100}%`, background: cor.cor }}
      />
    </span>
  );
}

/**
 * Um elemento na grade. Os aprendidos têm cor e a barrinha de domínio; os que
 * faltam ficam apagados, com o cadeado e a unidade onde se aprende. Os dois
 * abrem o detalhe.
 */
export function ElementoTile({ elemento, aoAbrir }: { elemento: ElementoGlossario; aoAbrir: (elemento: ElementoGlossario) => void }) {
  return (
    <button
      type="button"
      onClick={() => aoAbrir(elemento)}
      aria-label={elemento.aprendido ? `${elemento.term}: ${elemento.label}` : `${elemento.term}: aprenda em ${elemento.unidade}`}
      className={cn(
        "zc-press group relative flex flex-col items-center gap-1 rounded-[18px] border-2 border-border bg-card px-2 pb-4 pt-3 text-center shadow-[inset_0_-4px_0_rgba(0,0,0,0.18)] transition-colors duration-150",
        elemento.aprendido && "hover:border-primary/40",
      )}
    >
      <SimboloDoElemento elemento={elemento} className="mb-1" />
      <span className={cn("w-full truncate font-mono text-[0.9rem] font-black", elemento.aprendido ? "text-foreground" : "text-muted-foreground/70")}>
        {elemento.term}
      </span>
      <span className={cn("line-clamp-1 w-full text-[0.62rem] font-black uppercase tracking-[0.05em]", elemento.aprendido ? "text-muted-foreground" : "text-muted-foreground/55")}>
        {elemento.aprendido ? elemento.label : elemento.unidade}
      </span>
      {elemento.aprendido ? (
        <BarraDeDominio elemento={elemento} className="absolute inset-x-4 bottom-1.5" />
      ) : (
        <Lock aria-hidden className="absolute right-2.5 top-2.5 size-3.5 text-muted-foreground/60" strokeWidth={2.4} />
      )}
    </button>
  );
}
