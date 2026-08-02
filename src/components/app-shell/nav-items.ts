import { Home, Zap, Target, Trophy, ShoppingBag, User, MoreVertical, type LucideIcon } from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  href?: string;
  icon: LucideIcon;
}

export const sidebarNavItems: NavItem[] = [
  { id: "jornada", label: "Jornada", href: "/home", icon: Home },
  { id: "desafio", label: "Desafio Diário", href: "/desafio-diario", icon: Zap },
  { id: "metas", label: "Metas", href: "/metas", icon: Target },
  { id: "lideres", label: "Tabela de Líderes", href: "/tabela-lideres", icon: Trophy },
  { id: "loja", label: "Loja", href: "/loja", icon: ShoppingBag },
  { id: "perfil", label: "Perfil", href: "/perfil", icon: User },
  { id: "mais", label: "Mais", icon: MoreVertical },
];

export const bottomNavItems: NavItem[] = [
  { id: "jornada", label: "Jornada", href: "/home", icon: Home },
  { id: "desafio", label: "Desafio", href: "/desafio-diario", icon: Zap },
  { id: "loja", label: "Loja", href: "/loja", icon: ShoppingBag },
  { id: "perfil", label: "Perfil", href: "/perfil", icon: User },
];
