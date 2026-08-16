"use client";

import { useRouter } from "next/navigation";
import { Hammer, X } from "lucide-react";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { ID_LICAO_CONECTADA } from "@/hooks/use-jornada";
import { limparPerfilCache } from "@/hooks/use-perfil";
import { limparTrilhaCache } from "@/hooks/use-trilha";
import { ActivityPlayer } from "@/components/atividade/activity-player";
import { atividades, LICAO_REAL_VARIAVEIS_ID } from "@/data/atividades";
import { unidadesTrilha } from "@/data/trilha";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";
import { marcarLicaoConcluidaLocal } from "@/lib/progresso-local";

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

  const licao = unidadesTrilha.flatMap((unidade) => unidade.licoes).find((l) => l.id === id);
  const atividade = atividades[id];

  if (!licao || !atividade) {
    return <AtividadeEmConstrucao />;
  }

  // Só o slot ID_LICAO_CONECTADA fala com o backend de verdade (é a única
  // lição que existe no banco hoje) — todas as outras 79 só marcam
  // progresso local, pra próxima lição da trilha liberar.
  const ehConectada = id === ID_LICAO_CONECTADA;

  const aoConcluir = ehConectada
    ? (acertos: number, total: number) =>
        completarLicaoReal(LICAO_REAL_VARIAVEIS_ID, Math.round((acertos / total) * 100))
    : undefined;

  const onConcluirLocal = () => {
    if (ehConectada) return; // essa já é rastreada pelo backend, não precisa de localStorage
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (token) marcarLicaoConcluidaLocal(token, id);
  };

  return <ActivityPlayer atividade={atividade} licao={licao} aoConcluir={aoConcluir} onConcluirLocal={onConcluirLocal} />;
}
