import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

/** As faixas da sequência. O roxo não aparece aqui de propósito: roxo com
 *  contorno verde é o gás, e uma chama roxa por tempo de sequência faria as
 *  duas coisas parecerem a mesma. As classes são literais porque o Tailwind só
 *  gera o que consegue ler no código. */
export type FaixaDaChama = {
  id: "azul" | "ciano" | "dourada";
  /** A partir de quantos dias. */
  desde: number;
  corpo: string;
  contorno: string;
  /** Cor do número ao lado, na barra. */
  texto: string;
  /** Fundo sólido na mesma cor, para os dias da semana na dica. */
  fundo: string;
  nome: string;
};

export const FAIXAS_DA_CHAMA: FaixaDaChama[] = [
  { id: "azul", desde: 0, corpo: "fill-blue-600", contorno: "stroke-sky-400", texto: "text-blue-600", fundo: "bg-blue-600", nome: "Chama azul" },
  { id: "ciano", desde: 30, corpo: "fill-cyan-500", contorno: "stroke-cyan-200", texto: "text-cyan-500", fundo: "bg-cyan-500", nome: "Chama ciano" },
  { id: "dourada", desde: 100, corpo: "fill-amber-400", contorno: "stroke-amber-200", texto: "text-amber-500", fundo: "bg-amber-400", nome: "Chama dourada" },
];

export function faixaDaChama(dias: number | null | undefined): FaixaDaChama {
  const total = dias ?? 0;
  return [...FAIXAS_DA_CHAMA].reverse().find((faixa) => total >= faixa.desde) ?? FAIXAS_DA_CHAMA[0];
}

/**
 * A chama da sequência.
 *
 * São duas cores: o corpo dá a massa, e o contorno mais claro destaca a
 * silhueta do fundo — é ele que faz o ícone não virar um borrão quando fica
 * pequeno na barra de cima.
 *
 * As cores não vêm de `currentColor` porque são duas ao mesmo tempo, e
 * `currentColor` só carrega uma. Por isso o estado entra por `aceso`: quando a
 * sequência apaga, as duas apagam juntas.
 *
 * A cor também conta tempo: azul até 29 dias, ciano a partir de 30, dourada a
 * partir de 100. É um troféu que a pessoa carrega na barra sem precisar abrir
 * nada — e só existe com a chama acesa.
 *
 * `protegido` é o estado do gás guardado na conta: roxo com o contorno verde,
 * e ele vale acima da faixa. Saber que a sequência não apaga amanhã importa
 * mais do que saber há quanto tempo ela existe.
 *
 * Não há animação aqui, de propósito. A chama parada ao lado de um número é o
 * estado normal; quem anima os momentos (subir, vacilar, o brilho do gás) é a
 * barra, uma vez, quando o momento acontece.
 */
export function ChamaDupla({
  className,
  aceso = true,
  protegido = false,
  dias,
}: {
  className?: string;
  aceso?: boolean;
  /** Há gás de ofensiva guardado. Só vale com a chama acesa: proteger uma
   * sequência que não existe não diria nada. */
  protegido?: boolean;
  /** Dias de sequência. Sem ele a chama fica na primeira faixa, azul. */
  dias?: number | null;
}) {
  const comGas = aceso && protegido;
  const faixa = faixaDaChama(dias);

  return (
    <span className={cn("relative inline-flex", className)}>
      <Flame
        className={cn(
          "size-full transition-[fill,stroke] duration-500",
          comGas && "fill-violet-600 stroke-emerald-400",
          aceso && !comGas && [faixa.corpo, faixa.contorno],
          !aceso && "fill-muted-foreground/35 stroke-muted-foreground/60"
        )}
        strokeWidth={2.2}
      />
    </span>
  );
}
