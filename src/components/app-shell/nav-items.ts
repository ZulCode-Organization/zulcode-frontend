import type { ComponentType } from "react";
import { Zap, ShoppingBag, ShieldCheck, LayoutDashboard, FolderPlus, Bell, Users } from "lucide-react";
import {
  DuoBug, DuoConfiguracoes, DuoElementos, DuoJornada, DuoLideres, DuoLoja, DuoMetas, DuoPerfil, DuoPlayground,
} from "@/components/shared/icone-duo";

export interface NavItem {
  id: string;
  label: string;
  href?: string;
  external?: boolean;
  /** Os destinos de quem estuda usam os ícones de duas camadas; o
   *  administrativo continua no lucide, que é o resto do painel dele. */
  icon: ComponentType<{ className?: string }>;
}

/** Os destinos fixos da barra lateral. O que é usado com menos frequência
 * saiu daqui e foi pro botão "Mais…", pra a lista não virar um paredão. */
export const sidebarNavItems: NavItem[] = [
  { id: "jornada", label: "Jornada", href: "/home", icon: DuoJornada },
  { id: "elementos", label: "Elementos", href: "/elementos", icon: DuoElementos },
  { id: "metas", label: "Metas", href: "/metas", icon: DuoMetas },
  { id: "lideres", label: "Líderes", href: "/tabela-lideres", icon: DuoLideres },
  { id: "loja", label: "Loja", href: "/loja", icon: DuoLoja },
  { id: "perfil", label: "Perfil", href: "/perfil", icon: DuoPerfil },
];

/** O que abre no menu lateral do botão "Mais…" (só no desktop — no celular
 * esse papel é do `moreNavItems`, na barra de baixo). */
export const sidebarMoreItems: NavItem[] = [
  { id: "playground", label: "Playground", href: "/playground", icon: DuoPlayground },
  { id: "configuracoes", label: "Configurações", href: "/configuracoes", icon: DuoConfiguracoes },
  { id: "reportar-bug", label: "Reportar bug", href: "https://forms.cloud.microsoft/r/FD8MLw693j", external: true, icon: DuoBug },
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
  { id: "jornada", label: "Jornada", href: "/home", icon: DuoJornada },
  { id: "elementos", label: "Elementos", href: "/elementos", icon: DuoElementos },
  { id: "lideres", label: "Líderes", href: "/tabela-lideres", icon: DuoLideres },
  { id: "loja", label: "Loja", href: "/loja", icon: DuoLoja },
  { id: "perfil", label: "Perfil", href: "/perfil", icon: DuoPerfil },
];

/** Também aparecem no menu "Mais" do celular, para complementar a barra
 * inferior sem aumentar a quantidade de atalhos fixos. */
export const moreNavItems: NavItem[] = [
  { id: "metas", label: "Metas", href: "/metas", icon: DuoMetas },
  { id: "playground", label: "Playground", href: "/playground", icon: DuoPlayground },
  { id: "configuracoes", label: "Configurações", href: "/configuracoes", icon: DuoConfiguracoes },
  { id: "reportar-bug", label: "Reportar bug", href: "https://forms.cloud.microsoft/r/FD8MLw693j", external: true, icon: DuoBug },
];
