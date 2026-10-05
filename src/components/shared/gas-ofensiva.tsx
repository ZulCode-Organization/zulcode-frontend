import { Fuel } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * O gás da ofensiva: o combustível que mantém o fogo da sequência aceso.
 *
 * Substitui o escudo que representava o item antigo ("congelar"). Escudo diz
 * "bloqueia alguma coisa"; aqui a ideia é o contrário — o item não trava nada,
 * ele alimenta a chama num dia perdido.
 *
 * É um desenho só. A primeira versão era um cilindro com uma chama no canto, e
 * no tamanho que a loja usa os dois traços se atropelavam.
 *
 * O roxo é o mesmo que a chama assume quando há gás guardado, e é o que liga o
 * item ao efeito sem precisar de legenda.
 */
export function GasOfensiva({ className }: { className?: string }) {
  return <Fuel className={cn("text-violet-500", className)} strokeWidth={2.2} />;
}
