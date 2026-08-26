import { Atom, BadgeCheck, Bot, Code2, Crown, Ghost, Rocket, ShieldCheck, Sparkles, Orbit, Terminal, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

export const AVATARES = [
  { id: "orbit", label: "Órbita", Icon: Atom },
  { id: "code", label: "Código", Icon: Code2 },
  { id: "rocket", label: "Foguete", Icon: Rocket },
  { id: "shield", label: "Escudo", Icon: ShieldCheck },
  { id: "bot", label: "Bot", Icon: Bot },
  { id: "spark", label: "Faísca", Icon: Sparkles },
  { id: "crown", label: "Coroa", Icon: Crown },
  { id: "ghost", label: "Fantasma", Icon: Ghost },
  { id: "comet", label: "Cometa", Icon: Orbit },
  { id: "pro", label: "Emblema PRO", Icon: BadgeCheck },
  { id: "developer", label: "Desenvolvedor", Icon: Terminal },
  { id: "early-tester", label: "Pioneiro", Icon: FlaskConical },
] as const;

export type AvatarId = (typeof AVATARES)[number]["id"];

export function AvatarIcon({ id, className }: { id?: string | null; className?: string }) {
  const avatar = AVATARES.find((item) => item.id === id) ?? AVATARES[0];
  const Icon = avatar.Icon;
  return <Icon aria-label={avatar.label} className={cn("size-[0.9em] stroke-[2.4]", className)} />;
}
