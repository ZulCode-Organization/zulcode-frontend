"use client";

import { useMemo, useState } from "react";
import { Dialogo } from "../dialogo";
import { AreaDeTexto, Botao, Escolha } from "../ui";
import { lerPerguntasColadas, nomeDaEtapa } from "./regras";
import type { QuestaoDoRascunho } from "@/lib/admin/tipos";

const EXEMPLO = `Quanto é 2 + 2?
- 3
* 4
- 5

JavaScript roda no navegador.
* Verdadeiro
- Falso`;

/**
 * Colar várias perguntas de uma vez, escritas em texto simples. A contagem e
 * os problemas aparecem enquanto a pessoa cola, antes de adicionar.
 */
export function ColarPerguntas({ etapas, etapaInicial, aoFechar, aoAdicionar }: { etapas: number; etapaInicial: number; aoFechar: () => void; aoAdicionar: (q: QuestaoDoRascunho[]) => void }) {
  const [texto, setTexto] = useState("");
  const [etapa, setEtapa] = useState(etapaInicial);
  const lido = useMemo(() => lerPerguntasColadas(texto, etapa), [texto, etapa]);

  return (
    <Dialogo
      aberto
      aoFechar={aoFechar}
      largura="max-w-2xl"
      titulo="Colar perguntas"
      descricao='Uma linha em branco separa as perguntas. A primeira linha é o enunciado; "*" marca a certa e "-" as erradas.'
      rodape={
        <>
          <span className="mr-auto text-xs text-muted-foreground">
            {lido.questoes.length} {lido.questoes.length === 1 ? "pergunta pronta" : "perguntas prontas"}
            {lido.problemas.length > 0 && ` · ${lido.problemas.length} com problema`}
          </span>
          <Botao variante="fantasma" onClick={aoFechar}>Cancelar</Botao>
          <Botao variante="primario" disabled={!lido.questoes.length} onClick={() => aoAdicionar(lido.questoes)}>
            Adicionar {lido.questoes.length || ""}
          </Botao>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
          <AreaDeTexto value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={EXEMPLO} className="min-h-64 font-mono text-[0.82rem]" autoFocus />
          <div className="space-y-2 text-xs text-muted-foreground">
            <label className="block">
              <span className="mb-1 block font-bold">Colocar na etapa</span>
              <Escolha value={etapa} onChange={(e) => setEtapa(Number(e.target.value))}>
                {Array.from({ length: etapas }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{nomeDaEtapa(n, etapas)}</option>)}
              </Escolha>
            </label>
            <p>Duas opções &ldquo;Verdadeiro&rdquo; e &ldquo;Falso&rdquo; viram uma questão de verdadeiro ou falso.</p>
            <p>Também vale &ldquo;a)&rdquo;, &ldquo;1.&rdquo; e &ldquo;(certa)&rdquo; no fim da opção.</p>
            <button type="button" onClick={() => setTexto(EXEMPLO)} className="font-bold text-primary hover:underline">Ver um exemplo</button>
          </div>
        </div>
        {lido.problemas.length > 0 && (
          <ul className="space-y-1">
            {lido.problemas.map((p) => <li key={p} className="rounded-md bg-amber-500/10 px-2.5 py-1.5 text-xs font-bold text-amber-800 dark:text-amber-200">{p}</li>)}
          </ul>
        )}
      </div>
    </Dialogo>
  );
}
