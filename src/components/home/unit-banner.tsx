import { ChevronDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { UnidadeTrilha } from "@/lib/types/trilha";

interface UnitBannerProps {
  unidade: UnidadeTrilha;
}

export function UnitBanner({ unidade }: UnitBannerProps) {
  const total = unidade.licoes.length;
  const indiceAtual = unidade.licoes.findIndex((l) => l.estado === "atual");
  const posicao = indiceAtual === -1 ? total : indiceAtual + 1;

  return (
    <div className="animate-fade-in-up flex items-center gap-4 rounded-3xl bg-primary px-5 py-4 text-primary-foreground shadow-lg shadow-primary/20 sm:px-6 sm:py-5">
      <div className="flex-1">
        <p className="text-xs font-bold uppercase tracking-wide text-primary-foreground/70">
          Seção {unidade.secao} • Unidade {unidade.unidade}
        </p>
        <h2 className="mt-0.5 text-lg font-extrabold sm:text-xl">{unidade.titulo}</h2>
        <div className="mt-3 flex items-center gap-3">
          <Progress value={(posicao / total) * 100} className="h-1.5 flex-1 bg-primary-foreground/20 [&>div]:bg-primary-foreground" />
          <span className="shrink-0 text-xs font-semibold text-primary-foreground/80">
            {posicao}/{total}
          </span>
        </div>
      </div>

      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15">
        <ChevronDown className="size-4.5" />
      </span>
    </div>
  );
}
