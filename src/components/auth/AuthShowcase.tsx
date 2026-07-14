import { Flame, Trophy } from "lucide-react";
import { SiPython } from "react-icons/si";

export function AuthShowcase() {
  return (
    <div className="flex max-w-md flex-col gap-10 animate-fade-in-up">
      <div className="flex flex-col gap-4">
        <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-foreground">
          Aprenda a programar <span className="text-primary">do jeito certo</span>.
        </h1>
        <p className="text-lg text-muted-foreground">
          Trilhas gamificadas, projetos reais e um pouco de diversão a cada linha de código.
        </p>
      </div>

      <div className="relative mx-auto w-full max-w-xs pb-6 pt-4">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
          <div className="flex items-center gap-1.5 border-b border-border bg-muted px-4 py-3">
            <span className="size-2.5 rounded-full bg-destructive/70" />
            <span className="size-2.5 rounded-full bg-yellow-500/70" />
            <span className="size-2.5 rounded-full bg-green-500/70" />
            <span className="ml-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <SiPython className="size-3.5" /> main.py
            </span>
          </div>
          <div className="flex flex-col gap-1.5 px-4 py-4 font-mono text-[13px] leading-relaxed">
            <p>
              <span className="text-primary">def</span>{" "}
              <span className="text-foreground">aprender</span>():
            </p>
            <p className="pl-4 text-muted-foreground">
              print(<span className="text-green-600 dark:text-green-400">&quot;Vamos programar!&quot;</span>)
            </p>
            <p className="pl-4 text-muted-foreground">nivel += 1</p>
          </div>
        </div>

        <div className="absolute -right-6 -top-4 flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-md">
          <Flame className="size-3.5 text-primary" />
          7 dias seguidos
        </div>
        <div className="absolute -bottom-2 -left-6 flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-md">
          <Trophy className="size-3.5 text-primary" />
          Nível 3
        </div>
      </div>
    </div>
  );
}
