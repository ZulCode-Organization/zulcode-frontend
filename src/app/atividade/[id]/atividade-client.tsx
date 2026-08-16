"use client";

import { useRouter } from "next/navigation";
import { Hammer, X } from "lucide-react";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { useTrilha } from "@/hooks/use-trilha";
import { limparPerfilCache } from "@/hooks/use-perfil";
import { ActivityPlayer } from "@/components/atividade/activity-player";
import { atividades } from "@/data/atividades";
import { unidadesTrilha } from "@/data/trilha";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";

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

function AtividadeCarregando() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <div className="size-10 animate-spin rounded-full border-4 border-muted border-t-primary" aria-label="Carregando" />
    </div>
  );
}

/** POST /lessons/:id/complete de verdade: dá XP real e marca a lição como
 * concluída no backend (é isso que libera a próxima na trilha). Limpa o
 * cache do perfil em memória depois — sem isso, a topbar/sidebar
 * continuariam mostrando o xp antigo até um reload de página de verdade. */
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

  const licaoMock = unidadesTrilha.flatMap((unidade) => unidade.licoes).find((l) => l.id === id);
  const ehReal = !licaoMock;
  const atividade = atividades[id];

  // Só busca a trilha de verdade quando a lição não é uma das mockadas —
  // hoje isso é só a lição semeada no backend, mas funciona pra qualquer
  // lição real futura sem precisar mudar nada aqui.
  const trilhaReal = useTrilha("javascript", ehReal);

  if (!ehReal) {
    if (!licaoMock || !atividade) return <AtividadeEmConstrucao />;
    return <ActivityPlayer atividade={atividade} licao={licaoMock} />;
  }

  if (trilhaReal.loading) return <AtividadeCarregando />;

  const licaoReal = trilhaReal.unidades.flatMap((u) => u.licoes).find((l) => l.id === id);
  if (trilhaReal.error || !licaoReal || !atividade) return <AtividadeEmConstrucao />;

  // Se já estava "concluida" quando a trilha carregou, deixa revisar a
  // lição à vontade sem chamar /complete de novo — o backend soma XP a
  // cada chamada, sem checar se a lição já tinha sido feita antes.
  const jaConcluida = licaoReal.estado === "concluida";

  return (
    <ActivityPlayer
      atividade={atividade}
      licao={licaoReal}
      aoConcluir={
        jaConcluida ? undefined : (acertos, total) => completarLicaoReal(id, Math.round((acertos / total) * 100))
      }
    />
  );
}
