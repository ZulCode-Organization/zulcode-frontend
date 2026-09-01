"use client";

import { useEffect, useRef, useState } from "react";
import { Feather, Infinity as Infinito } from "lucide-react";
import { cn } from "@/lib/utils";

/** Dispara uma vez quando o número cai, e não quando ele apenas é baixo. */
function useTremorAoPerder(valor: number) {
  const [tremendo, setTremendo] = useState(false);
  const anterior = useRef(valor);

  useEffect(() => {
    const caiu = valor < anterior.current;
    anterior.current = valor;
    if (!caiu) return;

    setTremendo(true);
    const id = setTimeout(() => setTremendo(false), 520);
    return () => clearTimeout(id);
  }, [valor]);

  return tremendo;
}

/**
 * A pena da vida.
 *
 * O desenho é o `Feather` do lucide, limpo e sem nada por cima. Houve uma
 * tentativa de gastar a pena conforme as vidas caíam, com máscara: ficou ruim
 * em qualquer tamanho que a barra usa, então saiu inteira.
 *
 * O que sobrou é o tremor: quando o número cai, a pena estremece uma vez. Ele
 * dispara na queda e não no valor em si, então recarregar a página com 2 penas
 * não sacode nada — só perder a segunda sacode.
 */
export function PenaDesgastada({
  restantes,
  maximo = 5,
  className,
}: {
  restantes: number;
  maximo?: number;
  className?: string;
}) {
  const tremendo = useTremorAoPerder(restantes);

  return (
    <span
      className={cn("relative inline-flex", tremendo && "zc-pena-desgasta")}
      title={`${restantes} de ${maximo} penas`}
    >
      <Feather className={cn("size-5", className)} />
    </span>
  );
}

/**
 * A pena de quem é Pro: roxa, e com o infinito no lugar da haste.
 *
 * O infinito não fica ao lado nem virou selo no canto — ele entra por baixo da
 * pena, no eixo da haste, que é justamente a diagonal do desenho. Assim os
 * dois viram um símbolo só, em vez de dois ícones dividindo o mesmo espaço.
 *
 * O roxo é o mesmo dos outros sinais de Pro do app, então a pena passa a dizer
 * duas coisas ao mesmo tempo: as vidas não acabam, e a conta é Pro.
 */
export function PenaInfinita({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-flex text-violet-500", className)} title="Penas ilimitadas">
      <Feather className={cn("size-5", className)} />
      <Infinito
        aria-hidden
        // Deitado sobre a haste, no canto de baixo à esquerda: é onde a pena
        // afina e sobra espaço, então o infinito não cobre nenhuma barba.
        className="absolute -bottom-px -left-px size-[62%]"
        strokeWidth={3}
      />
    </span>
  );
}
