"use client";

import { useState } from "react";
import { erroDeNome } from "@/lib/playground/arquivos";
import type { Arquivo } from "@/lib/playground/tipos";
import { Dialogo } from "./dialogo";

/** Criar ou renomear arquivo.
 *
 *  A extensão é o que decide a linguagem, então o campo valida enquanto se
 *  digita e explica o que falta, em vez de recusar no fim com "nome inválido".
 */
export function DialogoArquivo({
  arquivos, editando, aoConfirmar, aoFechar,
}: {
  arquivos: Arquivo[];
  /** O arquivo sendo renomeado, ou null para criar um novo. */
  editando: Arquivo | null;
  aoConfirmar: (nome: string) => void;
  aoFechar: () => void;
}) {
  const [nome, setNome] = useState(editando?.nome ?? "");
  const [tentou, setTentou] = useState(false);
  const erro = erroDeNome(nome, arquivos, editando?.id);
  const mostrarErro = tentou && erro;

  const confirmar = () => {
    setTentou(true);
    if (!erro) aoConfirmar(nome.trim());
  };

  return (
    <Dialogo
      titulo={editando ? `Renomear ${editando.nome}` : "Novo arquivo"}
      descricao="A extensão define a linguagem: .html, .css ou .js."
      aoFechar={aoFechar}
      largura="estreita"
    >
      <form
        className="flex flex-col gap-3 p-3"
        onSubmit={(evento) => { evento.preventDefault(); confirmar(); }}
      >
        <input
          autoFocus
          value={nome}
          onChange={(evento) => setNome(evento.target.value)}
          onBlur={() => setTentou(true)}
          placeholder="pagina.html"
          aria-label="Nome do arquivo"
          aria-invalid={!!mostrarErro}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          className="zc-pg-mono zc-pg-fundo h-9 rounded-sm border px-2 text-[0.8rem] outline-none"
          style={{ borderColor: mostrarErro ? "var(--pg-erro)" : "var(--pg-borda)" }}
        />
        {mostrarErro ? (
          <p role="alert" className="zc-pg-erro text-[0.7rem] leading-4">{erro}</p>
        ) : (
          <p className="zc-pg-apagado text-[0.7rem] leading-4">
            Os .css e os .js do projeto entram no preview na ordem das abas.
          </p>
        )}
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
            className="h-8 rounded-sm px-3 text-[0.75rem] font-bold text-white"
            style={{ background: "var(--pg-acento)" }}
          >
            {editando ? "Renomear" : "Criar"}
          </button>
        </div>
      </form>
    </Dialogo>
  );
}
