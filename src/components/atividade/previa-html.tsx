"use client";

import { useDeferredValue, useState } from "react";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";

/** Linguagens cujo exemplo é uma página: o resultado é visto, não impresso no console. */
export const LINGUAGENS_DE_PAGINA = ["html", "css"];

/**
 * Estilo de partida da página do exemplo: fundo branco e a fonte do sistema,
 * como num navegador comum, só com um respiro na borda. Vem antes do código da
 * aula, então qualquer CSS do exemplo passa por cima.
 */
const BASE = "<style>html{background:#fff;color:#111}body{margin:12px;font-family:system-ui,sans-serif;font-size:15px}</style>";

/**
 * O exemplo das aulas de HTML e CSS: o código de um lado, a página montada do
 * outro, e dá para mexer no código e ver mudar na hora.
 *
 * A página roda num iframe com `sandbox` vazio: nada de script, formulário que
 * envia, nem acesso ao app. É só o desenho do HTML e do CSS.
 */
export function PreviaHtml({ valorInicial, className }: { valorInicial: string; className?: string }) {
  const [codigo, setCodigo] = useState(valorInicial);
  // A página só redesenha quando a digitação dá uma folga.
  const desenhado = useDeferredValue(codigo);
  const linhas = Math.min(Math.max(codigo.split("\n").length, 3), 14);

  return (
    <div className={cn("overflow-hidden rounded-2xl border-2 border-border", className)}>
      <div className="flex items-center justify-between border-b-2 border-border bg-muted/50 px-4 py-2">
        <span className="font-mono text-xs font-bold text-muted-foreground">Mude e veja</span>
        {codigo !== valorInicial && (
          <button type="button" onClick={() => setCodigo(valorInicial)} className="text-xs font-bold text-primary hover:underline">
            Voltar ao original
          </button>
        )}
      </div>
      <textarea
        value={codigo}
        onChange={(e) => setCodigo(e.target.value)}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        rows={linhas}
        aria-label="Código do exemplo"
        className="block w-full resize-none bg-muted/30 px-4 py-3 font-mono text-[0.85rem] leading-relaxed text-foreground outline-none"
      />
      <div className="border-t-2 border-border">
        <p className="flex items-center gap-1.5 bg-muted/50 px-4 py-1.5 text-[0.7rem] font-black uppercase tracking-[0.08em] text-muted-foreground">
          <Eye className="size-3.5" />
          Na tela
        </p>
        <iframe
          title="Como o exemplo aparece na tela"
          sandbox=""
          srcDoc={BASE + desenhado}
          className="block h-44 w-full bg-white"
        />
      </div>
    </div>
  );
}
