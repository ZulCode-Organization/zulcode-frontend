"use client";

import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { BIBLIOTECAS } from "@/lib/playground/bibliotecas";
import { Dialogo } from "./dialogo";

/** Bibliotecas em um clique.
 *
 *  A lista é fechada, com versão fixa. Um campo "cole a URL do script" seria
 *  mais flexível e também seria o jeito mais curto de alguém espalhar código
 *  hostil por um link de projeto compartilhado. */
export function PainelBibliotecas({
  escolhidas, aoAlternar, aoFechar,
}: {
  escolhidas: string[];
  aoAlternar: (id: string) => void;
  aoFechar: () => void;
}) {
  return (
    <Dialogo
      titulo="Bibliotecas"
      descricao="Entram no preview antes do seu código, na ordem desta lista. Não é preciso escrever <script> nenhum."
      aoFechar={aoFechar}
    >
      {BIBLIOTECAS.map((lib) => {
        const ligada = escolhidas.includes(lib.id);
        return (
          <button
            key={lib.id}
            type="button"
            onClick={() => aoAlternar(lib.id)}
            aria-pressed={ligada}
            className="zc-pg-borda flex w-full items-start gap-3 border-b px-3 py-2.5 text-left last:border-b-0 hover:[background:var(--pg-ativo)]"
          >
            <span
              aria-hidden
              className={cn(
                "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm border",
                ligada ? "[background:var(--pg-acento)] [border-color:var(--pg-acento)]" : "zc-pg-borda",
              )}
            >
              {ligada ? <Check className="size-3 text-white" /> : <Plus className="zc-pg-apagado size-2.5" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline gap-2">
                <span className="text-[0.78rem] font-bold">{lib.nome}</span>
                <code className="zc-pg-apagado zc-pg-mono text-[0.65rem]">{lib.global}</code>
              </span>
              <span className="zc-pg-apagado mt-0.5 block text-[0.7rem] leading-4">{lib.descricao}</span>
            </span>
          </button>
        );
      })}
      <p className="zc-pg-apagado zc-pg-borda border-t px-3 py-2.5 text-[0.68rem] leading-4">
        O preview não acessa a internet por conta própria: a biblioteca entra,
        mas o código não consegue enviar dados para fora.
      </p>
    </Dialogo>
  );
}
