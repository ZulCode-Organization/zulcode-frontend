"use client";

import { ArrowLeft, ArrowRight, CornerDownRight, Redo2, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApiEditor } from "./editor-codigo";
import type { Linguagem } from "@/lib/playground/tipos";

/** A fileira de símbolos acima do teclado do celular.
 *
 *  Sem ela, escrever HTML no telefone significa abrir o teclado de símbolos
 *  para cada `<`, cada `/` e cada aspas. O conjunto muda com a linguagem porque
 *  as teclas difíceis de cada uma são diferentes: `<` e `=` em HTML, `{` e `;`
 *  em CSS, `=>` e `===` em JavaScript. */

type Tecla = {
  /** O que aparece no botão. */
  rotulo: string;
  /** O que entra no código. Quando difere do rótulo, vem aqui. */
  texto?: string;
  /** Quantos caracteres o cursor volta depois de inserir, para cair no meio
   *  do par recém-aberto. */
  voltar?: number;
  largo?: boolean;
};

const COMUNS: Tecla[] = [
  { rotulo: "(", texto: "()", voltar: 1 },
  { rotulo: "{", texto: "{}", voltar: 1 },
  { rotulo: "[", texto: "[]", voltar: 1 },
  { rotulo: '"', texto: '""', voltar: 1 },
  { rotulo: "'", texto: "''", voltar: 1 },
];

const POR_LINGUAGEM: Record<Linguagem, Tecla[]> = {
  html: [
    { rotulo: "<" },
    { rotulo: ">" },
    { rotulo: "</>", texto: "</>", voltar: 2, largo: true },
    { rotulo: "/" },
    { rotulo: "=" },
    { rotulo: '""', texto: '""', voltar: 1 },
    { rotulo: "class", texto: 'class=""', voltar: 1, largo: true },
    { rotulo: "id", texto: 'id=""', voltar: 1, largo: true },
    { rotulo: "-" },
    { rotulo: "_" },
    { rotulo: "#" },
    { rotulo: "!" },
  ],
  css: [
    { rotulo: "{", texto: "{\n  \n}", voltar: 2 },
    { rotulo: "}" },
    { rotulo: ":" },
    { rotulo: ";" },
    { rotulo: "-" },
    { rotulo: "px" },
    { rotulo: "%" },
    { rotulo: "#" },
    { rotulo: "." },
    { rotulo: "rem" },
    { rotulo: "(", texto: "()", voltar: 1 },
    { rotulo: "," },
    { rotulo: "*" },
    { rotulo: ">" },
  ],
  javascript: [
    { rotulo: "(", texto: "()", voltar: 1 },
    { rotulo: "{", texto: "{}", voltar: 1 },
    { rotulo: "[", texto: "[]", voltar: 1 },
    { rotulo: "=>", texto: " => ", largo: true },
    { rotulo: "===", texto: " === ", largo: true },
    { rotulo: "=" },
    { rotulo: ";" },
    { rotulo: "." },
    { rotulo: "," },
    { rotulo: '"', texto: '""', voltar: 1 },
    { rotulo: "`", texto: "``", voltar: 1 },
    { rotulo: "$", texto: "${}", voltar: 1 },
    { rotulo: "+" },
    { rotulo: "-" },
    { rotulo: "!" },
    { rotulo: "&&", texto: " && ", largo: true },
    { rotulo: "||", texto: " || ", largo: true },
    { rotulo: "<" },
    { rotulo: ">" },
  ],
};

const BOTAO = "zc-press flex h-9 min-w-9 shrink-0 items-center justify-center rounded-lg border " +
  "border-border bg-card px-2 font-mono text-[0.9rem] font-bold text-foreground active:bg-muted";

export function BarraDeTeclas({
  api, linguagem, className,
}: {
  api: ApiEditor | null;
  linguagem: Linguagem;
  className?: string;
}) {
  if (!api) return null;
  const teclas = POR_LINGUAGEM[linguagem];
  // Em CSS as chaves já estão no conjunto da linguagem; repetir ocuparia a
  // fileira sem ganho.
  const extras = linguagem === "css" ? COMUNS.slice(3) : [];

  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-1 border-t border-border bg-muted/40 p-1.5",
        className,
      )}
      // O teclado virtual fecha quando o foco sai do editor; o toque nesta
      // barra não deve tirá-lo.
      onPointerDown={(evento) => evento.preventDefault()}
    >
      <div className="flex shrink-0 items-center gap-1 border-r border-border pr-1.5">
        <button type="button" aria-label="Desfazer" onClick={() => api.comando("desfazer")} className={BOTAO}>
          <Undo2 className="size-4" />
        </button>
        <button type="button" aria-label="Refazer" onClick={() => api.comando("refazer")} className={BOTAO}>
          <Redo2 className="size-4" />
        </button>
        <button type="button" aria-label="Tabulação" onClick={() => api.comando("tab")} className={BOTAO}>
          <CornerDownRight className="size-4" />
        </button>
      </div>

      <div className="zc-barra-teclas flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
        {[...teclas, ...extras].map((tecla, indice) => (
          <button
            key={`${tecla.rotulo}-${indice}`}
            type="button"
            onClick={() => api.inserir(tecla.texto ?? tecla.rotulo, tecla.voltar ?? 0)}
            className={cn(BOTAO, tecla.largo && "px-2.5")}
          >
            {tecla.rotulo}
          </button>
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-1 border-l border-border pl-1.5">
        <button type="button" aria-label="Cursor para a esquerda" onClick={() => api.comando("esquerda")} className={BOTAO}>
          <ArrowLeft className="size-4" />
        </button>
        <button type="button" aria-label="Cursor para a direita" onClick={() => api.comando("direita")} className={BOTAO}>
          <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
