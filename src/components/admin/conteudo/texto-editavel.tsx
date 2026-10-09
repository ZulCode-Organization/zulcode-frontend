"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Um texto que vira campo ao clicar: Enter salva, Esc desiste, sair do campo
 * salva. Para os nomes da árvore — abrir um diálogo para renomear uma
 * unidade seria cerimônia demais.
 */
export function TextoEditavel({
  valor, aoSalvar, className, vazio = "Sem nome", rotulo,
}: {
  valor: string; aoSalvar: (v: string) => void; className?: string; vazio?: string; rotulo: string;
}) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(valor);

  const terminar = (salvar: boolean) => {
    setEditando(false);
    const limpo = texto.trim();
    if (salvar && limpo !== valor.trim() && (limpo || vazio !== "Sem nome")) aoSalvar(limpo);
    else setTexto(valor);
  };

  if (editando) {
    return (
      <input
        autoFocus
        aria-label={rotulo}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={() => terminar(true)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter") terminar(true);
          if (e.key === "Escape") terminar(false);
        }}
        onClick={(e) => e.stopPropagation()}
        className={cn("min-w-0 max-w-full rounded-md border border-primary bg-background px-1.5 py-0.5 outline-none ring-2 ring-primary/15", className)}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setTexto(valor);
        setEditando(true);
      }}
      title={`Editar: ${rotulo}`}
      className={cn("group/edit inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-md px-1.5 py-0.5 text-left hover:bg-muted", !valor && "text-muted-foreground", className)}
    >
      <span className="truncate">{valor || vazio}</span>
      <Pencil className="size-3 shrink-0 opacity-0 transition-opacity group-hover/edit:opacity-60" />
    </button>
  );
}
