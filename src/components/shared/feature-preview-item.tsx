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
  /** Rótulo de disponibilidade que aparece como chip abaixo do título. */
  disponibilidade?: string;
}

/**
 * Linha de "recurso a caminho" no formato do redesign: ícone grande à esquerda,
 * texto no meio e ação à direita com borda. Continua sem preço/saldo reais —
 * nada disso existe no backend ainda, então o botão vira selo de status em vez
 * de simular uma compra que não acontece de verdade.
 */
export function FeaturePreviewItem({
  icon: Icon,
  iconClassName,
  titulo,
  descricao,
  status = "Em breve",
  disponibilidade,
}: FeaturePreviewItemProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-5.5 gap-y-4 border-b border-border px-1 py-6">
      <span
        className={cn(
          "flex size-14 shrink-0 items-center justify-center",
          iconClassName ?? "text-muted-foreground"
        )}
      >
        <Icon className="size-11" />
      </span>

      <div className="min-w-[180px] flex-1 basis-55">
        <h4 className="text-[1.05rem] font-black text-foreground">{titulo}</h4>
        {disponibilidade && (
          <span className="mt-2 inline-block rounded-md bg-muted px-2.5 py-1 text-[0.72rem] font-extrabold text-muted-foreground">
            {disponibilidade}
          </span>
        )}
        {descricao && (
          <p className="mt-2 text-[0.9rem] leading-relaxed text-muted-foreground text-pretty">
            {descricao}
          </p>
        )}
      </div>

      <span className="flex min-w-[140px] max-w-[190px] flex-1 basis-37.5 items-center justify-center rounded-[14px] border-2 border-border px-3 py-3.5 text-center text-[0.78rem] font-black uppercase tracking-[0.06em] text-muted-foreground">
        {status}
      </span>
    </div>
  );
}
