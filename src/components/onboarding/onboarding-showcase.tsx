/* eslint-disable @next/next/no-img-element -- As artes do Zul são WebP animados:
   o otimizador do Next devolveria só o primeiro quadro. */
import type { PoseDoZul } from "@/components/atividade/zul-da-aula";

interface OnboardingShowcaseProps {
  pose: PoseDoZul;
  /** O que o Zul diz neste passo. Muda com a resposta anterior. */
  fala: string;
  progress: number;
}

/**
 * O lado esquerdo do onboarding no computador: o Zul, grande, comentando cada
 * passo. A chave da imagem e do balão é a própria fala: quando ela muda, a arte
 * recomeça e o balão entra de novo, então dá para ver que ele reagiu.
 */
export function OnboardingShowcase({ pose, fala, progress }: OnboardingShowcaseProps) {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-8">
      <div key={fala} className="animate-pop-in relative rounded-3xl border-2 border-border bg-card px-6 py-5 text-center text-lg font-bold leading-snug text-foreground shadow-sm">
        {fala}
        <span
          aria-hidden
          className="absolute -bottom-[9px] left-1/2 size-4 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-border bg-card"
        />
      </div>

      <img key={pose} src={`/zul/zul-${pose}.webp`} alt="" draggable={false} className="animate-pop-in size-56 object-contain" />

      <div className="w-full">
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-700 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]"
            style={{ width: `${Math.max(progress, 4)}%` }}
          />
        </div>
        <p className="mt-2 text-center text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
          {progress >= 100 ? "Tudo pronto" : "Montando sua trilha"}
        </p>
      </div>
    </div>
  );
}
