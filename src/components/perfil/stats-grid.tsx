import { ReactNode } from "react";
import { DuoDivisao, DuoPodio, DuoXp } from "@/components/shared/icone-duo";
import { ChamaDupla } from "@/components/shared/chama-dupla";
import { PerfilUsuario } from "@/lib/types/perfil";
import { divisaoDoXp } from "@/lib/divisoes";
import { cn } from "@/lib/utils";

/** O mesmo tamanho para os quatro, um pouco maior no computador. */
const TAMANHO = "size-8 sm:size-9";

interface StatsGridProps {
  perfil: PerfilUsuario;
}

/**
 * As quatro estatísticas do perfil, em 2×2 como na referência.
 *
 * Três saem de dado real: sequência e XP vêm do GET /user, e a divisão é
 * calculada da mesma faixa de XP que o backend usa nas ligas. "Pódios" fica
 * marcado como em breve — o backend guarda a colocação atual, mas não histórico
 * de quem terminou no pódio, então qualquer número ali seria inventado.
 *
 * Os ícones seguem o estilo de duas camadas da navegação: o volume
 * translúcido e o detalhe cheio, na mesma cor, uma por número. A chama é do
 * Hugeicons e o selo da divisão do Duo Icons; o raio e a medalha, da Solar.
 */
export function StatsGrid({ perfil }: StatsGridProps) {
  const divisao = divisaoDoXp(perfil.xp);

  const cartoes: { id: string; icone: ReactNode; valor: string; rotulo: string }[] = [
    {
      id: "streak",
      // A mesma chama da barra de cima, cinza sem sequência.
      icone: <ChamaDupla className={TAMANHO} dias={perfil.streakAtual} aceso={perfil.streakAtual > 0} />,
      valor: perfil.streakAtual.toLocaleString("pt-BR"),
      rotulo: perfil.streakAtual === 1 ? "Dia seguido" : "Dias seguidos",
    },
    {
      id: "xp",
      icone: <DuoXp className={cn(TAMANHO, "text-amber-400")} />,
      valor: perfil.xp.toLocaleString("pt-BR"),
      rotulo: "Total de XP",
    },
    {
      id: "divisao",
      icone: <DuoDivisao className={cn(TAMANHO, divisao.texto)} />,
      valor: divisao.nome,
      rotulo: "Divisão",
    },
    {
      id: "podios",
      // Deixou de ser "em breve": a tabela semanal fecha e registra o top 3 de
      // cada liga, então este número vem de pódios que aconteceram mesmo.
      icone: <DuoPodio className={cn(TAMANHO, "text-amber-400")} />,
      valor: (perfil.podios ?? 0).toLocaleString("pt-BR"),
      rotulo: "Pódios",
    },
  ];

  return (
    <section>
      <h2 className="text-[0.78rem] font-black uppercase tracking-[0.12em] text-muted-foreground">Visão geral</h2>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5">
        {cartoes.map(({ id, icone, valor, rotulo }) => (
          <div
            key={id}
            className="flex items-center gap-3"
          >
            {icone}
            <div className="min-w-0">
              <p className="truncate text-[1.25rem] font-black leading-none text-foreground">{valor}</p>
              <p className="mt-1 truncate text-[0.8rem] font-bold text-muted-foreground">{rotulo}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
