import { Flame, Medal, Shield, Zap } from "lucide-react";
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
 */
export function StatsGrid({ perfil }: StatsGridProps) {
  const divisao = divisaoDoXp(perfil.xp);

  const cartoes = [
    {
      id: "streak",
      Icone: Flame,
      cor: "text-orange-500",
      valor: perfil.streakAtual.toLocaleString("pt-BR"),
      rotulo: perfil.streakAtual === 1 ? "Dia seguido" : "Dias seguidos",
    },
    {
      id: "xp",
      Icone: Zap,
      cor: "text-amber-400",
      valor: perfil.xp.toLocaleString("pt-BR"),
      rotulo: "Total de XP",
    },
    {
      id: "divisao",
      Icone: Shield,
      cor: divisao.texto,
      valor: divisao.nome,
      rotulo: "Divisão",
    },
    {
      id: "podios",
      Icone: Medal,
      cor: "text-muted-foreground",
      valor: "—",
      rotulo: "Pódios",
      emBreve: true,
    },
  ];

  return (
    <section>
      <h2 className="text-lg font-black text-foreground">Estatísticas</h2>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {cartoes.map(({ id, Icone, cor, valor, rotulo, emBreve }) => (
          <div
            key={id}
            className={cn(
              "relative flex items-center gap-3.5 rounded-[18px] border border-border bg-card px-5 py-4",
              emBreve && "opacity-60"
            )}
          >
            <Icone className={cn("size-7 shrink-0", cor)} strokeWidth={2.4} />
            <div className="min-w-0">
              <p className="truncate text-[1.15rem] font-black leading-none text-foreground">{valor}</p>
              <p className="mt-1.5 truncate text-[0.85rem] text-muted-foreground">{rotulo}</p>
            </div>
            {emBreve && (
              <span className="absolute right-3 top-3 rounded-md bg-muted px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-[0.08em] text-muted-foreground">
                Em breve
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
