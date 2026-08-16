import { Home, BookOpen, Target, Trophy, ShoppingBag, User, type LucideIcon } from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  href?: string;
  icon: LucideIcon;
}

export const sidebarNavItems: NavItem[] = [
  { id: "jornada", label: "Jornada", href: "/home", icon: Home },
  { id: "elementos", label: "Elementos", href: "/elementos", icon: BookOpen },
  { id: "metas", label: "Metas", href: "/metas", icon: Target },
  { id: "lideres", label: "Tabela de Líderes", href: "/tabela-lideres", icon: Trophy },
  { id: "loja", label: "Loja", href: "/loja", icon: ShoppingBag },
  { id: "perfil", label: "Perfil", href: "/perfil", icon: User },
];

export const bottomNavItems: NavItem[] = [
  { id: "jornada", label: "Jornada", href: "/home", icon: Home },
  { id: "elementos", label: "Elementos", href: "/elementos", icon: BookOpen },
  { id: "loja", label: "Loja", href: "/loja", icon: ShoppingBag },
  { id: "perfil", label: "Perfil", href: "/perfil", icon: User },
];
