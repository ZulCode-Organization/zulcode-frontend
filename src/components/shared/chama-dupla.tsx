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
 */
export function ChamaDupla({ className, aceso = true }: { className?: string; aceso?: boolean }) {
  return (
    <span className={cn("relative inline-flex", className)}>
      <Flame
        className={cn(
          "size-full",
          aceso ? "fill-blue-600 stroke-sky-400" : "fill-muted-foreground/35 stroke-muted-foreground/60"
        )}
        strokeWidth={2.2}
      />
    </span>
  );
}
