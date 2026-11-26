import type { Icon as IconePhosphor } from "@phosphor-icons/react";
import {
  BookOpen,
  Brain,
  Briefcase,
  Buildings,
  Cloud,
  Code,
  Compass,
  Crown,
  Database,
  DeviceMobile,
  DotsThree,
  GameController,
  Globe,
  GraduationCap,
  PaintBrush,
  Plant,
  PuzzlePiece,
  Smiley,
} from "@phosphor-icons/react/dist/ssr";
import { IconeDuo } from "@/components/shared/icone-duo";
import { OptionIcon } from "@/components/onboarding/option-icon";

/**
 * Os ícones das opções do nivelamento, no mesmo desenho de duas camadas da
 * barra de navegação. Os de "como conheceu" continuam com o logo de verdade
 * de cada app (o OptionIcon), que é o que a pessoa reconhece.
 */
const ICONES: Record<string, IconePhosphor> = {
  // Quanto já sabe
  beginner: Plant,
  some_experience: BookOpen,
  confident: Code,
  expert: Crown,
  // Motivos
  explore: Compass,
  career: Briefcase,
  education: GraduationCap,
  build_apps: DeviceMobile,
  creative: GameController,
  challenge: Brain,
  fun: Smiley,
  other: DotsThree,
  // Do que gosta (o "Não sei qual escolher")
  design: PaintBrush,
  logic: PuzzlePiece,
  web: Globe,
  data: Database,
  games: GameController,
  systems: Buildings,
  cloud: Cloud,
};

export function IconeDaOpcao({ optionId, className = "size-6" }: { optionId: string; className?: string }) {
  const icone = ICONES[optionId];
  if (icone) return <IconeDuo icone={icone} className={className} />;
  return <OptionIcon optionId={optionId} className="size-5" />;
}
