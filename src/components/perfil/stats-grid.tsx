import { Flame, Zap, TrendingUp, Star, ShieldCheck } from "lucide-react";
import { PerfilUsuario } from "@/lib/types/perfil";

interface StatsGridProps {
  perfil: PerfilUsuario;
}

export function StatsGrid({ perfil }: StatsGridProps) {
  const stats = [
    {
      id: "streak",
      icon: Flame,
      valor: perfil.streakAtual,
      label: "Dias seguidos",
      chip: "bg-orange-500/15 text-orange-500",
    },
    ...(perfil.streakFreezes ? [{ id: "protecoes", icon: ShieldCheck, valor: perfil.streakFreezes, label: "Proteções de sequência", chip: "bg-sky-500/15 text-sky-500" }] : []),
    {
      id: "xp",
      icon: Zap,
      valor: perfil.xp.toLocaleString("pt-BR"),
      label: "XP Total",
      chip: "bg-sky-500/15 text-sky-500",
    },
    {
      id: "recorde",
      icon: TrendingUp,
      valor: perfil.streakRecorde,
      label: "Maior sequência",
      chip: "bg-emerald-500/15 text-emerald-500",
    },
    {
      id: "nivel",
      icon: Star,
      valor: perfil.nivel,
      label: "Nível",
      chip: "bg-amber-400/20 text-amber-500",
    },
  ];

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: "60ms" }}>
      <h2 className="text-lg font-black text-foreground">Estatísticas</h2>

      <div className="mt-2.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.id}
              className="flex min-w-0 items-center gap-3.5 rounded-[20px] border border-border bg-card p-4.5"
            >
              <span
                className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${stat.chip}`}
              >
                <Icon className="size-5.5" />
              </span>
              <div className="min-w-0">
                <p className="text-xl font-black text-foreground">{stat.valor}</p>
                <p className="text-xs text-muted-foreground/70">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
