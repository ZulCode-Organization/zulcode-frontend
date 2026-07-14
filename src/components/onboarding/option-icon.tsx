import {
  Baby,
  Bot,
  BookOpen,
  Brain,
  Briefcase,
  CheckCircle2,
  Clock,
  Flame,
  Gamepad2,
  GraduationCap,
  Globe,
  Heart,
  Laptop,
  Leaf,
  Lightbulb,
  type LucideIcon,
  PartyPopper,
  Rocket,
  Smile,
  Sparkles,
  Sprout,
  Star,
  Target,
  Trophy,
  TreePine,
  Zap,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  "🌱": Sprout,
  "🌿": Leaf,
  "🌳": TreePine,
  "🎯": Target,
  "🚀": Rocket,
  "💡": Lightbulb,
  "📚": BookOpen,
  "💻": Laptop,
  "🎮": Gamepad2,
  "🌐": Globe,
  "🤖": Bot,
  "⚡": Zap,
  "🔥": Flame,
  "🎓": GraduationCap,
  "👶": Baby,
  "🏆": Trophy,
  "⏰": Clock,
  "💼": Briefcase,
  "❤️": Heart,
  "⭐": Star,
  "😀": Smile,
  "🧠": Brain,
  "🎉": PartyPopper,
  "✅": CheckCircle2,
};

interface OptionIconProps {
  emoji?: string;
  className?: string;
}

export function OptionIcon({ emoji, className }: OptionIconProps) {
  const Icon = (emoji && ICONS[emoji]) || Sparkles;
  return <Icon className={className} />;
}
