import { cn } from "@/lib/utils";
import { LicaoTrilha } from "@/lib/types/trilha";
import { LessonNode } from "./lesson-node";

interface LessonTrailProps {
  licoes: LicaoTrilha[];
}

export function LessonTrail({ licoes }: LessonTrailProps) {
  return (
    <div className="relative flex flex-col items-center gap-12 py-8">
      <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-border" aria-hidden />

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
  );
}
