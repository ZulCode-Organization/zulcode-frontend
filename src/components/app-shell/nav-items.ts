import { Home, BookOpen, Zap, Trophy, ShoppingBag, User, Settings, ShieldCheck, LayoutDashboard, FolderPlus, Bell, Users, Code2, type LucideIcon } from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  href?: string;
  icon: LucideIcon;
}

export const sidebarNavItems: NavItem[] = [
  { id: "jornada", label: "Jornada", href: "/home", icon: Home },
  { id: "elementos", label: "Elementos", href: "/elementos", icon: BookOpen },
  { id: "playground", label: "Playground", href: "/playground", icon: Code2 },
  { id: "metas", label: "Metas", href: "/metas", icon: Zap },
  { id: "lideres", label: "Líderes", href: "/tabela-lideres", icon: Trophy },
  { id: "loja", label: "Loja", href: "/loja", icon: ShoppingBag },
  { id: "perfil", label: "Perfil", href: "/perfil", icon: User },
  { id: "configuracoes", label: "Configurações", href: "/configuracoes", icon: Settings },
];

export const adminNavItems: NavItem[] = [
  { id: "admin-home", label: "Home", href: "/admin/home", icon: LayoutDashboard },
  { id: "admin-cursos", label: "Cursos", href: "/admin/cursos", icon: FolderPlus },
  { id: "admin-metas", label: "Metas", href: "/admin/metas", icon: Zap },
  { id: "admin-loja", label: "Loja", href: "/admin/loja", icon: ShoppingBag },
  { id: "admin-usuarios", label: "Usuários", href: "/admin/usuarios", icon: Users },
  { id: "admin-notificacoes", label: "Notificações", href: "/admin/notificacoes", icon: Bell },
];

export const adminEntry: NavItem = { id: "administrativo", label: "Administrativo", href: "/admin/home", icon: ShieldCheck };

/** No celular ficam só quatro destinos. Assim os rótulos continuam legíveis
 * em telas de 320px; os demais vivem no menu "Mais". */
export const bottomNavItems: NavItem[] = [
  { id: "jornada", label: "Jornada", href: "/home", icon: Home },
  { id: "elementos", label: "Elementos", href: "/elementos", icon: BookOpen },
  { id: "loja", label: "Loja", href: "/loja", icon: ShoppingBag },
  { id: "perfil", label: "Perfil", href: "/perfil", icon: User },
];

/** Também aparecem no menu "Mais" do celular, para complementar a barra
 * inferior sem aumentar a quantidade de atalhos fixos. */
export const moreNavItems: NavItem[] = [
  { id: "metas", label: "Metas", href: "/metas", icon: Zap },
  { id: "lideres", label: "Líderes", href: "/tabela-lideres", icon: Trophy },
  { id: "playground", label: "Playground", href: "/playground", icon: Code2 },
  { id: "configuracoes", label: "Configurações", href: "/configuracoes", icon: Settings },
];
