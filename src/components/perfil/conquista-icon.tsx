import { Flame, Zap, Trophy, Star, Laptop, TrendingUp, type LucideIcon } from "lucide-react";
import { IconeConquista } from "@/lib/types/usuario";

const ICONS: Record<IconeConquista, LucideIcon> = {
  flame: Flame,
  zap: Zap,
  trophy: Trophy,
  star: Star,
  laptop: Laptop,
  "trending-up": TrendingUp,
};

interface ConquistaIconProps {
  icone: IconeConquista;
  className?: string;
}

export function ConquistaIcon({ icone, className }: ConquistaIconProps) {
  const Icon = ICONS[icone];
  return <Icon className={className} />;
}
