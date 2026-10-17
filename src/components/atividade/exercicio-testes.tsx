"use client";

import { useEffect, useRef, useState } from "react";
import { Lightbulb, Loader2, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { PerguntaTestes } from "@/data/atividades";
import { useExecutarJs } from "@/hooks/use-executar-js";
import { EditorDeCodigo } from "./editor-de-codigo";

interface ExercicioTestesProps {
  pergunta: PerguntaTestes;
  /** No projeto guiado, o código com que o passo começa (o do passo anterior). */
  codigoDeInicio?: string;
  /** O código escrito até agora, para o próximo passo do projeto continuar dele. */
  onCodigo?: (codigo: string) => void;
  /** Chamado quando todos os testes passam. Errar não custa nada aqui. */
  onPassou: () => void;
  /** O código só roda no aparelho quando a aula é de JavaScript. */
  podeRodar: boolean;
}

type EstadoDoTeste = { estado: "parado" | "rodando" | "passou" | "falhou"; deu?: string };

const mostrar = (valor: unknown) => (valor === undefined ? "undefined" : JSON.stringify(valor));

/** JSON com as chaves em ordem: o banco reordena as chaves dos objetos
 *  esperados, então a comparação não pode depender da ordem em que foram escritas. */
function ordenarChaves(_chave: string, valor: unknown) {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return valor;
  const objeto = valor as Record<string, unknown>;
  return Object.fromEntries(Object.keys(objeto).sort().map((chave) => [chave, objeto[chave]]));
}
const canonico = (valor: unknown) => (valor === undefined ? "undefined" : JSON.stringify(valor, ordenarChaves));

/**
 * O código que vai para o executor: o da pessoa e, depois, cada teste chamando
 * a função. Um teste que quebra não derruba os outros.
 */
function montarExecucao(codigo: string, nome: string, testes: PerguntaTestes["testes"]) {
  return `${codigo}
;return JSON.stringify((${JSON.stringify(testes.map((t) => t.args))}).map((args) => {
  try {
    if (typeof ${nome} !== "function") return { erro: "A função ${nome} não existe" };
    const v = ${nome}(...args);
    return { v: v === undefined ? "__indefinido__" : JSON.stringify(v, ${ordenarChaves.toString()}) };
  } catch (e) { return { erro: String((e && e.message) || e) }; }
}));`;
}

/** Escrever uma função de verdade: os testes rodam e cada um diz se passou. */
export function ExercicioTestes({ pergunta, codigoDeInicio, onCodigo, onPassou, podeRodar }: ExercicioTestesProps) {
  const { executar, executando } = useExecutarJs();
  const [codigo, setCodigo] = useState(codigoDeInicio ?? pergunta.codigoInicial);
  const [estados, setEstados] = useState<EstadoDoTeste[]>(() => pergunta.testes.map(() => ({ estado: "parado" })));
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [dicas, setDicas] = useState(0);
  const [verSolucao, setVerSolucao] = useState(false);
  const passouRef = useRef(false);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  useEffect(() => onCodigo?.(codigo), [codigo, onCodigo]);

  const testar = async () => {
    if (!podeRodar || executando) return;
    setErroGeral(null);
    setEstados(pergunta.testes.map(() => ({ estado: "rodando" })));
    const resultado = await executar(montarExecucao(codigo, pergunta.nomeDaFuncao, pergunta.testes));
    let respostas: { v?: string; erro?: string }[] = [];
    if (resultado.esgotouTempo) setErroGeral("O código demorou demais (será que tem um laço infinito?).");
    else if (resultado.erro) setErroGeral(resultado.erro);
    else {
      try {
        respostas = JSON.parse(resultado.resultado ?? "[]");
      } catch {
        setErroGeral("Não deu para ler o resultado dos testes.");
      }
    }
    // Um teste de cada vez, para dar para acompanhar.
    pergunta.testes.forEach((teste, k) => {
      timers.current.push(
        window.setTimeout(() => {
          const r = respostas[k];
          const esperado = canonico(teste.esperado);
          const deu = r?.erro ? `erro: ${r.erro}` : r?.v === "__indefinido__" ? "undefined" : r?.v ?? "nada";
          const ok = !!r && !r.erro && deu === esperado;
          setEstados((atual) => atual.map((e, j) => (j === k ? { estado: ok ? "passou" : "falhou", deu } : e)));
          const todos = respostas.length === pergunta.testes.length && pergunta.testes.every((t, j) => {
            const rj = respostas[j];
            return rj && !rj.erro && (rj.v === "__indefinido__" ? "undefined" : rj.v) === canonico(t.esperado);
          });
          if (k === pergunta.testes.length - 1 && todos && !passouRef.current) {
            passouRef.current = true;
            onPassou();
          }
        }, 300 + k * 320)
      );
    });
  };

  return (
    <>
      <h1 className="text-xl font-black leading-snug text-foreground sm:text-2xl">{pergunta.enunciado}</h1>

      <EditorDeCodigo
        className="mt-4"
        valor={codigo}
        onMudar={setCodigo}
        rotulo="solucao.js"
        acao={
          <button
            type="button"
            onClick={testar}
            disabled={!podeRodar || executando}
            data-cor="verde"
            className="zc-aula-botao h-10 w-auto rounded-xl px-4 text-[0.8rem]"
          >
            {executando ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4 fill-current" />}
            Testar
          </button>
        }
      />

      {!podeRodar && (
        <p className="mt-3 text-sm font-bold text-muted-foreground">Os testes desta linguagem ainda não rodam no aparelho.</p>
      )}
      {erroGeral && <p className="mt-3 rounded-2xl bg-[#ff4b4b]/10 px-4 py-3 font-mono text-[0.8rem] font-bold text-[#ea2b2b] dark:text-[#ff8a8a]">{erroGeral}</p>}

      <div className="mt-4 flex flex-col gap-2">
        {pergunta.testes.map((teste, k) => {
          const e = estados[k];
          return (
            <div
              key={k}
              className={cn(
                "flex items-center gap-3 rounded-2xl border-2 px-3 py-2.5 font-mono text-[0.8rem] font-bold transition-colors",
                e.estado === "passou" && "border-[#22c55e]/50 bg-[#22c55e]/5",
                e.estado === "falhou" && "border-[#ff4b4b]/50 bg-[#ff4b4b]/5",
                (e.estado === "parado" || e.estado === "rodando") && "border-border"
              )}
            >
              <span
                className={cn(
                  "size-5 shrink-0 rounded-full",
                  e.estado === "parado" && "border-[3px] border-muted-foreground/30",
                  e.estado === "rodando" && "animate-spin border-[3px] border-muted-foreground/30 border-t-[#1892ff]",
                  e.estado === "passou" && "zc-aula-bola-pula bg-[#22c55e]",
                  e.estado === "falhou" && "bg-[#ff4b4b]"
                )}
              />
              <span className="min-w-0">
                {pergunta.nomeDaFuncao}({teste.args.map(mostrar).join(", ")}) é {mostrar(teste.esperado)}
                {e.estado === "falhou" && <small className="block font-medium text-[#ea2b2b] dark:text-[#ff9b9b]">deu {e.deu}</small>}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {pergunta.dicas.slice(0, dicas).map((dica, k) => (
          <div key={k} className="zc-aula-entra-um flex gap-2.5 rounded-2xl bg-amber-400/10 px-4 py-3 text-[0.88rem] font-bold leading-snug text-amber-700 dark:text-amber-200">
            <Lightbulb className="mt-0.5 size-4 shrink-0" />
            <span>
              Dica {k + 1} de {pergunta.dicas.length}: {dica}
            </span>
          </div>
        ))}
        {verSolucao && pergunta.solucao && (
          <pre className="zc-aula-entra-um overflow-x-auto rounded-2xl border-2 border-dashed border-border px-4 py-3 font-mono text-[0.8rem] text-foreground">{pergunta.solucao}</pre>
        )}
        {dicas < pergunta.dicas.length ? (
          <button type="button" onClick={() => setDicas((n) => n + 1)} className="flex items-center gap-1.5 self-start text-[0.85rem] font-black text-amber-600 dark:text-amber-400">
            <Lightbulb className="size-4" />
            Preciso de uma dica
          </button>
        ) : (
          pergunta.solucao &&
          !verSolucao && (
            <button type="button" onClick={() => setVerSolucao(true)} className="self-start text-[0.85rem] font-black text-muted-foreground underline underline-offset-4">
              Ver a solução
            </button>
          )
        )}
      </div>
    </>
  );
}
