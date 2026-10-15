import { ReactNode } from "react";
import { Medal, Shield, Zap } from "lucide-react";
import { ChamaDupla } from "@/components/shared/chama-dupla";
import { PerfilUsuario } from "@/lib/types/perfil";
import { divisaoDoXp } from "@/lib/divisoes";
import { cn } from "@/lib/utils";

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
 * Os ícones são cheios, com o contorno num tom mais escuro do que o
 * preenchimento. Só de contorno eles sumiam dentro do card, que já tem borda —
 * virava desenho de linha sobre desenho de linha. O par de tons é escolhido com
 * folga suficiente pra borda não se perder dentro da própria cor.
 */
export function StatsGrid({ perfil }: StatsGridProps) {
  const divisao = divisaoDoXp(perfil.xp);

  const cartoes: { id: string; icone: ReactNode; valor: string; rotulo: string }[] = [
    {
      id: "streak",
      // A mesma chama da barra de cima: ela é azul desde a última mudança, e
      // apaga em cinza quando não há sequência — aqui valia o mesmo.
      icone: <ChamaDupla className="size-6 shrink-0 sm:size-7" aceso={perfil.streakAtual > 0} />,
      valor: perfil.streakAtual.toLocaleString("pt-BR"),
      rotulo: perfil.streakAtual === 1 ? "Dia seguido" : "Dias seguidos",
    },
    {
      id: "xp",
      // Sem contorno: o preenchimento e o traço são a mesma cor, então o raio
      // fica uma peça chapada só. O strokeWidth continua ali de propósito: sem
      // ele a forma afina e o ícone fica menor que os vizinhos.
      icone: <Zap className="size-6 shrink-0 sm:size-7 fill-amber-400 text-amber-400" strokeWidth={2.4} />,
      valor: perfil.xp.toLocaleString("pt-BR"),
      rotulo: "Total de XP",
    },
    {
      id: "divisao",
      icone: <Shield className={cn("size-6 shrink-0 sm:size-7", divisao.preenchimento, divisao.contorno)} strokeWidth={2.4} />,
      valor: divisao.nome,
      rotulo: "Divisão",
    },
    {
      id: "podios",
      // Deixou de ser "em breve": a tabela semanal fecha e registra o top 3 de
      // cada liga, então este número vem de pódios que aconteceram mesmo.
      icone: <Medal className="size-6 shrink-0 sm:size-7 fill-amber-400 text-amber-600" strokeWidth={2.4} />,
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
