"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { X, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { limparPerfilCache } from "@/hooks/use-perfil";
import { limparTrilhaCache } from "@/hooks/use-trilha";
import { limparCursosCache } from "@/hooks/use-cursos";
import { adminEntry, moreNavItems } from "./nav-items";
import { usePerfil } from "@/hooks/use-perfil";

interface MaisMenuProps {
  onClose: () => void;
}

const DURACAO_MS = 200;

/**
 * Bandeja que sobe do rodapé no celular, com os itens que não cabem na
 * barra inferior fixa (Metas, Líderes) + Sair — só existe no mobile (quem
 * abre é o botão "..." do AppBottomNav, que já é `lg:hidden`). Portal em
 * document.body pelo mesmo motivo do LessonPopup: sem isso ficaria preso
 * dentro da barra inferior (sticky) em vez de cobrir a tela inteira.
 */
export function MaisMenu({ onClose }: MaisMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [visivel, setVisivel] = useState(false);
  const { perfil } = usePerfil();
  const itens = perfil?.role === "ADMIN" ? [...moreNavItems, adminEntry] : moreNavItems;

  useLayoutEffect(() => {
    const id = requestAnimationFrame(() => setVisivel(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const fechar = () => {
    setVisivel(false);
    window.setTimeout(onClose, DURACAO_MS);
  };

  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") fechar();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    // Mesmo cuidado do AccountPanel: sem limpar esses caches em memória, a
    // próxima conta logada nesse navegador veria por um instante o
    // perfil/trilha da conta anterior.
    limparPerfilCache();
    limparTrilhaCache();
    limparCursosCache();
    router.replace("/welcome");
  };

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 transition-opacity"
        style={{ transitionDuration: `${DURACAO_MS}ms`, opacity: visivel ? 1 : 0 }}
        onClick={fechar}
        role="presentation"
      />

      <div
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-[24px] border-t border-border bg-card p-5 shadow-xl transition-transform ease-out"
        style={{
          paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))",
          transitionDuration: `${DURACAO_MS}ms`,
          transform: visivel ? "translateY(0)" : "translateY(100%)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Mais opções"
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border" aria-hidden />

        <button
          type="button"
          onClick={fechar}
          aria-label="Fechar"
          className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-muted"
        >
          <X className="size-4.5" />
        </button>

        <div className="flex flex-col gap-1">
          {itens.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            const className = cn(
              "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-black uppercase tracking-[0.05em] transition-colors duration-150",
              active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/60"
            );
            const content = <><span className={cn("flex size-9 shrink-0 items-center justify-center rounded-[10px]", active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}><Icon className="size-5" /></span>{item.label}</>;
            if (item.external) return <a key={item.id} href={item.href} onClick={fechar} className={className}>{content}</a>;
            return (
              <Link
                key={item.id}
                href={item.href!}
                onClick={fechar}
                className={className}
              >
                {content}
              </Link>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 flex w-full items-center gap-3 border-t border-border px-3 pt-4 text-sm font-extrabold text-destructive"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-destructive/10">
            <LogOut className="size-5" />
          </span>
          Sair
        </button>
      </div>
    </>,
    document.body
  );
}
