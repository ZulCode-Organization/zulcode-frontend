"use client";

import { useRouter } from "next/navigation";
import { Code2 } from "lucide-react";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { useJornada } from "@/hooks/use-jornada";
import { useGestoLateral } from "@/hooks/use-gesto-lateral";
import { AppShell } from "@/components/app-shell/app-shell";
import { useEhMobile } from "@/components/app-shell/topbar-overlay";
import { LessonTrail } from "@/components/home/lesson-trail";
import { ProCard } from "@/components/home/pro-card";
import { LeaderboardWidget } from "@/components/home/leaderboard-widget";
import { DailyGoalsWidget } from "@/components/home/daily-goals-widget";
import { SideFooter } from "@/components/shared/side-footer";

/** Esqueleto só no primeiro carregamento, enquanto confirma o estado da
 * lição conectada ao backend — mesmo padrão de "pulso" usado no cartão de
 * perfil da sidebar. Depois de cacheado (useTrilha), isso não aparece mais
 * ao trocar de tela e voltar. */
function TrilhaEsqueleto() {
  return (
    <div className="mx-auto mt-7 flex max-w-[290px] flex-col items-center gap-5 pb-3">
      <div className="h-[92px] w-full animate-pulse rounded-3xl bg-muted" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="size-[96px] animate-pulse rounded-[34px] bg-muted" />
      ))}
    </div>
  );
}

export default function HomePage() {
  useRequireAuth();
  const { unidades, loading } = useJornada();
  const router = useRouter();
  const ehMobile = useEhMobile();

  // Arrastar pro lado abre o Playground. No celular o Playground fica atrás do
  // menu "Mais", longe de quem está no meio de uma lição; o gesto encurta isso
  // sem ocupar espaço na tela.
  //
  // Serve nas duas direções de propósito: num gesto solto a pessoa não pensa
  // "pra esquerda", ela só empurra pro lado — e exigir o lado certo faria
  // metade das tentativas não dar em nada.
  const { deslocamento, manipuladores } = useGestoLateral(() => router.push("/playground"));

  return (
    <AppShell
      rightPanelVariant="sticky-bottom"
      rightPanel={
        <>
          <ProCard />
          <LeaderboardWidget />
          <DailyGoalsWidget />
          <SideFooter />
        </>
      }
    >
      {/* LessonTrail cuida do próprio cabeçalho fixo (UnitBanner) — ele troca
          de nome/cor sozinho conforme o scroll entra em cada unidade. O
          estado de cada lição (atual/bloqueada/concluída) é sempre
          calculado a partir de progresso de verdade — da única lição
          semeada no backend, ou do progresso local nas outras — nunca
          hardcoded, então a 2ª lição só libera depois que a 1ª é concluída.
          A troca de curso agora fica na barra de status, no topo do app. */}
      <div className="relative" {...(ehMobile ? manipuladores : {})}>
        {/* A dica aparece só enquanto o dedo está arrastando, do lado pra onde
            ele foi. Um atalho invisível ninguém descobre; um aviso fixo na
            tela seria ruído em todas as outras vezes. */}
        {deslocamento !== 0 && (
          <span
            aria-hidden
            className="pointer-events-none fixed top-1/2 z-30 flex -translate-y-1/2 items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-[0.7rem] font-black uppercase tracking-[0.06em] text-primary-foreground shadow-lg lg:hidden"
            style={{
              [deslocamento < 0 ? "right" : "left"]: 12,
              opacity: Math.min(1, Math.abs(deslocamento) / 45),
            }}
          >
            <Code2 className="size-4" />
            Playground
          </span>
        )}

        {/* O transform entra só enquanto o dedo está arrastando, e sai no
            instante em que solta. Transform cria contexto de empilhamento: se
            ficasse aplicado o tempo todo (mesmo em 0px), o z-index do
            cabeçalho da Jornada ficaria preso aqui dentro e a barra de status
            passaria a pintar por cima dele — o cabeçalho aparecia cortado. */}
        <div style={deslocamento === 0 ? undefined : { transform: `translateX(${deslocamento}px)` }}>
          {loading ? <TrilhaEsqueleto /> : <LessonTrail unidades={unidades} />}
        </div>
      </div>
    </AppShell>
  );
}
