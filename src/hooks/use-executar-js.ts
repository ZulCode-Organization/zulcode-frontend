"use client";

import { useEffect, useRef, useState } from "react";

export interface LinhaLog {
  tipo: "log" | "erro" | "aviso";
  texto: string;
}

export interface ResultadoExecucao {
  logs: LinhaLog[];
  resultado: string | null;
  erro: string | null;
  esgotouTempo: boolean;
}

const TIMEOUT_MS = 3000;

/**
 * Roda código JavaScript de verdade num Web Worker isolado (thread separada
 * da página — se o código tiver loop infinito, só o worker trava, o app
 * continua funcionando, e o worker é encerrado sozinho depois do timeout).
 * Compartilhado pelo playground da lateral e pelas perguntas do tipo
 * "escreva o código", que rodam a resposta de verdade pra validar.
 */
export function useExecutarJs() {
  const [executando, setExecutando] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const encerrarWorkerAtual = () => {
    workerRef.current?.terminate();
    workerRef.current = null;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  useEffect(() => encerrarWorkerAtual, []);

  const executar = (codigo: string): Promise<ResultadoExecucao> => {
    return new Promise((resolve) => {
      encerrarWorkerAtual();
      setExecutando(true);

      const worker = new Worker("/js-worker.js");
      workerRef.current = worker;
      worker.postMessage(codigo);

      timeoutRef.current = setTimeout(() => {
        encerrarWorkerAtual();
        setExecutando(false);
        resolve({ logs: [], resultado: null, erro: null, esgotouTempo: true });
      }, TIMEOUT_MS);

      worker.onmessage = (evento) => {
        encerrarWorkerAtual();
        setExecutando(false);
        const dados = evento.data as { logs: LinhaLog[]; resultado: string | null; erro: string | null };
        resolve({ ...dados, esgotouTempo: false });
      };

      worker.onerror = () => {
        encerrarWorkerAtual();
        setExecutando(false);
        resolve({ logs: [], resultado: null, erro: "Não deu pra rodar esse código.", esgotouTempo: false });
      };
    });
  };

  return { executar, executando };
}
