"use client";

import { useRouter } from "next/navigation";
import { BookOpen, Check, Lock, Play, Target, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { UnidadeTrilha } from "@/lib/types/trilha";
import { CorUnidade } from "@/data/trilha";
import { TopbarSheet } from "@/components/app-shell/topbar-overlay";

interface UnidadeGuiaProps {
  unidade: UnidadeTrilha;
  cor: CorUnidade;
  onClose: () => void;
}

/**
 * Resumo da unidade, aberto ao tocar no cabeçalho da Jornada.
 *
 * Tudo aqui é calculado do que a API já devolve em
 * GET /languages/:slug/track — título da unidade e as lições com estado e XP.
 * O backend ainda não tem um campo de descrição da unidade, então em vez de
 * inventar um texto explicando a matéria, o resumo é feito de números reais:
 * quanto já foi vencido, quanto falta, quanto XP a unidade vale e o que vem
 * em cada lição. Quando a API passar a mandar uma descrição, ela entra logo
 * abaixo do título sem mexer no resto.
 */
export function UnidadeGuia({ unidade, cor, onClose }: UnidadeGuiaProps) {
  const router = useRouter();
  const licoes = unidade.licoes ?? [];
  const concluidas = licoes.filter((licao) => licao.estado === "concluida").length;
  const atual = licoes.find((licao) => licao.estado === "atual");
  const percentual = licoes.length ? Math.round((concluidas / licoes.length) * 100) : 0;
  const xpTotal = licoes.reduce((soma, licao) => soma + (licao.xp ?? 0), 0);
  const xpConquistado = licoes
    .filter((licao) => licao.estado === "concluida")
    .reduce((soma, licao) => soma + (licao.xp ?? 0), 0);
  const faltam = licoes.length - concluidas;

  const abrirLicao = (id: string) => {
    onClose();
    router.push(`/atividade/${id}`);
  };

  const resumo = [
    { Icone: BookOpen, valor: `${licoes.length}`, rotulo: licoes.length === 1 ? "lição" : "lições", cor: "text-primary" },
    { Icone: Target, valor: `${percentual}%`, rotulo: "concluído", cor: "text-emerald-500" },
    { Icone: Zap, valor: `${xpConquistado}/${xpTotal}`, rotulo: "XP", cor: "text-amber-500" },
  ];

  return (
    <TopbarSheet titulo={`Unidade ${unidade.unidade}`} onClose={onClose}>
      <div className="mx-auto w-full max-w-2xl pb-4">
        {/* Capa: a mesma cor da unidade, com o progresso desenhado por cima. */}
        <div className={cn("animate-fade-in-up rounded-[22px] px-6 py-7 text-white", cor.bg)}>
          <p className="text-xs font-black uppercase tracking-[0.1em] opacity-85">
            Seção {unidade.secao} • Unidade {unidade.unidade}
          </p>
          <h2 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">{unidade.titulo}</h2>
          <p className="mt-3 text-[0.9rem] leading-snug opacity-90">
            {concluidas === 0
              ? `Esta unidade tem ${licoes.length} ${licoes.length === 1 ? "lição" : "lições"} e vale ${xpTotal} XP. Comece pela primeira.`
              : faltam === 0
              ? "Unidade completa! Todas as lições daqui já foram vencidas."
              : `Você já venceu ${concluidas} de ${licoes.length}. ${faltam === 1 ? "Falta 1 lição" : `Faltam ${faltam} lições`} pra fechar a unidade.`}
          </p>

          <div className="mt-5 flex items-center gap-3">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-black/25">
              <div className="h-full rounded-full bg-white transition-[width] duration-500" style={{ width: `${percentual}%` }} />
            </div>
            <span className="shrink-0 text-xs font-black opacity-90">
              {concluidas}/{licoes.length}
            </span>
          </div>
        </div>

        {/* Três números que resumem a unidade de relance. */}
        <div className="animate-fade-in-up mt-3 grid grid-cols-3 gap-3" style={{ animationDelay: "60ms" }}>
          {resumo.map((item) => (
            <div key={item.rotulo} className="rounded-[18px] border border-border bg-card px-3 py-4 text-center">
              <item.Icone className={cn("mx-auto size-5", item.cor)} />
              <p className="mt-2 text-[1.05rem] font-black leading-none">{item.valor}</p>
              <p className="mt-1 text-[0.7rem] font-black uppercase tracking-[0.06em] text-muted-foreground">{item.rotulo}</p>
            </div>
          ))}
        </div>

        <p className="mt-7 pb-3 text-[0.7rem] font-black uppercase tracking-[0.1em] text-muted-foreground">
          O que você vai aprender
        </p>

        <div className="flex flex-col gap-2">
          {licoes.map((licao, indice) => {
            const bloqueada = licao.estado === "bloqueada";
            const concluida = licao.estado === "concluida";
            const ehAtual = licao.estado === "atual";

            return (
              <button
                key={licao.id}
                type="button"
                disabled={bloqueada}
                onClick={() => abrirLicao(licao.id)}
                style={{ animationDelay: `${100 + indice * 35}ms` }}
                className={cn(
                  "animate-fade-in-up flex items-center gap-3 rounded-[18px] border px-4 py-3.5 text-left transition-colors duration-150",
                  ehAtual ? "border-primary bg-primary/10" : "border-border bg-card",
                  bloqueada ? "opacity-50" : "hover:border-primary/40"
                )}
              >
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl text-[0.9rem] font-black",
                    concluida ? "bg-emerald-500 text-white" : ehAtual ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  {concluida ? <Check className="size-5" strokeWidth={3} /> : bloqueada ? <Lock className="size-4" /> : indice + 1}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.92rem] font-black">{licao.titulo}</span>
                  <span className="block truncate text-[0.78rem] text-muted-foreground">
                    {ehAtual ? "Você está aqui" : concluida ? "Concluída" : bloqueada ? "Conclua a anterior pra liberar" : licao.subtitulo}
                  </span>
                </span>

                {licao.xp > 0 && (
                  <span
                    className={cn(
                      "flex shrink-0 items-center gap-1 text-[0.78rem] font-black",
                      concluida ? "text-emerald-500" : "text-amber-500"
                    )}
                  >
                    <Zap className="size-3.5 fill-current" />
                    {licao.xp}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {atual && (
          <button
            type="button"
            onClick={() => abrirLicao(atual.id)}
            className="zc-press zc-press-shadow mt-6 flex w-full items-center justify-center gap-2 rounded-[16px] bg-primary py-4 text-[0.85rem] font-black uppercase tracking-[0.06em] text-primary-foreground"
            style={{ ["--zc-press-color" as string]: "rgba(0,0,0,0.32)" }}
          >
            <Play className="size-4 fill-current" />
            Continuar de onde parei
          </button>
        )}
      </div>
    </TopbarSheet>
  );
}
