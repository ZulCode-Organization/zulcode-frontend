"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight, type Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export const classeDaLinha = "flex w-full items-center gap-3.5 border-b border-border px-4 py-4 text-left last:border-0 sm:px-5";

/**
 * Uma linha de configuração.
 *
 * A tela é uma lista de linhas, e não uma grade de cards. Card serve pra
 * conteúdo que se compara lado a lado; ajuste é coisa que se percorre de cima
 * pra baixo procurando um nome. A lista funciona igual no celular e no
 * computador.
 */
export function Linha({
  Icone, titulo, descricao, cor = "text-primary", href, onClick, acessorio, destaque = false,
}: {
  Icone: typeof Sun; titulo: string; descricao: ReactNode; cor?: string; href?: string; onClick?: () => void; acessorio?: ReactNode; destaque?: boolean;
}) {
  const conteudo = (
    <>
      <IconeDaLinha Icone={Icone} cor={cor} />
      <Textos titulo={titulo} descricao={descricao} destaque={destaque} />
      {acessorio ?? <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
    </>
  );
  const classe = cn(classeDaLinha, "transition-colors duration-150 hover:bg-muted/50");
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

export function Textos({ titulo, descricao, destaque = false }: { titulo: ReactNode; descricao: ReactNode; destaque?: boolean }) {
  return (
    <span className="min-w-0 flex-1">
      <span className={cn("block text-[0.92rem] font-black", destaque && "text-destructive")}>{titulo}</span>
      <span className="mt-0.5 block text-[0.8rem] leading-snug text-muted-foreground">{descricao}</span>
    </span>
  );
}

/**
 * Uma linha que liga e desliga. A linha inteira é o interruptor (é a área que
 * o dedo acerta), e o leitor de tela a anuncia como tal.
 */
export function LinhaInterruptor({ Icone, titulo, descricao, ligado, aoMudar }: { Icone: typeof Sun; titulo: string; descricao: string; ligado: boolean; aoMudar: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={ligado} onClick={() => aoMudar(!ligado)} className={cn(classeDaLinha, "transition-colors duration-150 hover:bg-muted/50")}>
      <IconeDaLinha Icone={Icone} cor="text-primary" />
      <Textos titulo={titulo} descricao={descricao} />
      <span aria-hidden className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 motion-reduce:transition-none", ligado ? "bg-primary" : "bg-muted-foreground/30")}>
        <span className={cn("absolute left-0.5 top-0.5 size-6 rounded-full bg-white shadow-sm transition-transform duration-200 motion-reduce:transition-none", ligado && "translate-x-5")} />
      </span>
    </button>
  );
}

/** Uma linha com opções lado a lado embaixo do título (língua, meta diária). */
export function LinhaDeEscolha({ Icone, titulo, descricao, children }: { Icone: typeof Sun; titulo: string; descricao: ReactNode; children: ReactNode }) {
  return (
    <div className="border-b border-border px-4 py-4 last:border-0 sm:px-5">
      <div className="flex items-center gap-3.5">
        <IconeDaLinha Icone={Icone} cor="text-primary" />
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

export function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="px-1 text-[0.7rem] font-black uppercase tracking-[0.1em] text-muted-foreground">{titulo}</h2>
      <div className="mt-2 overflow-hidden rounded-[20px] border border-border bg-card">{children}</div>
    </section>
  );
}

