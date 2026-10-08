"use client";

import { useState } from "react";
import { Dialogo } from "./dialogo";

/** Renomear o projeto. O nome aparece na barra de cima, na lista de projetos e
 *  no arquivo exportado. */
export function DialogoNome({
  nome: inicial, aoConfirmar, aoFechar,
}: {
  nome: string;
  aoConfirmar: (nome: string) => void;
  aoFechar: () => void;
}) {
  const [nome, setNome] = useState(inicial);
  const limpo = nome.trim();

  return (
    <Dialogo titulo="Nome do projeto" aoFechar={aoFechar} largura="estreita">
      <form
        className="flex flex-col gap-3 p-3"
        onSubmit={(evento) => {
          evento.preventDefault();
          if (limpo) aoConfirmar(limpo.slice(0, 60));
        }}
      >
        <input
          autoFocus
          value={nome}
          onChange={(evento) => setNome(evento.target.value)}
          maxLength={60}
          aria-label="Nome do projeto"
          className="zc-pg-fundo zc-pg-borda zc-pg-texto h-9 rounded-sm border px-2 text-[0.8rem] outline-none"
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={aoFechar}
            className="zc-pg-botao zc-pg-borda h-8 border px-3 text-[0.75rem]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!limpo}
            className="h-8 rounded-sm px-3 text-[0.75rem] font-bold text-white disabled:opacity-50"
            style={{ background: "var(--pg-acento)" }}
          >
            Salvar
          </button>
        </div>
      </form>
    </Dialogo>
  );
}
