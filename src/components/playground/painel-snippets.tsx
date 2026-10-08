"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  lerSnippets, salvarSnippets, SNIPPETS_PADRAO, type SnippetSalvo,
} from "@/lib/playground/snippets";
import { novoId } from "@/lib/playground/arquivos";
import type { Linguagem } from "@/lib/playground/tipos";
import { Dialogo, LinhaPainel } from "./dialogo";

/** Os snippets do usuário.
 *
 *  Os de fábrica já cobrem o básico; isto é para o trecho que cada um repete no
 *  próprio projeto. Ficam neste aparelho, como os ajustes. */

const LINGUAGENS: { id: Linguagem; nome: string }[] = [
  { id: "javascript", nome: "JavaScript" },
  { id: "html", nome: "HTML" },
  { id: "css", nome: "CSS" },
];

export function PainelSnippets({ aoFechar }: { aoFechar: () => void }) {
  const [meus, setMeus] = useState<SnippetSalvo[]>(() => lerSnippets());
  const [atalho, setAtalho] = useState("");
  const [descricao, setDescricao] = useState("");
  const [corpo, setCorpo] = useState("");
  const [linguagem, setLinguagem] = useState<Linguagem>("javascript");
  const [erro, setErro] = useState<string | null>(null);

  const guardar = (lista: SnippetSalvo[]) => {
    setMeus(lista);
    if (!salvarSnippets(lista)) setErro("Não deu para guardar neste aparelho.");
  };

  const criar = () => {
    const limpo = atalho.trim();
    if (!/^[\w-]{1,24}$/.test(limpo)) {
      setErro("O atalho aceita letras, números, hífen e sublinhado, até 24 caracteres.");
      return;
    }
    if (!corpo.trim()) { setErro("Escreva o que o atalho deve inserir."); return; }
    if (meus.some((item) => item.atalho === limpo && item.linguagem === linguagem)) {
      setErro("Já existe um atalho com esse nome nessa linguagem.");
      return;
    }
    setErro(null);
    guardar([...meus, {
      id: novoId(), atalho: limpo, linguagem, corpo,
      descricao: descricao.trim() || "meu snippet",
    }]);
    setAtalho("");
    setDescricao("");
    setCorpo("");
  };

  const campo = "zc-pg-fundo zc-pg-borda zc-pg-texto rounded-sm border px-2 py-1.5 text-[0.75rem] outline-none";

  return (
    <Dialogo
      titulo="Meus snippets"
      descricao="Digite o atalho no editor e ele vira o trecho inteiro. Use ${nome} para marcar onde o cursor para — o Tab pula de um para o outro."
      aoFechar={aoFechar}
    >
      {meus.length > 0 && meus.map((snippet) => (
        <LinhaPainel key={snippet.id}>
          <code className="zc-pg-mono zc-pg-acento shrink-0 text-[0.75rem]">{snippet.atalho}</code>
          <span className="min-w-0 flex-1">
            <span className="block truncate">{snippet.descricao}</span>
            <span className="zc-pg-apagado block text-[0.68rem]">
              {LINGUAGENS.find((item) => item.id === snippet.linguagem)?.nome}
            </span>
          </span>
          <button
            type="button"
            onClick={() => guardar(meus.filter((item) => item.id !== snippet.id))}
            aria-label={`Apagar o snippet ${snippet.atalho}`}
            className="zc-pg-botao size-6 shrink-0"
          >
            <Trash2 className="size-3" />
          </button>
        </LinhaPainel>
      ))}

      <form
        className="zc-pg-borda flex flex-col gap-2 border-t p-3"
        onSubmit={(evento) => { evento.preventDefault(); criar(); }}
      >
        <div className="flex gap-2">
          <input
            value={atalho}
            onChange={(evento) => setAtalho(evento.target.value)}
            placeholder="atalho"
            aria-label="Atalho"
            spellCheck={false}
            className={`${campo} zc-pg-mono w-28 shrink-0`}
          />
          <select
            value={linguagem}
            onChange={(evento) => setLinguagem(evento.target.value as Linguagem)}
            aria-label="Linguagem"
            className={`${campo} shrink-0`}
          >
            {LINGUAGENS.map((item) => (
              <option key={item.id} value={item.id}>{item.nome}</option>
            ))}
          </select>
          <input
            value={descricao}
            onChange={(evento) => setDescricao(evento.target.value)}
            placeholder="o que faz"
            aria-label="Descrição"
            className={`${campo} min-w-0 flex-1`}
          />
        </div>
        <textarea
          value={corpo}
          onChange={(evento) => setCorpo(evento.target.value)}
          placeholder={'console.log("${valor}");'}
          aria-label="O que o atalho insere"
          rows={4}
          spellCheck={false}
          className={`${campo} zc-pg-mono resize-y`}
        />
        {erro && <p role="alert" className="zc-pg-erro text-[0.7rem]">{erro}</p>}
        <button
          type="submit"
          className="flex h-8 items-center justify-center gap-1.5 rounded-sm text-[0.75rem] font-bold text-white"
          style={{ background: "var(--pg-acento)" }}
        >
          <Plus className="size-3.5" /> Criar snippet
        </button>
        <p className="zc-pg-apagado text-[0.68rem] leading-4">
          Já vêm {SNIPPETS_PADRAO.length} prontos — digite <code className="zc-pg-mono">for</code>,{" "}
          <code className="zc-pg-mono">clique</code> ou <code className="zc-pg-mono">centro</code> no
          editor para ver.
        </p>
      </form>
    </Dialogo>
  );
}
