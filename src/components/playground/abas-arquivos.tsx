"use client";

import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { linguagemDe } from "@/lib/playground/arquivos";
import type { Arquivo, Linguagem } from "@/lib/playground/tipos";

/** As abas dos arquivos. Sem lateral de arquivos: a aba é o arquivo, como em
 *  qualquer editor, e a cor do pontinho diz a linguagem sem precisar de ícone
 *  dentro de quadradinho. */

const COR: Record<Linguagem, string> = {
  html: "#e8743b",
  css: "#3b82c4",
  javascript: "#e0b336",
};

export function AbasArquivos({
  arquivos, ativoId, aoEscolher, aoFechar, aoCriar, aoRenomear,
}: {
  arquivos: Arquivo[];
  ativoId: string;
  aoEscolher: (id: string) => void;
  aoFechar: (id: string) => void;
  aoCriar: () => void;
  aoRenomear: (id: string) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Arquivos do projeto"
      className="zc-pg-barra zc-pg-borda zc-barra-teclas flex h-9 shrink-0 items-stretch overflow-x-auto border-b"
    >
      {arquivos.map((arquivo) => {
        const ativo = arquivo.id === ativoId;
        return (
          <div
            key={arquivo.id}
            className={cn(
              "zc-pg-aba zc-pg-borda group flex shrink-0 items-center gap-2 border-r pr-1 pl-2.5",
              ativo && "z-10",
            )}
            aria-selected={ativo}
            role="tab"
          >
            <button
              type="button"
              // Clicar abre; clicar duas vezes renomeia. É o gesto que as
              // pessoas já tentam por conta própria.
              onClick={() => aoEscolher(arquivo.id)}
              onDoubleClick={() => aoRenomear(arquivo.id)}
              className="zc-pg-mono flex items-center gap-2 py-1.5 text-[0.78rem]"
              title={`${arquivo.nome} — dois cliques para renomear`}
            >
              <span
                aria-hidden
                className="size-1.5 shrink-0 rounded-full"
                style={{ background: COR[linguagemDe(arquivo.nome)] }}
              />
              {arquivo.nome}
            </button>
            {arquivos.length > 1 && (
              <button
                type="button"
                onClick={() => aoFechar(arquivo.id)}
                aria-label={`Apagar ${arquivo.nome}`}
                title={`Apagar ${arquivo.nome}`}
                className={cn(
                  "zc-pg-botao size-5 opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
                  ativo && "opacity-60",
                )}
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={aoCriar}
        aria-label="Novo arquivo"
        title="Novo arquivo"
        className="zc-pg-botao mx-1 my-1 size-7 shrink-0"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
