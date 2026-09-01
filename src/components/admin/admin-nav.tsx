"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, Megaphone, ShoppingBag, Target, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Navegação entre as seções do admin.
 *
 * Antes só existia o link "Administrativo" da sidebar, e ele apontava para
 * /admin — uma rota que nem existia, então dava 404. As outras cinco telas
 * não tinham link em lugar nenhum: só dava pra chegar nelas digitando a URL.
 *
 * A faixa rola de lado no celular em vez de quebrar em duas linhas, porque
 * uma barra de seções que muda de altura empurra o conteúdo da página pra
 * baixo toda vez que a janela encolhe.
 */
const SECOES = [
  { href: "/admin/home", rotulo: "Visão geral", Icone: BarChart3 },
  { href: "/admin/usuarios", rotulo: "Usuários", Icone: UsersRound },
  { href: "/admin/cursos", rotulo: "Cursos", Icone: BookOpen },
  { href: "/admin/loja", rotulo: "Loja", Icone: ShoppingBag },
  { href: "/admin/metas", rotulo: "Metas", Icone: Target },
  { href: "/admin/notificacoes", rotulo: "Notificações", Icone: Megaphone },
];

export function AdminNav() {
  const caminho = usePathname();

  return (
    <nav
      aria-label="Seções da administração"
      className="zc-scroll-hidden sticky top-0 z-20 -mx-4 flex gap-1.5 overflow-x-auto bg-background/85 px-4 py-3 backdrop-blur lg:-mx-8 lg:px-8"
    >
      {SECOES.map(({ href, rotulo, Icone }) => {
        // startsWith, e não igualdade: as telas de dentro de cursos
        // (/admin/cursos/<id>/...) precisam manter "Cursos" aceso.
        const ativa = caminho === href || caminho.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={ativa ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-black transition-colors duration-150",
              ativa
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icone className="size-4" />
            {rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
