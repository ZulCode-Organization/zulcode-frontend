"use client";

import { Check } from "@phosphor-icons/react/dist/ssr";
import { DuoNotificacoes } from "@/components/shared/icone-duo";
import { cn } from "@/lib/utils";
import "./nivelamento.css";

/**
 * O desenho da página das notificações: uma tela de bloqueio com o sino
 * balançando e duas notificações de exemplo caindo. Ativadas, o check verde
 * cobre tudo.
 */
export function VitrineDeAvisos({ ativadas }: { ativadas: boolean }) {
  return (
    <div className="relative mt-2 flex h-60 flex-col items-center gap-2.5 overflow-hidden rounded-3xl border-2 border-border bg-card/90 px-4 pt-4">
      <span className={cn("absolute right-4 top-4 flex size-11 items-center justify-center rounded-xl bg-amber-400/15 text-amber-500", !ativadas && "zc-niv-sino")}>
        <DuoNotificacoes className="size-7" />
      </span>
      <p className="text-4xl font-black tracking-tight text-muted-foreground/50">19:30</p>
      <Notificacao quando="agora" texto="Sua ofensiva de 3 dias está esperando. Bora manter?" atraso={500} />
      <Notificacao quando="2 min" texto="Lição nova liberada na sua trilha." atraso={1400} />
      {ativadas && (
        <div className="animate-pop-in absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-background/85">
          <span className="zc-niv-estrela flex size-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_5px_0_rgb(21,128,61)]">
            <Check className="size-8" weight="bold" />
          </span>
          <p className="text-base font-black text-foreground">Notificações ativadas</p>
        </div>
      )}
    </div>
  );
}

function Notificacao({ quando, texto, atraso }: { quando: string; texto: string; atraso: number }) {
  return (
    <div className="zc-niv-notificacao flex w-full items-start gap-2.5 rounded-2xl bg-muted px-3 py-2.5" style={{ animationDelay: `${atraso}ms` }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- ícone pequeno e fixo do app */}
      <img src="/icon-only-dark.svg" alt="" className="size-8 shrink-0 rounded-lg bg-background object-contain p-1" />
      <span className="min-w-0">
        <span className="block text-xs font-black text-foreground">
          ZulCode <span className="font-semibold text-muted-foreground">· {quando}</span>
        </span>
        <span className="block text-xs font-semibold text-muted-foreground">{texto}</span>
      </span>
    </div>
  );
}
