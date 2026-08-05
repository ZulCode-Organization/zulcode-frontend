import { cn } from "@/lib/utils";
import { LicaoTrilha } from "@/lib/types/trilha";
import { LessonNode } from "./lesson-node";

interface LessonTrailProps {
  licoes: LicaoTrilha[];
}

export function LessonTrail({ licoes }: LessonTrailProps) {
  return (
    // overflow-x-hidden evita que o zigue-zague dos nós crie uma barra de
    // rolagem horizontal na página; o padding lateral garante espaço pro
    // deslocamento sem cortar os nós das pontas.
    <div className="relative overflow-x-hidden px-16 py-8 sm:px-24">
      <div className="relative mx-auto flex max-w-md flex-col items-center gap-12">
        {/* inset-y-0 (em vez de h-full) faz a linha acompanhar a altura real
            do container mesmo com altura automática, então ela sempre vai do
            primeiro ao último nó — sem sobrar nem faltar no final. */}
        <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-border" aria-hidden />

        {licoes.map((licao, index) => (
          <div
            key={licao.id}
            className={cn(
              "animate-fade-in-up relative z-10",
              index % 2 === 0 ? "translate-x-14 sm:translate-x-20" : "-translate-x-14 sm:-translate-x-20"
            )}
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <LessonNode licao={licao} />
          </div>
        ))}
      </div>
    </div>
  );
}
