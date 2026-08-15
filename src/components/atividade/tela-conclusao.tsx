import { Target, Zap } from "lucide-react";

interface TelaConclusaoProps {
  xp: number;
  acertos: number;
  total: number;
  onRevisar: () => void;
  onContinuar: () => void;
}

function qualificador(percentual: number): string {
  if (percentual === 100) return "Incrível";
  if (percentual >= 75) return "Muito bem";
  if (percentual >= 50) return "Bom";
  return "Continue tentando";
}

export function TelaConclusao({ xp, acertos, total, onRevisar, onContinuar }: TelaConclusaoProps) {
  const percentual = Math.round((acertos / total) * 100);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
        <img src="/mascot.png" alt="" className="size-28" />
        <h1 className="text-3xl font-black text-foreground">Lição concluída!</h1>

        <div className="flex gap-4">
          <div className="rounded-2xl border-2 border-amber-400 bg-amber-400/10 px-7 py-4">
            <p className="text-[0.7rem] font-black uppercase tracking-[0.08em] text-amber-600">Total de XP</p>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-2xl font-black text-amber-600">
              <Zap className="size-5 fill-current" />
              {xp}
            </p>
          </div>
          <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-400/10 px-7 py-4">
            <p className="text-[0.7rem] font-black uppercase tracking-[0.08em] text-emerald-600">
              {qualificador(percentual)}
            </p>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-2xl font-black text-emerald-600">
              <Target className="size-5" />
              {percentual}%
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Você acertou {acertos} de {total} perguntas.
        </p>
      </div>

      <div className="mx-auto flex w-full max-w-md gap-3 px-4 pb-8">
        <button
          type="button"
          onClick={onRevisar}
          className="zc-press flex-1 rounded-2xl border-2 border-border py-3.5 text-[0.8rem] font-black uppercase tracking-[0.06em] text-muted-foreground"
        >
          Revisar lição
        </button>
        <button
          type="button"
          onClick={onContinuar}
          className="zc-press zc-press-shadow flex-1 rounded-2xl bg-emerald-500 py-3.5 text-[0.8rem] font-black uppercase tracking-[0.06em] text-white"
          style={{ ["--zc-press-color" as string]: "color-mix(in srgb, #10b981 70%, black)" }}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
