import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

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
 * `protegido` é o terceiro estado, e vem do gás guardado na conta: roxo com o
 * contorno verde. É a diferença entre "está acesa" e "está acesa e não apaga
 * amanhã", e a cor conta isso sozinha — sem animação, que ficava inquieta num
 * ícone desse tamanho parado ao lado de um número.
 */
export function ChamaDupla({
  className,
  aceso = true,
  protegido = false,
}: {
  className?: string;
  aceso?: boolean;
  /** Há gás de ofensiva guardado. Só vale com a chama acesa: proteger uma
   * sequência que não existe não diria nada. */
  protegido?: boolean;
}) {
  const comGas = aceso && protegido;

  return (
    <span className={cn("relative inline-flex", className)}>
      <Flame
        className={cn(
          "size-full",
          comGas && "fill-violet-600 stroke-emerald-400",
          aceso && !comGas && "fill-blue-600 stroke-sky-400",
          !aceso && "fill-muted-foreground/35 stroke-muted-foreground/60"
        )}
        strokeWidth={2.2}
      />
    </span>
  );
}
