import { BarChart3, BookOpen, History, Megaphone, ShoppingBag, Target, UsersRound } from "lucide-react";

/** As seções do administrativo. `soAdmin` esconde do professor, que só cuida de conteúdo. */
export const SECOES = [
  { href: "/admin/visao", rotulo: "Visão geral", Icone: BarChart3, atalho: "v", soAdmin: true },
  { href: "/admin/pessoas", rotulo: "Pessoas", Icone: UsersRound, atalho: "p", soAdmin: true },
  { href: "/admin/conteudo", rotulo: "Conteúdo", Icone: BookOpen, atalho: "c", soAdmin: false },
  { href: "/admin/loja", rotulo: "Loja", Icone: ShoppingBag, atalho: "l", soAdmin: true },
  { href: "/admin/metas", rotulo: "Metas", Icone: Target, atalho: "m", soAdmin: true },
  { href: "/admin/notificacoes", rotulo: "Notificações", Icone: Megaphone, atalho: "n", soAdmin: true },
  { href: "/admin/registro", rotulo: "Registro de ações", Icone: History, atalho: "r", soAdmin: true },
] as const;
