import {
  Award,
  BookOpen,
  Bug,
  CalendarCheck,
  Code2,
  Coins,
  Feather,
  Flame,
  FlaskConical,
  Footprints,
  Gem,
  GraduationCap,
  Heart,
  HeartPulse,
  ImageIcon,
  KeyRound,
  Layers,
  Palette,
  Shield,
  Snowflake,
  Sparkles,
  Target,
  Timer,
  Trophy,
  UserRound,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

export interface EstiloConquista {
  Icone: LucideIcon;
  /** Cor do traço. */
  cor: string;
  /** Fundo do ladrilho, na mesma cor e bem diluído. */
  fundo: string;
}

/**
 * O desenho de cada conquista.
 *
 * São 85 conquistas, e desenhar uma a uma daria 85 desenhos sem parentesco
 * nenhum. Em vez disso elas são agrupadas por família — tudo que começa com
 * `streak-` é fogo laranja, `xp-` é raio âmbar, `theme-` é paleta roxa — então
 * a grade do perfil lê como um conjunto, e conquista nova entra no lugar certo
 * sozinha, sem precisar de cadastro.
 *
 * A ordem importa: o id exato ganha da família. É o que permite que
 * `double-xp` seja o raio da loja, e não o raio genérico de XP.
 */
const POR_ID: Record<string, EstiloConquista> = {
  // Marcos únicos
  "first-step": { Icone: Footprints, cor: "text-emerald-500", fundo: "bg-emerald-500/12" },
  "bug-hunter": { Icone: Bug, cor: "text-lime-500", fundo: "bg-lime-500/12" },
  "community-hero": { Icone: Users, cor: "text-sky-500", fundo: "bg-sky-500/12" },
  "course-completionist": { Icone: GraduationCap, cor: "text-amber-500", fundo: "bg-amber-500/12" },

  // Selos de gente da casa
  "developer": { Icone: Code2, cor: "text-teal-500", fundo: "bg-teal-500/12" },
  "dev-ally": { Icone: Code2, cor: "text-teal-400", fundo: "bg-teal-400/12" },
  "early-tester": { Icone: FlaskConical, cor: "text-blue-500", fundo: "bg-blue-500/12" },
  "richard-tribute": { Icone: Heart, cor: "text-sky-400", fundo: "bg-sky-400/12" },

  // Efeitos que vêm da loja: cada um usa o próprio símbolo, e não o da família
  "double-xp": { Icone: Zap, cor: "text-amber-400", fundo: "bg-amber-400/12" },
  "double-coins": { Icone: Coins, cor: "text-yellow-400", fundo: "bg-yellow-400/12" },
  "feather-shield": { Icone: Shield, cor: "text-indigo-500", fundo: "bg-indigo-500/12" },
  "freeze-streak": { Icone: Snowflake, cor: "text-cyan-400", fundo: "bg-cyan-400/12" },
  "heal-one-life": { Icone: HeartPulse, cor: "text-pink-500", fundo: "bg-pink-500/12" },
  "recover-lives": { Icone: Feather, cor: "text-rose-500", fundo: "bg-rose-500/12" },
};

/** Prefixo do id, do mais específico pro mais geral. */
const POR_FAMILIA: [string, EstiloConquista][] = [
  ["streak-", { Icone: Flame, cor: "text-orange-500", fundo: "bg-orange-500/12" }],
  ["xp-", { Icone: Zap, cor: "text-amber-500", fundo: "bg-amber-500/12" }],
  ["coins-", { Icone: Coins, cor: "text-yellow-500", fundo: "bg-yellow-500/12" }],
  ["lesson-", { Icone: BookOpen, cor: "text-blue-500", fundo: "bg-blue-500/12" }],
  ["unit-", { Icone: Layers, cor: "text-indigo-500", fundo: "bg-indigo-500/12" }],
  ["rank-", { Icone: Trophy, cor: "text-violet-500", fundo: "bg-violet-500/12" }],
  ["perfect-", { Icone: Target, cor: "text-emerald-500", fundo: "bg-emerald-500/12" }],
  ["consistency-", { Icone: Timer, cor: "text-cyan-500", fundo: "bg-cyan-500/12" }],
  ["study-", { Icone: CalendarCheck, cor: "text-teal-500", fundo: "bg-teal-500/12" }],
  ["avatar-", { Icone: UserRound, cor: "text-fuchsia-500", fundo: "bg-fuchsia-500/12" }],
  ["banner-", { Icone: ImageIcon, cor: "text-pink-500", fundo: "bg-pink-500/12" }],
  ["theme-", { Icone: Palette, cor: "text-purple-500", fundo: "bg-purple-500/12" }],
  ["secret-", { Icone: KeyRound, cor: "text-slate-400", fundo: "bg-slate-400/12" }],
  ["limited-", { Icone: Gem, cor: "text-rose-400", fundo: "bg-rose-400/12" }],
  ["goal-", { Icone: Sparkles, cor: "text-primary", fundo: "bg-primary/12" }],
];

/** Quando o id não se encaixa em nada: uma medalha neutra, nunca um buraco. */
const PADRAO: EstiloConquista = { Icone: Award, cor: "text-muted-foreground", fundo: "bg-muted" };

export function estiloDaConquista(id: string): EstiloConquista {
  return POR_ID[id] ?? POR_FAMILIA.find(([prefixo]) => id.startsWith(prefixo))?.[1] ?? PADRAO;
}
