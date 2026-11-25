import {
  BarChart3, BookOpen, CalendarClock, Clock, Download, Flag, HeartPulse, History, Megaphone, MessageSquareWarning, Palette,
  PartyPopper, ShoppingBag, SlidersHorizontal, Smartphone, Target, TicketPercent, Trophy, UsersRound, type LucideIcon,
} from "lucide-react";

/** Os grupos do menu, na ordem em que aparecem. */
export const GRUPOS = ["Acompanhar", "Pessoas", "Conteúdo", "Jogo", "App"] as const;

type Secao = { href: string; rotulo: string; Icone: LucideIcon; atalho: string; soAdmin: boolean; grupo: (typeof GRUPOS)[number] };

/**
 * As seções do administrativo, já na ordem dos grupos. `soAdmin` esconde do
 * professor, que só cuida de conteúdo. `atalho` é a letra do "g + letra".
 */
export const SECOES = [
  { href: "/admin/visao", rotulo: "Visão geral", Icone: BarChart3, atalho: "v", soAdmin: true, grupo: "Acompanhar" },
  { href: "/admin/hoje", rotulo: "Hoje", Icone: CalendarClock, atalho: "h", soAdmin: true, grupo: "Acompanhar" },
  { href: "/admin/saude", rotulo: "Saúde do sistema", Icone: HeartPulse, atalho: "s", soAdmin: true, grupo: "Acompanhar" },
  { href: "/admin/registro", rotulo: "Registro de ações", Icone: History, atalho: "r", soAdmin: true, grupo: "Acompanhar" },
  { href: "/admin/pessoas", rotulo: "Pessoas", Icone: UsersRound, atalho: "p", soAdmin: true, grupo: "Pessoas" },
  { href: "/admin/denuncias", rotulo: "Denúncias", Icone: Flag, atalho: "d", soAdmin: true, grupo: "Pessoas" },
  { href: "/admin/conteudo", rotulo: "Conteúdo", Icone: BookOpen, atalho: "c", soAdmin: false, grupo: "Conteúdo" },
  { href: "/admin/erros", rotulo: "Erros nas questões", Icone: MessageSquareWarning, atalho: "q", soAdmin: true, grupo: "Conteúdo" },
  { href: "/admin/em-breve", rotulo: "Em breve", Icone: Clock, atalho: "e", soAdmin: true, grupo: "Conteúdo" },
  { href: "/admin/loja", rotulo: "Loja", Icone: ShoppingBag, atalho: "l", soAdmin: true, grupo: "Jogo" },
  { href: "/admin/metas", rotulo: "Metas", Icone: Target, atalho: "m", soAdmin: true, grupo: "Jogo" },
  { href: "/admin/conquistas", rotulo: "Conquistas", Icone: Trophy, atalho: "a", soAdmin: true, grupo: "Jogo" },
  { href: "/admin/eventos", rotulo: "Eventos", Icone: PartyPopper, atalho: "f", soAdmin: true, grupo: "Jogo" },
  { href: "/admin/codigos", rotulo: "Códigos promocionais", Icone: TicketPercent, atalho: "o", soAdmin: true, grupo: "Jogo" },
  { href: "/admin/ajustes", rotulo: "Ajustes do jogo", Icone: SlidersHorizontal, atalho: "j", soAdmin: true, grupo: "Jogo" },
  { href: "/admin/notificacoes", rotulo: "Notificações", Icone: Megaphone, atalho: "n", soAdmin: true, grupo: "App" },
  { href: "/admin/versao", rotulo: "Atualização do app", Icone: Download, atalho: "u", soAdmin: true, grupo: "App" },
  { href: "/admin/tema", rotulo: "Tema da barra", Icone: Palette, atalho: "t", soAdmin: true, grupo: "App" },
  { href: "/admin/icone", rotulo: "Ícone do app", Icone: Smartphone, atalho: "i", soAdmin: true, grupo: "App" },
] as const satisfies readonly Secao[];
