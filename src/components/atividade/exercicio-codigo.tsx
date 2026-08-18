import { Lightbulb } from "lucide-react";
import { PerguntaCodigo } from "@/data/atividades";
import { ResultadoExecucao } from "@/hooks/use-executar-js";
import { CodeBlock } from "./code-block";

interface ExercicioCodigoProps {
  pergunta: PerguntaCodigo;
  onRodar: (resultado: ResultadoExecucao, correto: boolean) => void;
}

/**
 * Compara a saída impressa com a esperada, normalizando o que não deveria
 * reprovar ninguém: espaço sobrando nas pontas e acento em forma decomposta
 * (o "é" que chega como e + acento — comum em teclado de celular e em texto
 * colado de outro lugar; aparece igualzinho na tela, mas não batia no ===).
 *
 * O que a pessoa escreveu em volta do texto (ponto e vírgula no fim, aspas
 * simples ou duplas, quebras de linha) nunca interferiu: a validação roda o
 * código de verdade e olha só o que o console imprimiu.
 */
function mesmaSaida(saida: string, esperado: string): boolean {
  return saida.normalize("NFC").trim() === esperado.normalize("NFC").trim();
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
      resultado.logs.some(
        (linha) => linha.tipo === "log" && mesmaSaida(linha.texto, pergunta.resultadoEsperado)
      );
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
