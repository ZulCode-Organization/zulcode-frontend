"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight, type Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export const classeDaLinha = "flex min-h-14 w-full items-center gap-3.5 border-b-2 border-border px-4 py-3 text-left last:border-0";

/**
 * Uma linha de configuração.
 *
 * A tela é uma lista de linhas dentro de cartões de borda grossa, como nos
 * ajustes do Duolingo: o nome à esquerda, o valor (quando há) e a seta à
 * direita. Ícone e descrição são opcionais — a tela principal só tem nomes;
 * as telas de dentro usam a descrição quando ela ajuda a decidir.
 */
export function Linha({
  Icone, titulo, descricao, cor = "text-primary", href, externo = false, onClick, acessorio, valor, destaque = false,
}: {
  Icone?: typeof Sun; titulo: string; descricao?: ReactNode; cor?: string; href?: string; externo?: boolean; onClick?: () => void;
  acessorio?: ReactNode; valor?: ReactNode; destaque?: boolean;
}) {
  const conteudo = (
    <>
      {Icone && <IconeDaLinha Icone={Icone} cor={cor} />}
      <Textos titulo={titulo} descricao={descricao} destaque={destaque} />
      {valor !== undefined && <span className="shrink-0 text-[0.9rem] font-extrabold text-muted-foreground">{valor}</span>}
      {acessorio ?? <ChevronRight className="size-5 shrink-0 text-muted-foreground/70" strokeWidth={2.6} />}
    </>
  );
  const classe = cn(classeDaLinha, "transition-colors duration-150 hover:bg-muted/50 active:bg-muted");
  if (href && externo) return <a href={href} target="_blank" rel="noreferrer" className={classe}>{conteudo}</a>;
  if (href) return <Link href={href} className={classe}>{conteudo}</Link>;
  if (!onClick) return <div className={classeDaLinha}>{conteudo}</div>;
  return <button type="button" onClick={onClick} className={classe}>{conteudo}</button>;
}

export function IconeDaLinha({ Icone, cor }: { Icone: typeof Sun; cor: string }) {
  return (
    <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl bg-muted", cor)}>
      <Icone className="size-5" />
    </span>
  );
}

export function Textos({ titulo, descricao, destaque = false }: { titulo: ReactNode; descricao?: ReactNode; destaque?: boolean }) {
  return (
    <span className="min-w-0 flex-1">
      <span className={cn("block text-[1rem] font-extrabold", destaque && "text-destructive")}>{titulo}</span>
      {descricao && <span className="mt-0.5 block text-[0.8rem] font-semibold leading-snug text-muted-foreground">{descricao}</span>}
    </span>
  );
}

/** O interruptor desenhado, sem a linha em volta. */
export function Chave({ ligado }: { ligado: boolean }) {
  return (
    <span aria-hidden className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 motion-reduce:transition-none", ligado ? "bg-primary" : "bg-muted-foreground/30")}>
      <span className={cn("absolute left-0.5 top-0.5 size-6 rounded-full bg-white shadow-sm transition-transform duration-200 motion-reduce:transition-none", ligado && "translate-x-5")} />
    </span>
  );
}

/**
 * Uma linha que liga e desliga. A linha inteira é o interruptor (é a área que
 * o dedo acerta), e o leitor de tela a anuncia como tal.
 */
export function LinhaInterruptor({ Icone, titulo, descricao, ligado, aoMudar }: { Icone?: typeof Sun; titulo: string; descricao?: string; ligado: boolean; aoMudar: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={ligado} onClick={() => aoMudar(!ligado)} className={cn(classeDaLinha, "transition-colors duration-150 hover:bg-muted/50")}>
      {Icone && <IconeDaLinha Icone={Icone} cor="text-primary" />}
      <Textos titulo={titulo} descricao={descricao} />
      <Chave ligado={ligado} />
    </button>
  );
}

/** Uma linha com opções lado a lado embaixo do título (língua, meta diária). */
export function LinhaDeEscolha({ Icone, titulo, descricao, children }: { Icone?: typeof Sun; titulo: string; descricao?: ReactNode; children: ReactNode }) {
  return (
    <div className="border-b-2 border-border px-4 py-4 last:border-0">
      <div className="flex items-center gap-3.5">
        {Icone && <IconeDaLinha Icone={Icone} cor="text-primary" />}
        <Textos titulo={titulo} descricao={descricao} />
      </div>
      <div className="mt-3.5">{children}</div>
    </div>
  );
}

export function Opcao({ ativa, aoEscolher, desabilitada, children }: { ativa: boolean; aoEscolher: () => void; desabilitada?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={ativa}
      disabled={desabilitada}
      onClick={aoEscolher}
      className={cn(
        "flex min-h-12 flex-col items-center justify-center rounded-xl border-2 px-1 py-2 text-center transition-colors duration-150 disabled:opacity-60",
        ativa ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground hover:border-primary/40",
      )}
    >
      {children}
    </button>
  );
}

/** Um grupo: o nome em cima e as linhas dentro de um cartão de borda grossa. */
export function Grupo({ titulo, children }: { titulo?: string; children: ReactNode }) {
  return (
    <section className="mt-6 first:mt-0">
      {titulo && <h2 className="mb-2.5 px-0.5 text-[1.15rem] font-black text-foreground">{titulo}</h2>}
      <div className="overflow-hidden rounded-2xl border-2 border-border">{children}</div>
    </section>
  );
}
