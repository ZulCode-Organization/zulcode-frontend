"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PALETAS, type Paleta } from "@/lib/playground/temas";
import { Dialogo } from "./dialogo";

/** O escolhedor de tema.
 *
 *  Cada opção mostra um pedaço de código de verdade pintado com a paleta. Uma
 *  fileira de bolinhas de cor não responde a pergunta que importa — "o
 *  comentário vai ficar legível? a string briga com a palavra-chave?" — e é
 *  justamente isso que faz alguém trocar de tema. */

function Amostra({ p }: { p: Paleta }) {
  return (
    <div
      className="zc-pg-mono overflow-hidden rounded-sm px-2 py-1.5 text-[0.62rem] leading-[1.45]"
      style={{ background: p.fundo }}
      aria-hidden
    >
      <div style={{ color: p.comentario, fontStyle: "italic" }}>{"// soma dois números"}</div>
      <div>
        <span style={{ color: p.palavraChave }}>function</span>
        <span style={{ color: p.funcao }}> soma</span>
        <span style={{ color: p.apagado }}>(</span>
        <span style={{ color: p.propriedade }}>a, b</span>
        <span style={{ color: p.apagado }}>) {"{"}</span>
      </div>
      <div>
        <span style={{ color: p.palavraChave }}>{"  return "}</span>
        <span style={{ color: p.texto_ }}>&quot;total: &quot;</span>
        <span style={{ color: p.operador }}> + </span>
        <span style={{ color: p.numero }}>42</span>
        <span style={{ color: p.apagado }}>;</span>
      </div>
      <div style={{ color: p.apagado }}>{"}"}</div>
    </div>
  );
}

export function PainelTemas({
  temaAtual, aoEscolher, aoFechar,
}: {
  temaAtual: string;
  aoEscolher: (id: string) => void;
  aoFechar: () => void;
}) {
  return (
    <Dialogo
      titulo="Tema do código"
      descricao="A tela toda acompanha: barras, abas e painéis usam as cores do tema escolhido."
      aoFechar={aoFechar}
      largura="larga"
    >
      <div className="grid gap-2 p-3 sm:grid-cols-2">
        {PALETAS.map((p) => {
          const escolhido = p.id === temaAtual;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => aoEscolher(p.id)}
              aria-pressed={escolhido}
              className={cn(
                "flex flex-col gap-1.5 rounded-md border p-2 text-left transition-colors",
                escolhido ? "[border-color:var(--pg-acento)]" : "zc-pg-borda hover:[border-color:var(--pg-apagado)]",
              )}
            >
              <span className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-[0.78rem] font-bold">{p.nome}</span>
                <span className="zc-pg-apagado text-[0.65rem]">{p.escuro ? "escuro" : "claro"}</span>
                {escolhido && <Check className="zc-pg-acento size-3.5 shrink-0" />}
              </span>
              <Amostra p={p} />
            </button>
          );
        })}
      </div>
    </Dialogo>
  );
}
