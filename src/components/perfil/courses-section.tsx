import { BookOpen } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { LanguageIcon } from "@/components/onboarding/language-icon";
import { CursoProgresso } from "@/lib/types/perfil";

interface CoursesSectionProps {
  emAndamento: CursoProgresso[];
  concluidos: CursoProgresso[];
}

function CourseRow({ curso }: { curso: CursoProgresso }) {
  return (
    <div className="flex items-center gap-4 rounded-[20px] border border-border bg-card p-5">
      <span className="flex size-13 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <LanguageIcon id={curso.id} name={curso.nome} className="size-6" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[0.95rem] font-extrabold text-foreground">
            {curso.nome}
          </span>
          <span className="shrink-0 text-[0.8rem] font-semibold text-muted-foreground/70">
            {curso.licoesConcluidas} de {curso.totalLicoes} lições
          </span>
        </div>
        <Progress value={curso.percentual} className="h-2" />
      </div>
    </div>
  );
}

export function CoursesSection({ emAndamento, concluidos }: CoursesSectionProps) {
  const semCursos = emAndamento.length === 0 && concluidos.length === 0;

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: "120ms" }}>
      <h2 className="text-base font-black text-foreground">Cursos</h2>

      {semCursos ? (
        <div className="mt-2.5 flex flex-col items-center gap-2.5 rounded-[20px] border border-border bg-card px-6 py-8 text-center">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BookOpen className="size-5" />
          </span>
          <p className="max-w-xs text-sm text-muted-foreground">
            Comece sua trilha para ver seu progresso aqui.
          </p>
        </div>
      ) : (
        <div className="mt-2.5 flex flex-col gap-5">
          {emAndamento.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <span className="text-[0.7rem] font-extrabold uppercase tracking-[0.09em] text-muted-foreground/70">
                Em andamento
              </span>
              {emAndamento.map((curso) => (
                <CourseRow key={curso.id} curso={curso} />
              ))}
            </div>
          )}

          {concluidos.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <span className="text-[0.7rem] font-extrabold uppercase tracking-[0.09em] text-muted-foreground/70">
                Concluídos
              </span>
              {concluidos.map((curso) => (
                <CourseRow key={curso.id} curso={curso} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
