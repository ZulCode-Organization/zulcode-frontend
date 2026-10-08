"use client";

import { Ban, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConsoleEntry } from "@/lib/playground/executor";

/** O console. Chapado, monoespaçado, com o prefixo marcando o tom em vez de um
 *  balão colorido para cada linha — ler cem linhas de log pede contraste de
 *  texto, não de caixa. */

const PREFIXO: Record<ConsoleEntry["tone"], string> = {
  normal: "›",
  warning: "!",
  error: "✕",
  success: "✓",
};

function corDoTom(tom: ConsoleEntry["tone"]) {
  if (tom === "error") return "var(--pg-erro)";
  if (tom === "warning") return "#d9a01f";
  if (tom === "success") return "#3aa76d";
  return "var(--pg-texto)";
}

export function ConsolePlayground({
  logs, rodando, aoLimpar, className,
}: {
  logs: ConsoleEntry[];
  rodando: boolean;
  aoLimpar: () => void;
  className?: string;
}) {
  return (
    <section className={cn("zc-pg-fundo flex min-h-0 min-w-0 flex-col", className)} aria-label="Console">
      <header className="zc-pg-barra zc-pg-borda flex h-7 shrink-0 items-center gap-2 border-b px-2">
        <span className="zc-pg-rotulo">Console</span>
        {logs.length > 0 && <span className="zc-pg-apagado text-[0.65rem]">{logs.length}</span>}
        <button
          type="button"
          onClick={aoLimpar}
          disabled={!logs.length}
          aria-label="Limpar console"
          title="Limpar console"
          className="zc-pg-botao ml-auto size-5"
        >
          <Trash2 className="size-3" />
        </button>
      </header>

      <div
        role="log"
        aria-live="polite"
        className="zc-selecionavel zc-pg-mono min-h-0 flex-1 overflow-auto p-2 text-[0.75rem] leading-5"
      >
        {logs.length ? logs.map((log) => (
          <div key={log.id} className="flex gap-2 py-px">
            <span aria-hidden className="shrink-0 select-none" style={{ color: corDoTom(log.tone) }}>
              {PREFIXO[log.tone]}
            </span>
            <pre
              className="min-w-0 flex-1 whitespace-pre-wrap break-words"
              style={{ color: corDoTom(log.tone) }}
            >
              {log.text}
            </pre>
          </div>
        )) : (
          <p className="zc-pg-apagado flex items-center gap-2">
            <Ban className="size-3" />
            {rodando ? "Executando…" : "Nada no console ainda."}
          </p>
        )}
      </div>
    </section>
  );
}
