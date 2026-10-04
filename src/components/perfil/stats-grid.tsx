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

  const cartoes: { id: string; icone: ReactNode; valor: string; rotulo: string; emBreve?: boolean }[] = [
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
      // Cheio como os outros, mas em cinza: o card inteiro já está esmaecido
      // por "em breve", e um ícone colorido ali chamaria mais atenção que os
      // três que têm dado de verdade.
      icone: <Medal className="size-6 shrink-0 sm:size-7 fill-muted-foreground/30 text-muted-foreground" strokeWidth={2.4} />,
      valor: "—",
      rotulo: "Pódios",
      emBreve: true,
    },
  ];

  return (
    <section>
      <h2 className="text-lg font-black text-foreground">Estatísticas</h2>

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3">
        {cartoes.map(({ id, icone, valor, rotulo, emBreve }) => (
          <div
            key={id}
            title={emBreve ? "Em breve" : undefined}
            className={cn(
              "relative flex items-center gap-2.5 rounded-2xl border border-border bg-card px-3 py-3",
              "sm:gap-3.5 sm:rounded-[18px] sm:px-5 sm:py-4",
              emBreve && "opacity-60"
            )}
          >
            {icone}
            <div className="min-w-0">
              <p className="truncate text-[0.95rem] font-black leading-none sm:text-[1.15rem] text-foreground">{valor}</p>
              <p className="mt-1 truncate text-[0.75rem] sm:mt-1.5 sm:text-[0.85rem] text-muted-foreground">{rotulo}</p>
            </div>
            {emBreve && (
              <span className="absolute right-3 top-3 hidden sm:block rounded-md bg-muted px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-[0.08em] text-muted-foreground">
                Em breve
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
