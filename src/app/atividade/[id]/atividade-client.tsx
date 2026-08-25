"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Feather, Hammer, X } from "lucide-react";
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
  const [semPenas, setSemPenas] = useState(false);
  const [livesState, setLivesState] = useState<{ lives: number; isUnlimited?: boolean } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    Promise.all([
      fetchComTimeout(`${API_BASE_URL}/lessons/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
      fetchComTimeout(`${API_BASE_URL}/lessons/${id}/start`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }),
    ])
      .then(async ([lessonRes, livesRes]) => {
        if (!livesRes.ok) {
          if (livesRes.status === 422) { setSemPenas(true); return null; }
          throw new Error("Não foi possível consultar as penas");
        }
        const lives: { lives: number; isUnlimited?: boolean } = await livesRes.json();
        if (lives.lives <= 0) { setSemPenas(true); return null; }
        setLivesState(lives);
        if (!lessonRes.ok) throw new Error("Aula não encontrada");
        return lessonRes.json();
      })
      .then((data: ApiLesson | null) => { if (data) setLesson(data); })
      .catch(() => setError(true));
  }, [id]);

  if (error || (lesson && lesson.exercises.length === 0)) {
    return <AtividadeEmConstrucao />;
  }

  if (!lesson || !livesState) {
    if (semPenas) return <SemPenas />;
    return <div className="flex min-h-dvh items-center justify-center text-sm font-bold text-muted-foreground">Carregando aula…</div>;
  }

  const totalEtapas = Math.max(1, lesson.stageCount ?? 2);
  const concluidas = lesson.completed ? totalEtapas : Math.min(totalEtapas, lesson.completedStages ?? (lesson.theoryCompleted ? 1 : 0));
  const etapaAtual = Math.min(totalEtapas, concluidas + 1);
  // Aulas antigas usam THEORY/REVIEW; aulas flexíveis usam STAGE_1, STAGE_2…
  const etapa = totalEtapas === 2 ? (etapaAtual === 1 ? "THEORY" : "REVIEW") : `STAGE_${etapaAtual}`;
  const licao: LicaoTrilha = { id: lesson.id, titulo: lesson.title, subtitulo: `Etapa ${etapaAtual} de ${totalEtapas}`, xp: lesson.xpReward, estado: "atual" };
  const atividade = atividadeDaApi(lesson, etapa);

  return <ActivityPlayer atividade={atividade} licao={licao} aoConcluir={(acertos, total) => etapaAtual < totalEtapas
    ? (totalEtapas === 2 ? completarEtapaTeorica(id) : completarEtapa(id, etapaAtual))
    : completarLicaoReal(id, Math.round((acertos / total) * 100))} aoErrar={consumirPena} vidas={livesState.lives} vidasIlimitadas={livesState.isUnlimited} />;
}

function SemPenas() {
  const router = useRouter();
  return <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center"><span className="flex size-20 items-center justify-center rounded-[28px] bg-rose-500/10 text-rose-500"><Feather className="size-10" /></span><h1 className="mt-6 text-3xl font-black">Sem penas para começar</h1><p className="mt-3 max-w-md text-muted-foreground">Você precisa ter ao menos uma pena para iniciar uma aula. A próxima pena será recuperada em até uma hora.</p><button type="button" onClick={() => router.push("/home")} className="mt-7 rounded-2xl bg-primary px-7 py-3.5 text-sm font-black text-primary-foreground">Voltar para a jornada</button></div>;
}

async function consumirPena(): Promise<{ lives: number; isUnlimited?: boolean } | null> {
  const token = localStorage.getItem("accessToken");
  if (!token) return null;
  try {
    const res = await fetchComTimeout(`${API_BASE_URL}/user/lives/use`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return { lives: 0 };
    const estado: { lives: number; isUnlimited?: boolean } = await res.json();
    limparPerfilCache();
    return estado;
  } catch { return null; }
}

async function completarEtapa(id: string, etapa: number): Promise<{ xpEarned: number } | null> {
  const token = localStorage.getItem("accessToken");
  if (!token) return null;
  try {
    const res = await fetchComTimeout(`${API_BASE_URL}/lessons/${id}/stages/${etapa}/complete`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    limparTrilhaCache();
    return { xpEarned: 0 };
  } catch { return null; }
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
