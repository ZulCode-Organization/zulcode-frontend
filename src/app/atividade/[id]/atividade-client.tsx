"use client";

import { useRouter } from "next/navigation";
import { Hammer, X } from "lucide-react";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { ActivityPlayer } from "@/components/atividade/activity-player";
import { atividades } from "@/data/atividades";
import { unidadesTrilha } from "@/data/trilha";

/** Sem sidebar/topbar/painel direito de propósito — a tela de fazer a
 * lição é tela cheia, sem distração, como no app de verdade. */
function AtividadeEmConstrucao() {
  const router = useRouter();
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="px-4 py-4 lg:px-8">
        <button
          type="button"
          onClick={() => router.push("/home")}
          aria-label="Voltar pra jornada"
          className="flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-primary/10">
          <Hammer className="size-7 text-primary" strokeWidth={1.75} />
        </span>
        <h1 className="text-2xl font-extrabold text-foreground">Essa lição está a caminho</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Só a primeira lição da trilha já tem atividade pronta. Volte em breve pra essa.
        </p>
      </div>
    </div>
  );
}

interface AtividadeClientProps {
  id: string;
}

export function AtividadeClient({ id }: AtividadeClientProps) {
  useRequireAuth();

  const licao = unidadesTrilha.flatMap((unidade) => unidade.licoes).find((l) => l.id === id);
  const atividade = atividades[id];

  if (!licao || !atividade) {
    return <AtividadeEmConstrucao />;
  }

  return <ActivityPlayer atividade={atividade} licao={licao} />;
}
