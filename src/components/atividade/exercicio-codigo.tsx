import { Lightbulb } from "lucide-react";
import { PerguntaCodigo } from "@/data/atividades";
import { ResultadoExecucao } from "@/hooks/use-executar-js";
import { CodeBlock } from "./code-block";

interface ExercicioCodigoProps {
  pergunta: PerguntaCodigo;
  onRodar: (resultado: ResultadoExecucao, correto: boolean) => void;
}

/**
 * Escreva o código de verdade: quem responde escreve, roda (o próprio botão
 * "Rodar" do bloco já é a verificação) e a resposta é validada rodando o
 * código de verdade — comparando a saída real com o que era esperado, não
 * comparando texto puro digitado. Pode rodar quantas vezes quiser: errou,
 * ajusta o código e roda de novo — só trava quando clicar em "Continuar".
 */
export function ExercicioCodigo({ pergunta, onRodar }: ExercicioCodigoProps) {
  const aoExecutar = (resultado: ResultadoExecucao) => {
    const correto =
      !resultado.erro &&
      !resultado.esgotouTempo &&
      resultado.logs.some((linha) => linha.tipo === "log" && linha.texto === pergunta.resultadoEsperado);
    onRodar(resultado, correto);
  };

  return (
    <>
      <h1 className="mt-2 text-xl font-black text-foreground sm:text-2xl">{pergunta.enunciado}</h1>

      <div className="mt-3 flex items-start gap-2 rounded-xl bg-accent px-4 py-3 text-[0.85rem] text-accent-foreground">
        <Lightbulb className="mt-0.5 size-4 shrink-0" />
        <span>{pergunta.dica}</span>
      </div>

      <CodeBlock
        className="mt-5"
        valorInicial={pergunta.codigoInicial}
        modo="pergunta"
        titulo="Escreva aqui"
        onExecutar={aoExecutar}
      />
    </>
  );
}
