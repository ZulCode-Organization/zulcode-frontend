"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Hammer, X } from "lucide-react";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { limparPerfilCache } from "@/hooks/use-perfil";
import { limparTrilhaCache } from "@/hooks/use-trilha";
import { ActivityPlayer } from "@/components/atividade/activity-player";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";
import { atividadeDaApi, ApiLesson } from "@/lib/course-content";
import { LicaoTrilha } from "@/lib/types/trilha";

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
          Essa atividade ainda não tem conteúdo pronto. Volte em breve pra essa.
        </p>
      </div>
    </div>
  );
}

/** POST /lessons/:id/complete de verdade: dá XP real e marca a lição como
 * concluída no backend (é isso que libera a próxima na trilha). Limpa os
 * caches de perfil e trilha em memória depois — sem isso, a
 * topbar/sidebar e a Jornada continuariam mostrando o estado antigo até
 * um reload de página de verdade. */
async function completarLicaoReal(id: string, score: number): Promise<{ xpEarned: number } | null> {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  if (!token) return null;

  try {
    const res = await fetchComTimeout(`${API_BASE_URL}/lessons/${id}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ score }),
    });
    if (!res.ok) return null;

    const dados: { xpEarned: number } = await res.json();
    limparPerfilCache();
    limparTrilhaCache();
    return dados;
  } catch {
    return null;
  }
}

interface AtividadeClientProps {
  id: string;
}

export function AtividadeClient({ id }: AtividadeClientProps) {
  useRequireAuth();
  const [lesson, setLesson] = useState<ApiLesson | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    fetchComTimeout(`${API_BASE_URL}/lessons/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error("Aula não encontrada");
        return res.json();
      })
      .then((data: ApiLesson) => setLesson(data))
      .catch(() => setError(true));
  }, [id]);

  if (error || (lesson && lesson.exercises.length === 0)) {
    return <AtividadeEmConstrucao />;
  }

  if (!lesson) {
    return <div className="flex min-h-dvh items-center justify-center text-sm font-bold text-muted-foreground">Carregando aula…</div>;
  }

  const etapa = lesson.theoryCompleted ? "REVIEW" : "THEORY";
  const licao: LicaoTrilha = { id: lesson.id, titulo: lesson.title, subtitulo: etapa === "THEORY" ? "Etapa 1 de 2" : "Etapa 2 de 2", xp: lesson.xpReward, estado: "atual" };
  const atividade = atividadeDaApi(lesson, etapa);

  return <ActivityPlayer atividade={atividade} licao={licao} aoConcluir={(acertos, total) => etapa === "THEORY"
    ? completarEtapaTeorica(id)
    : completarLicaoReal(id, Math.round((acertos / total) * 100))} />;
}

async function completarEtapaTeorica(id: string): Promise<{ xpEarned: number } | null> {
  const token = localStorage.getItem("accessToken");
  if (!token) return null;
  try {
    const res = await fetchComTimeout(`${API_BASE_URL}/lessons/${id}/theory-complete`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    limparTrilhaCache();
    return { xpEarned: 0 };
  } catch { return null; }
}
