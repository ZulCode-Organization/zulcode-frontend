"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { useExecutarJs, ResultadoExecucao } from "@/hooks/use-executar-js";

interface CodeBlockProps {
  /** Código inicial no editor. */
  valorInicial?: string;
  /** Playground livre (lateral): mantém histórico de execuções, sem
   * validar resposta. Pergunta "escreva o código": mostra só a última
   * execução e chama onExecutar pra quem chamou decidir se acertou. */
  modo?: "playground" | "pergunta";
  onExecutar?: (resultado: ResultadoExecucao) => void;
  titulo?: string;
  className?: string;
}

/**
 * Bloco de código de verdade — não é um terminal: parece um editor comum
 * (fundo claro, como o resto do app), com um botão "Rodar" e a saída
 * aparecendo logo abaixo, num painel separado.
 */
export function CodeBlock({
  valorInicial = "",
  modo = "playground",
  onExecutar,
  titulo = "Seu código",
  className,
}: CodeBlockProps) {
  const { executar, executando } = useExecutarJs();
  const [codigo, setCodigo] = useState(valorInicial);
  const [resultados, setResultados] = useState<ResultadoExecucao[]>([]);
  const saidaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    saidaRef.current?.scrollTo({ top: saidaRef.current.scrollHeight });
  }, [resultados]);

  const rodar = async () => {
    const resultado = await executar(codigo);
    setResultados((atual) => (modo === "playground" ? [...atual, resultado] : [resultado]));
    onExecutar?.(resultado);
  };

  const aoTeclar = (evento: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((evento.metaKey || evento.ctrlKey) && evento.key === "Enter") {
      evento.preventDefault();
      rodar();
    }
  };

  return (
    <div className={cn("flex flex-col overflow-hidden rounded-2xl border border-border bg-card", className)}>
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2.5">
        <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.06em] text-muted-foreground">
          <span className="flex gap-1">
            <span className="size-2 rounded-full bg-red-400" />
            <span className="size-2 rounded-full bg-amber-400" />
            <span className="size-2 rounded-full bg-emerald-400" />
          </span>
          {titulo}
        </span>
        <button
          type="button"
          onClick={rodar}
          disabled={executando}
          className="zc-press flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-[0.72rem] font-black uppercase tracking-[0.05em] text-primary-foreground disabled:opacity-60"
        >
          {executando ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5 fill-current" />}
          Rodar
        </button>
      </div>

      <textarea
        value={codigo}
        onChange={(evento) => setCodigo(evento.target.value)}
        onKeyDown={aoTeclar}
        spellCheck={false}
        rows={modo === "pergunta" ? 4 : 5}
        placeholder="Escreva seu código aqui..."
        className="resize-none bg-transparent px-4 py-3.5 font-mono text-[0.85rem] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/50"
      />

      {resultados.length > 0 && (
        <div ref={saidaRef} className="max-h-48 overflow-y-auto border-t border-border bg-muted/30 px-4 py-3">
          {resultados.map((resultado, indice) => (
            <SaidaExecucao key={indice} resultado={resultado} />
          ))}
        </div>
      )}
    </div>
  );
}

function SaidaExecucao({ resultado }: { resultado: ResultadoExecucao }) {
  if (resultado.esgotouTempo) {
    return (
      <p className="font-mono text-[0.8rem] text-red-500">
        Tempo esgotado — seu código deve ter um loop infinito.
      </p>
    );
  }
  if (resultado.erro) {
    return <p className="font-mono text-[0.8rem] text-red-500">{resultado.erro}</p>;
  }
  if (resultado.logs.length === 0 && resultado.resultado === null) {
    return <p className="font-mono text-[0.8rem] italic text-muted-foreground/70">(sem saída)</p>;
  }
  return (
    <>
      {resultado.logs.map((linha, indice) => (
        <p
          key={indice}
          className={cn(
            "whitespace-pre-wrap break-words font-mono text-[0.8rem]",
            linha.tipo === "erro" && "text-red-500",
            linha.tipo === "aviso" && "text-amber-500",
            linha.tipo === "log" && "text-foreground"
          )}
        >
          {linha.texto}
        </p>
      ))}
      {resultado.resultado !== null && (
        <p className="whitespace-pre-wrap break-words font-mono text-[0.8rem] font-bold text-primary">
          {resultado.resultado}
        </p>
      )}
    </>
  );
}
