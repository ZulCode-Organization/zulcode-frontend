"use client";

import { useState } from "react";
import { ExternalLink, Monitor, RotateCw, Smartphone, Square, Tablet } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExecutionStatus, PreviewDescriptor } from "@/lib/playground/executor";

/** O preview e a régua de tamanhos.
 *
 *  Os tamanhos são os que importam na prática: um celular comum, um tablet e a
 *  largura inteira. Girar existe porque "funciona no celular" quase sempre
 *  significa "funciona em pé" — e o deitado é onde o layout quebra. */

type Tamanho = { id: string; nome: string; largura: number | null; altura: number; Icone: typeof Monitor };

const TAMANHOS: Tamanho[] = [
  { id: "cheio", nome: "Largura inteira", largura: null, altura: 0, Icone: Monitor },
  { id: "celular", nome: "Celular (390 × 844)", largura: 390, altura: 844, Icone: Smartphone },
  { id: "tablet", nome: "Tablet (820 × 1180)", largura: 820, altura: 1180, Icone: Tablet },
];

const ROTULOS: Record<ExecutionStatus, string> = {
  idle: "parado",
  running: "carregando",
  ready: "rodando",
  error: "erro",
  stopped: "encerrado",
};

export function MolduraPreview({
  preview, status, bindFrame, onFrameLoad, aoAbrirFora, className,
}: {
  preview: PreviewDescriptor | null;
  status: ExecutionStatus;
  bindFrame: (frame: HTMLIFrameElement | null) => void;
  onFrameLoad: () => void;
  aoAbrirFora: () => void;
  className?: string;
}) {
  const [tamanhoId, setTamanhoId] = useState("cheio");
  const [deitado, setDeitado] = useState(false);
  const tamanho = TAMANHOS.find((item) => item.id === tamanhoId) ?? TAMANHOS[0];
  const fixo = tamanho.largura !== null;
  const largura = fixo ? (deitado ? tamanho.altura : tamanho.largura) : null;
  const altura = fixo ? (deitado ? tamanho.largura : tamanho.altura) : null;

  return (
    <section className={cn("zc-pg-fundo flex min-h-0 min-w-0 flex-col", className)} aria-label="Preview">
      <header className="zc-pg-barra zc-pg-borda flex h-7 shrink-0 items-center gap-1 border-b px-2">
        <span className="zc-pg-rotulo">Preview</span>

        <div className="ml-1 flex items-center gap-0.5">
          {TAMANHOS.map(({ id, nome, Icone }) => (
            <button
              key={id}
              type="button"
              aria-pressed={tamanhoId === id}
              aria-label={nome}
              title={nome}
              onClick={() => setTamanhoId(id)}
              className="zc-pg-botao size-5"
            >
              <Icone className="size-3" />
            </button>
          ))}
          <button
            type="button"
            aria-pressed={deitado}
            disabled={!fixo}
            aria-label="Girar"
            title={fixo ? "Girar" : "Escolha um tamanho fixo para girar"}
            onClick={() => setDeitado((atual) => !atual)}
            className="zc-pg-botao size-5"
          >
            <RotateCw className="size-3" />
          </button>
        </div>

        {fixo && (
          <span className="zc-pg-apagado zc-pg-mono hidden text-[0.65rem] sm:inline">
            {largura}×{altura}
          </span>
        )}

        <span className="zc-pg-apagado ml-auto text-[0.65rem]" role="status">
          {ROTULOS[status]}
        </span>
        <button
          type="button"
          onClick={aoAbrirFora}
          disabled={!preview}
          aria-label="Abrir o preview em outra aba"
          title="Abrir o preview em outra aba"
          className="zc-pg-botao size-5"
        >
          <ExternalLink className="size-3" />
        </button>
      </header>

      <div
        className={cn(
          "min-h-0 flex-1 overflow-auto",
          fixo && "zc-pg-ativo grid place-items-center p-3",
        )}
      >
        {preview ? (
          <iframe
            key={preview.id}
            ref={bindFrame}
            title="Resultado do seu código"
            // O isolamento vive aqui: origem opaca, sem acesso ao app nem ao
            // armazenamento. É o que torna seguro rodar código de terceiros
            // vindo de um link compartilhado.
            sandbox="allow-scripts"
            referrerPolicy="no-referrer"
            src={preview.url}
            onLoad={onFrameLoad}
            className={cn("border-0 bg-white", fixo ? "zc-pg-borda border shadow-sm" : "size-full")}
            style={fixo ? { width: largura ?? 0, height: altura ?? 0, maxWidth: "100%" } : undefined}
          />
        ) : (
          <div className="zc-pg-apagado grid size-full place-items-center p-4 text-center text-[0.8rem]">
            <span className="flex flex-col items-center gap-2">
              <Square className="size-5" />
              Aperte Ctrl+Enter para rodar.
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
