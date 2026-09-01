import { Home, BookOpen, Zap, Trophy, ShoppingBag, User, Settings, ShieldCheck, LayoutDashboard, FolderPlus, Bell, Users, Code2, Bug, type LucideIcon } from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  href?: string;
  external?: boolean;
  icon: LucideIcon;
}

/** Os destinos fixos da barra lateral. O que é usado com menos frequência
 * saiu daqui e foi pro botão "Mais…", pra a lista não virar um paredão. */
export const sidebarNavItems: NavItem[] = [
  { id: "jornada", label: "Jornada", href: "/home", icon: Home },
  { id: "elementos", label: "Elementos", href: "/elementos", icon: BookOpen },
  { id: "metas", label: "Metas", href: "/metas", icon: Zap },
  { id: "lideres", label: "Líderes", href: "/tabela-lideres", icon: Trophy },
  { id: "loja", label: "Loja", href: "/loja", icon: ShoppingBag },
  { id: "perfil", label: "Perfil", href: "/perfil", icon: User },
];

/** O que abre no menu lateral do botão "Mais…" (só no desktop — no celular
 * esse papel é do `moreNavItems`, na barra de baixo). */
export const sidebarMoreItems: NavItem[] = [
  { id: "playground", label: "Playground", href: "/playground", icon: Code2 },
  { id: "configuracoes", label: "Configurações", href: "/configuracoes", icon: Settings },
  { id: "reportar-bug", label: "Reportar bug", href: "https://forms.cloud.microsoft/r/FD8MLw693j", external: true, icon: Bug },
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

/** No celular ficam cinco destinos, só com ícone. Com o botão "Mais" são seis
 * ladrilhos de 48px: 296px com o respiro da barra, que ainda cabe numa tela de
 * 320px. O resto vive dentro do menu "Mais". */
export const bottomNavItems: NavItem[] = [
  { id: "jornada", label: "Jornada", href: "/home", icon: Home },
  { id: "elementos", label: "Elementos", href: "/elementos", icon: BookOpen },
  { id: "lideres", label: "Líderes", href: "/tabela-lideres", icon: Trophy },
  { id: "loja", label: "Loja", href: "/loja", icon: ShoppingBag },
  { id: "perfil", label: "Perfil", href: "/perfil", icon: User },
];

/** Também aparecem no menu "Mais" do celular, para complementar a barra
 * inferior sem aumentar a quantidade de atalhos fixos. */
export const moreNavItems: NavItem[] = [
  { id: "metas", label: "Metas", href: "/metas", icon: Zap },
  { id: "playground", label: "Playground", href: "/playground", icon: Code2 },
  { id: "configuracoes", label: "Configurações", href: "/configuracoes", icon: Settings },
  { id: "reportar-bug", label: "Reportar bug", href: "https://forms.cloud.microsoft/r/FD8MLw693j", external: true, icon: Bug },
];
