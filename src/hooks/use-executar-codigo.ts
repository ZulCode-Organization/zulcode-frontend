"use client";

import { useState } from "react";
import { PythonExecutor } from "@/lib/playground/python-executor";
import {
  useExecutarJs,
  type LinhaLog,
  type ResultadoExecucao,
} from "./use-executar-js";

/** As linguagens cujo código roda no próprio aparelho, dentro da aula. */
export const LINGUAGENS_QUE_RODAM = [
  "javascript",
  "typescript",
  "python",
] as const;
export type LinguagemQueRoda = (typeof LINGUAGENS_QUE_RODAM)[number];

export const rodaNoAparelho = (
  linguagem?: string,
): linguagem is LinguagemQueRoda | undefined =>
  !linguagem || (LINGUAGENS_QUE_RODAM as readonly string[]).includes(linguagem);

// Um Python só para todas as aulas: o Pyodide pesa uns 10 MB e demora a
// subir; carregado uma vez, as questões seguintes rodam na hora.
let python: PythonExecutor | null = null;
const pegarPython = () => (python ??= new PythonExecutor());

/** Começa a baixar o Python antes da primeira questão que precisa dele. */
export const prepararPython = () => pegarPython().preparar();

function rodarPython(codigo: string): Promise<ResultadoExecucao> {
  const executor = pegarPython();
  return new Promise((resolve) => {
    let comecou = false;
    const sair = executor.subscribe(() => {
      const s = executor.getSnapshot();
      if (s.status === "running") {
        comecou = true;
        return;
      }
      if (!comecou) return;
      sair();
      const linhas: LinhaLog[] = s.logs
        .filter((l) => !l.text.startsWith("Preparando o Python"))
        .map((l) => ({
          tipo:
            l.tone === "error"
              ? "erro"
              : l.tone === "warning"
                ? "aviso"
                : "log",
          texto: l.text,
        }));
      const erros = linhas.filter((l) => l.tipo === "erro").map((l) => l.texto);
      resolve({
        logs: linhas.filter((l) => l.tipo !== "erro"),
        resultado: null,
        erro:
          s.status === "error"
            ? erros.join("\n") || "Não deu para rodar o código."
            : null,
        esgotouTempo: false,
      });
    });
    executor.run([{ nome: "main.py", conteudo: codigo }], "main.py");
    if (!comecou) {
      sair();
      resolve({
        logs: [],
        resultado: null,
        erro: "Já tem um código rodando. Espere ele terminar.",
        esgotouTempo: false,
      });
    }
  });
}

/** TypeScript roda como JavaScript: os tipos saem antes (o sucrase só é baixado quando precisa). */
async function tirarTipos(codigo: string) {
  const { transform } = await import("sucrase");
  return transform(codigo, {
    transforms: ["typescript"],
    disableESTransforms: true,
  }).code;
}

/**
 * Roda o código da aula na linguagem dela. Mesmo resultado do executor de
 * JavaScript (`logs`, `resultado`, `erro`), para os componentes não precisarem
 * saber qual linguagem está por trás.
 *
 * - JavaScript: Web Worker isolado; um `return` no fim vira `resultado`.
 * - TypeScript: os tipos saem e o resto roda como JavaScript.
 * - Python: Pyodide; só há `logs` (o que o print mostrou).
 */
export function useExecutarCodigo(linguagem: string | undefined) {
  const js = useExecutarJs();
  const [rodandoPython, setRodandoPython] = useState(false);

  const executar = async (codigo: string): Promise<ResultadoExecucao> => {
    if (linguagem === "python") {
      setRodandoPython(true);
      try {
        return await rodarPython(codigo);
      } finally {
        setRodandoPython(false);
      }
    }
    if (linguagem === "typescript") {
      let semTipos: string;
      try {
        semTipos = await tirarTipos(codigo);
      } catch (e) {
        return {
          logs: [],
          resultado: null,
          erro:
            e instanceof Error ? e.message : "O código tem um erro de escrita.",
          esgotouTempo: false,
        };
      }
      return js.executar(semTipos);
    }
    return js.executar(codigo);
  };

  return { executar, executando: js.executando || rodandoPython };
}
