import { Flame, Zap, TrendingUp, Star } from "lucide-react";
import { PerfilUsuario } from "@/lib/types/perfil";

interface StatsGridProps {
  perfil: PerfilUsuario;
}

export function StatsGrid({ perfil }: StatsGridProps) {
  const stats = [
    { id: "streak", icon: Flame, valor: perfil.streakAtual, label: "Dias seguidos" },
    { id: "xp", icon: Zap, valor: perfil.xp.toLocaleString("pt-BR"), label: "XP Total" },
    { id: "recorde", icon: TrendingUp, valor: perfil.streakRecorde, label: "Maior sequência" },
    { id: "nivel", icon: Star, valor: perfil.nivel, label: "Nível" },
  ];

  return (
    <div
      className="animate-fade-in-up grid grid-cols-2 gap-3 sm:grid-cols-4"
      style={{ animationDelay: "60ms" }}
    >
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.id}
            className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-4 py-5 text-center"
          >
            <Icon className="size-5 text-primary" />
            <span className="text-2xl font-extrabold text-foreground">{stat.valor}</span>
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
        );
      })}
    </div>
  );
}
