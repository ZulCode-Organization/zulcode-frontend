import { Compass, Sparkles, Target, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingShowcaseProps {
  progress: number;
  stepIndex: number;
  totalSteps: number;
}

const BENEFITS = [
  { icon: Target, text: "Trilha 100% personalizada para o seu nível" },
  { icon: Sparkles, text: "Conteúdo adaptado ao seu objetivo" },
  { icon: TrendingUp, text: "Dificuldade ajustada conforme você evolui" },
];

function encouragement(progress: number) {
  if (progress <= 0) return "Perguntas rápidas para montar sua trilha perfeita.";
  if (progress < 60) return "Boa! Continue respondendo, estamos moldando sua jornada.";
  if (progress < 100) return "Quase lá! Só mais algumas perguntas.";
  return "Tudo pronto para montar sua trilha!";
}

export function OnboardingShowcase({ progress, stepIndex, totalSteps }: OnboardingShowcaseProps) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress / 100);

  return (
    <div className="flex max-w-md flex-col gap-10">
      <div className="animate-float flex justify-center">
        <div className="relative flex size-32 items-center justify-center">
          <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90">
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              strokeWidth="8"
              className="stroke-border"
            />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="stroke-primary transition-[stroke-dashoffset] duration-700 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]"
            />
          </svg>
          <span className="flex size-20 items-center justify-center rounded-full bg-primary/10">
            <Compass className="size-9 text-primary" strokeWidth={1.75} />
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 text-center">
        <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground">
          Vamos te conhecer <span className="text-primary">melhor</span>.
        </h1>
        <p className="text-lg text-muted-foreground">{encouragement(progress)}</p>
      </div>

      <div className="flex flex-col gap-3">
        {BENEFITS.map((benefit, index) => {
          const Icon = benefit.icon;
          const done = totalSteps > 0 && index < Math.ceil((stepIndex / totalSteps) * BENEFITS.length);
          return (
            <div
              key={benefit.text}
              className={cn(
                "animate-fade-in-up flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm transition-colors duration-300",
                done && "border-primary/40 bg-primary/5"
              )}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors duration-300",
                  done && "bg-primary/15 text-primary"
                )}
              >
                <Icon className="size-4" />
              </span>
              <span className="text-sm font-medium text-card-foreground">{benefit.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
