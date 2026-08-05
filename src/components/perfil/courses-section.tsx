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
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
        <LanguageIcon id={curso.id} name={curso.nome} className="size-5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold text-foreground">{curso.nome}</span>
          <span className="shrink-0 text-xs font-semibold text-muted-foreground">
            {curso.licoesConcluidas}/{curso.totalLicoes}
          </span>
        </div>
        <Progress value={curso.percentual} className="h-1.5" />
      </div>
    </div>
  );
}

export function CoursesSection({ emAndamento, concluidos }: CoursesSectionProps) {
  const semCursos = emAndamento.length === 0 && concluidos.length === 0;

  return (
    <div
      className="animate-fade-in-up rounded-2xl border border-border bg-card p-5"
      style={{ animationDelay: "120ms" }}
    >
      <h3 className="mb-4 text-sm font-extrabold text-foreground">Cursos</h3>

      {semCursos ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <BookOpen className="size-4.5" />
          </span>
          <p className="max-w-xs text-sm text-muted-foreground">
            Você ainda não concluiu nenhuma lição. Comece sua trilha para ver seu progresso aqui.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {emAndamento.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
                Em andamento
              </span>
              <div className="flex flex-col gap-2">
                {emAndamento.map((curso) => (
                  <CourseRow key={curso.id} curso={curso} />
                ))}
              </div>
            </div>
          )}

          {concluidos.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
                Concluídos
              </span>
              <div className="flex flex-col gap-2">
                {concluidos.map((curso) => (
                  <CourseRow key={curso.id} curso={curso} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
