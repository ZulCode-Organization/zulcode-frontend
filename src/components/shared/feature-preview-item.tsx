import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeaturePreviewItemProps {
  icon: LucideIcon;
  iconClassName?: string;
  titulo: string;
  descricao?: string;
  /**
   * Selo de status — varia por item (default "Em breve") pra não empilhar a
   * mesma palavra repetida em toda linha da tela, o que dá uma cara de
   * template gerado automaticamente em vez de algo que alguém escreveu.
   */
  status?: string;
}

/**
 * Linha de "recurso a caminho": mostra o visual completo do item (loja,
 * missão etc.) mas sem fingir um preço, saldo ou progresso reais — nada
 * disso existe no backend ainda, então a ação fica marcada com um selo de
 * status em vez de simular uma compra/conclusão que não acontece de verdade.
 */
export function FeaturePreviewItem({
  icon: Icon,
  iconClassName,
  titulo,
  descricao,
  status = "Em breve",
}: FeaturePreviewItemProps) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
      <span
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-2xl",
          iconClassName ?? "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="size-6" />
      </span>
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-bold text-foreground">{titulo}</h4>
        {descricao && <p className="mt-0.5 text-xs text-muted-foreground">{descricao}</p>}
      </div>
      <span className="shrink-0 rounded-full bg-muted px-3 py-1.5 text-[0.65rem] font-extrabold uppercase tracking-wide text-muted-foreground">
        {status}
      </span>
    </div>
  );
}
