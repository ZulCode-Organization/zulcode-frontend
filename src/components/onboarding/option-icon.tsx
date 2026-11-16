import {
  BookOpen,
  Brain,
  Building2,
  Cloud,
  Database,
  Gamepad2,
  Globe,
  Puzzle,
  School,
  Briefcase,
  Compass,
  Crown,
  Flame,
  Gift,
  GraduationCap,
  Hammer,
  type LucideIcon,
  Mic2,
  MoreHorizontal,
  PartyPopper,
  Palette,
  Sparkles,
  Sprout,
  ThumbsUp,
  Timer,
  Trophy,
  Users,
} from "lucide-react";
import type { IconType } from "react-icons";
import { FaLinkedin } from "react-icons/fa";
import { SiFacebook, SiGoogle, SiGoogleplay, SiInstagram, SiTiktok, SiYoutube } from "react-icons/si";

type IconEntry = { Icon: LucideIcon | IconType; color: string };

/**
 * Ícone + cor por id de opção do onboarding. As perguntas "como conheceu"
 * usam o logo real (e a cor real) do app; as demais usam um ícone temático
 * — nada de cair tudo no mesmo brilho genérico.
 */
const ICONS: Record<string, IconEntry> = {
  // how_heard — logos das redes/apps, cada um na cor da marca
  instagram: { Icon: SiInstagram, color: "#E4405F" },
  youtube: { Icon: SiYoutube, color: "#FF0000" },
  tiktok: { Icon: SiTiktok, color: "#010101" },
  facebook: { Icon: SiFacebook, color: "#1877F2" },
  linkedin: { Icon: FaLinkedin, color: "#0A66C2" },
  friends_family: { Icon: Users, color: "#F59E0B" },
  podcast: { Icon: Mic2, color: "#8B5CF6" },
  google: { Icon: SiGoogle, color: "#4285F4" },
  play_store: { Icon: SiGoogleplay, color: "#01875F" },
  school: { Icon: School, color: "#4F46E5" },

  // interest — do que a pessoa gosta (o "Não sei qual escolher")
  design: { Icon: Palette, color: "#EC4899" },
  logic: { Icon: Puzzle, color: "#7C3AED" },
  web: { Icon: Globe, color: "#2563EB" },
  data: { Icon: Database, color: "#0EA5E9" },
  games: { Icon: Gamepad2, color: "#22C55E" },
  systems: { Icon: Building2, color: "#F59E0B" },
  cloud: { Icon: Cloud, color: "#06B6D4" },

  // language_reason — por que está aprendendo
  explore: { Icon: Compass, color: "#14B8A6" },
  career: { Icon: Briefcase, color: "#2563EB" },
  education: { Icon: GraduationCap, color: "#4F46E5" },
  creative: { Icon: Palette, color: "#EC4899" },
  challenge: { Icon: Brain, color: "#7C3AED" },
  fun: { Icon: PartyPopper, color: "#F59E0B" },
  build_apps: { Icon: Hammer, color: "#059669" },

  // language_level — nível de experiência
  beginner: { Icon: Sprout, color: "#22C55E" },
  some_experience: { Icon: BookOpen, color: "#3B82F6" },
  confident: { Icon: ThumbsUp, color: "#8B5CF6" },
  expert: { Icon: Trophy, color: "#F59E0B" },

  // commitment — tempo por dia (cor mais intensa = mais tempo)
  "5min": { Icon: Timer, color: "#93C5FD" },
  "10min": { Icon: Timer, color: "#7AB8FB" },
  "15min": { Icon: Timer, color: "#60A5FA" },
  "30min": { Icon: Timer, color: "#3B82F6" },
  "60min": { Icon: Flame, color: "#DC2626" },

  // learning_plan
  free: { Icon: Gift, color: "#10B981" },
  pro: { Icon: Crown, color: "#F59E0B" },

  // usado em várias perguntas como opção residual
  other: { Icon: MoreHorizontal, color: "#6B7280" },
};

interface OptionIconProps {
  /** id/slug da opção (ex.: "tiktok", "career") — chave do mapeamento acima. */
  optionId?: string;
  className?: string;
}

export function OptionIcon({ optionId, className }: OptionIconProps) {
  const entry = optionId ? ICONS[optionId] : undefined;
  const Icon = entry?.Icon ?? Sparkles;
  return <Icon className={className} style={entry ? { color: entry.color } : undefined} />;
}
