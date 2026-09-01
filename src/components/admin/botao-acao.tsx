"use client";

import { ReactNode } from "react";
import { Check, Loader2, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { EstadoAcao } from "./use-acao";

/**
 * Botão que mostra em que pé está a ação.
 *
 * O rótulo troca junto do estado e o botão fica travado enquanto envia, então
 * a animação acompanha a requisição de verdade em vez de correr na frente
 * dela. É isso que resolve a sensação de que o admin "não respondeu ao
 * clique": ele responde na hora, só que a resposta é o giro do spinner até o
 * servidor terminar.
 *
 * A largura não encolhe entre um estado e outro porque o conteúdo antigo
 * continua ocupando lugar, invisível — sem isso o botão pulava de tamanho ao
 * virar "Salvando…" e empurrava o resto da linha.
 */
export function BotaoAcao({
  estado,
  children,
  rotuloEnviando = "Salvando…",
  rotuloConcluido = "Pronto",
  variante = "primario",
  className,
  ...props
}: {
  estado: EstadoAcao;
  children: ReactNode;
  rotuloEnviando?: string;
  rotuloConcluido?: string;
  variante?: "primario" | "neutro" | "perigo";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const enviando = estado === "enviando";

  const cores = {
    primario: "bg-primary text-primary-foreground hover:brightness-110",
    neutro: "bg-muted text-foreground hover:bg-muted/70",
    perigo: "bg-destructive text-white hover:brightness-110",
  }[variante];

  return (
    <button
      {...props}
      disabled={enviando || props.disabled}
      aria-busy={enviando}
      className={cn(
        "relative inline-grid place-items-center rounded-xl px-4 py-2.5 text-sm font-black transition-all duration-200",
        "disabled:cursor-not-allowed disabled:opacity-70",
        estado === "concluida" && "bg-emerald-500 text-white",
        estado === "erro" && "bg-destructive text-white",
        estado !== "concluida" && estado !== "erro" && cores,
        className
      )}
    >
      {/* Fantasma invisível: segura a maior largura para o botão não pular. */}
      <span className="invisible col-start-1 row-start-1 whitespace-nowrap" aria-hidden>
        {children}
      </span>
      <span className="col-start-1 row-start-1 flex items-center gap-2 whitespace-nowrap">
        {enviando && <Loader2 className="size-4 animate-spin" />}
        {estado === "concluida" && <Check className="size-4 animate-check-pop" />}
        {estado === "erro" && <TriangleAlert className="size-4" />}
        {enviando ? rotuloEnviando : estado === "concluida" ? rotuloConcluido : children}
      </span>
    </button>
  );
}
