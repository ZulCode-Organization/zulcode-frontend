import { Home, BookOpen, Zap, Trophy, ShoppingBag, User, ShieldCheck, LayoutDashboard, FolderPlus, Bell, Users, ArrowLeftFromLine, type LucideIcon } from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  href?: string;
  icon: LucideIcon;
}

export const sidebarNavItems: NavItem[] = [
  { id: "jornada", label: "Jornada", href: "/home", icon: Home },
  { id: "elementos", label: "Elementos", href: "/elementos", icon: BookOpen },
  { id: "metas", label: "Metas", href: "/metas", icon: Zap },
  { id: "lideres", label: "Líderes", href: "/tabela-lideres", icon: Trophy },
  { id: "loja", label: "Loja", href: "/loja", icon: ShoppingBag },
  { id: "perfil", label: "Perfil", href: "/perfil", icon: User },
];

export const adminNavItems: NavItem[] = [
  { id: "admin-home", label: "Home", href: "/admin/home", icon: LayoutDashboard },
  { id: "admin-cursos", label: "Cursos", href: "/admin/cursos", icon: FolderPlus },
  { id: "admin-metas", label: "Metas", href: "/admin/metas", icon: Zap },
  { id: "admin-whitelist", label: "Whitelist", href: "/admin/usuarios?filter=whitelist", icon: Users },
  { id: "admin-blacklist", label: "Blacklist", href: "/admin/usuarios?filter=blacklist", icon: ShieldCheck },
  { id: "admin-notificacoes", label: "Notificações", href: "/admin/notificacoes", icon: Bell },
  { id: "exit-admin", label: "Sair do admin", href: "/home", icon: ArrowLeftFromLine },
];

export const adminEntry: NavItem = { id: "administrativo", label: "Administrativo", href: "/admin/home", icon: ShieldCheck };

/** Cabem fixos na barra inferior do celular — os 2 que sobram (Metas,
 * Líderes) vão pro menu "Mais" (ver moreNavItems). */
export const bottomNavItems: NavItem[] = [
  { id: "jornada", label: "Jornada", href: "/home", icon: Home },
  { id: "elementos", label: "Elementos", href: "/elementos", icon: BookOpen },
  { id: "loja", label: "Loja", href: "/loja", icon: ShoppingBag },
  { id: "perfil", label: "Perfil", href: "/perfil", icon: User },
];

/** Só aparecem no celular, dentro do menu "Mais" (…) da barra inferior —
 * no desktop todos os itens já vivem na sidebar. */
export const moreNavItems: NavItem[] = [
  { id: "metas", label: "Metas", href: "/metas", icon: Zap },
  { id: "lideres", label: "Líderes", href: "/tabela-lideres", icon: Trophy },
];
