"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { ActivityPlayer } from "@/components/atividade/activity-player";
import { atividadeDaApi, type ApiLesson } from "@/lib/course-content";
import { pedir } from "@/lib/admin/api";
import { cn } from "@/lib/utils";
import { nomeDaEtapa } from "./regras";
import type { RascunhoDaAula } from "@/lib/admin/tipos";

/**
 * "Jogar como aluno": o rascunho passa pelo mesmo caminho da aula de verdade
 * — o servidor converte para o formato do jogador, e o jogador é o mesmo
 * componente da trilha. Nada é gravado: sem XP, sem penas, sem progresso.
 */
export function Previa({ aulaId, rascunho, etapaInicial, aoFechar }: { aulaId: string; rascunho: RascunhoDaAula; etapaInicial: number; aoFechar: () => void }) {
  const [aula, setAula] = useState<ApiLesson | null>(null);
  const [erro, setErro] = useState("");
  const [etapa, setEtapa] = useState(Math.min(etapaInicial, rascunho.etapas));
  const [rodada, setRodada] = useState(0);

  useEffect(() => {
    let vivo = true;
    pedir<Omit<ApiLesson, "theoryCompleted" | "completed">>(`/admin/conteudo/aulas/${aulaId}/previa`, { method: "POST", json: { rascunho } })
      .then((l) => vivo && setAula({ ...l, theoryCompleted: false, completed: false, completedStages: 0 } as ApiLesson))
      .catch((e: unknown) => vivo && setErro(e instanceof Error ? e.message : "Não foi possível montar a prévia."));
    return () => {
      vivo = false;
    };
    // A prévia é uma foto do rascunho de quando abriu; editar com ela aberta não a muda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aulaId]);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [aoFechar]);

  const rotulo = rascunho.etapas === 2 ? (etapa === 1 ? "THEORY" : "REVIEW") : `STAGE_${etapa}`;
  const atividade = aula ? atividadeDaApi(aula, rotulo) : null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-background" role="dialog" aria-modal aria-label="Prévia da aula">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b bg-card px-3 py-2">
        <span className="rounded-md bg-amber-500/15 px-2 py-1 text-xs font-black text-amber-700 dark:text-amber-300">PRÉVIA · nada é salvo</span>
        <div className="flex gap-1">
          {Array.from({ length: rascunho.etapas }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                setEtapa(n);
                setRodada((r) => r + 1);
              }}
              className={cn("h-7 rounded-md px-2.5 text-xs font-bold", n === etapa ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
            >
              {nomeDaEtapa(n, rascunho.etapas)}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setRodada((r) => r + 1)} className="h-7 rounded-md px-2.5 text-xs font-bold text-muted-foreground hover:bg-muted">Recomeçar</button>
        <button type="button" onClick={aoFechar} aria-label="Fechar a prévia" className="ml-auto flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {erro ? (
          <p className="p-8 text-center text-sm font-bold text-rose-600">{erro}</p>
        ) : !atividade ? (
          <div className="flex h-full items-center justify-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
        ) : atividade.perguntas.length === 0 && atividade.introducao.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Esta etapa ainda não tem nada para jogar.</p>
        ) : (
          <ActivityPlayer
            key={`${etapa}-${rodada}`}
            atividade={atividade}
            licao={{ id: aulaId, titulo: rascunho.titulo || "Aula sem título", subtitulo: `${nomeDaEtapa(etapa, rascunho.etapas)} · prévia`, xp: rascunho.xp, estado: "atual" }}
            vidas={5}
            vidasIlimitadas
            aoErrar={async () => ({ lives: 5, isUnlimited: true })}
            aoSair={aoFechar}
          />
        )}
      </div>
    </div>
  );
}
