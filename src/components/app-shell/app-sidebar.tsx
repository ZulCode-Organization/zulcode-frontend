"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "next-themes";
import { ChevronDown, FolderPlus, LogOut, MoreHorizontal } from "lucide-react";
import { usePerfil } from "@/hooks/use-perfil";
import { cn } from "@/lib/utils";
import { adminEntry, adminNavItems, sidebarMoreItems, sidebarNavItems } from "./nav-items";

/**
 * Botão "Mais…" e o menu que ele abre ao lado.
 *
 * O menu vai num portal com posição fixa, medida a partir do botão, e não
 * dentro da barra: a barra é `overflow-y-auto`, e qualquer coisa posicionada
 * aqui dentro seria cortada ao passar da largura dela.
 */
function MenuMais() {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);
  const [caixa, setCaixa] = useState<{ left: number; top: number } | null>(null);
  const botaoRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const ativo = sidebarMoreItems.some((item) => item.href === pathname);

  useLayoutEffect(() => {
    if (!aberto) return;
    const medir = () => {
      const alvo = botaoRef.current;
      if (!alvo) return;
      const retangulo = alvo.getBoundingClientRect();
      // Ancora no topo do botão e encosta na direita dele; se não couber até o
      // pé da janela, sobe o suficiente pra caber.
      const altura = sidebarMoreItems.length * 52 + 24;
      setCaixa({
        left: retangulo.right + 10,
        top: Math.min(retangulo.top, Math.max(12, window.innerHeight - altura - 12)),
      });
    };
    medir();
    window.addEventListener("resize", medir);
    document.addEventListener("scroll", medir, true);
    return () => {
      window.removeEventListener("resize", medir);
      document.removeEventListener("scroll", medir, true);
    };
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    const fecharFora = (evento: MouseEvent) => {
      const alvo = evento.target as Node;
      if (menuRef.current?.contains(alvo) || botaoRef.current?.contains(alvo)) return;
      setAberto(false);
    };
    const aoTeclar = (evento: KeyboardEvent) => { if (evento.key === "Escape") setAberto(false); };
    document.addEventListener("mousedown", fecharFora);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", fecharFora);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  const fechar = () => setAberto(false);

  return (
    <>
      <button
        ref={botaoRef}
        type="button"
        onClick={() => setAberto((v) => !v)}
        title="Mais"
        aria-haspopup="menu"
        aria-expanded={aberto}
        className={cn(
          "group flex items-center justify-center rounded-2xl border py-2 text-sm font-black uppercase tracking-[0.05em] transition-colors duration-150",
          "xl:justify-start xl:gap-3 xl:px-4 xl:py-3",
          ativo || aberto
            ? "border-primary/30 bg-primary/10 text-primary"
            : "border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        )}
      >
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-[10px] transition-colors duration-150",
            ativo ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-foreground"
          )}
        >
          <MoreHorizontal className="size-5" />
        </span>
        <span className="hidden xl:inline">Mais…</span>
      </button>

      {aberto && caixa && createPortal(
        <div
          ref={menuRef}
          role="menu"
          aria-label="Mais opções"
          className="animate-pop-in fixed z-[60] w-[248px] origin-left rounded-[18px] border border-border bg-popover p-2 shadow-2xl"
          style={{ left: caixa.left, top: caixa.top }}
        >
          {sidebarMoreItems.map((item) => {
            const Icon = item.icon;
            const selecionado = item.href === pathname;
            const classe = cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-black uppercase tracking-[0.05em] transition-colors duration-150",
              selecionado ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            );
            const conteudo = (
              <>
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg",
                    selecionado ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="size-4.5" />
                </span>
                {item.label}
              </>
            );

            if (item.external) {
              return (
                <a key={item.id} href={item.href} target="_blank" rel="noreferrer" role="menuitem" onClick={fechar} className={classe}>
                  {conteudo}
                </a>
              );
            }
            return (
              <Link key={item.id} href={item.href!} role="menuitem" onClick={fechar} className={classe}>
                {conteudo}
              </Link>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const { perfil } = usePerfil();
  const [mounted, setMounted] = useState(false);
  const [cadastrosAberto, setCadastrosAberto] = useState(true);

  useEffect(() => setMounted(true), []);

  const logo = resolvedTheme !== "dark" ? "/icon-only.svg" : "/icon-only-dark.svg";
  const isAdminArea = pathname.startsWith("/admin");
  const navItems = perfil?.role === "ADMIN" ? [...sidebarNavItems, adminEntry] : sidebarNavItems;

  /**
   * Abaixo de xl a barra vira um trilho só de ícones: o rótulo some, o item
   * centraliza e o realce do item ativo fica em volta do próprio ícone. É o
   * que mantém a navegação inteira acessível quando a janela encolhe, em vez
   * de espremer 288px de barra contra o conteúdo.
   */
  const renderNavLink = (item: (typeof sidebarNavItems)[number], nested = false) => {
    const Icon = item.icon;
    const active = pathname === item.href;
    const className = cn(
      "group flex items-center justify-center rounded-2xl border py-2 text-sm font-black uppercase tracking-[0.05em] transition-colors duration-150",
      "xl:justify-start xl:gap-3 xl:px-4 xl:py-3",
      nested && "rounded-xl text-[0.78rem] xl:ml-5 xl:py-2.5",
      active
        ? "border-primary/30 bg-primary/10 text-primary"
        : "border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"
    );
    const rotulo = <span className="hidden xl:inline">{item.label}</span>;
    const badge = (
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-[10px] transition-colors duration-150",
          nested && "size-8 rounded-lg",
          item.external || !active
            ? "bg-muted text-muted-foreground group-hover:text-foreground"
            : "bg-primary text-primary-foreground"
        )}
      >
        <Icon className={nested ? "size-4" : "size-5"} />
      </span>
    );

    if (item.external) return (
      <a key={item.id} href={item.href} title={item.label} className={className}>
        {badge}
        {rotulo}
      </a>
    );
    return (
      <Link
        key={item.id}
        href={item.href!}
        title={item.label}
        aria-current={active ? "page" : undefined}
        className={className}
      >
        {badge}
        {rotulo}
      </Link>
    );
  };

  return (
    <aside className="zc-scroll-hidden hidden h-dvh w-[92px] shrink-0 flex-col overflow-y-auto border-r border-border bg-card px-3 py-7 lg:flex xl:w-[288px] xl:px-5">
      {/* No trilho o logo e a saída do administrativo empilham; da barra
          inteira pra cima voltam lado a lado. A saída não pode sumir: dentro
          do /admin ela é o único caminho de volta pra Jornada. */}
      <div className="sticky top-0 z-10 -mx-3 flex flex-col items-center gap-2 bg-card px-3 pb-2 pt-1 xl:-mx-5 xl:flex-row xl:justify-between xl:gap-0 xl:px-6">
        <Link href="/home" title="ZulCode" className="flex items-center gap-2.5">
          {mounted ? <Image src={logo} alt="" width={40} height={40} className="rounded-xl" /> : <div style={{ width: 40, height: 40 }} />}
          <span className="hidden text-xl font-black tracking-tight text-foreground xl:inline">ZulCode</span>
        </Link>
        {isAdminArea && <Link href="/home" title="Sair do administrativo" aria-label="Sair do administrativo" className="flex size-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><LogOut className="size-5" /></Link>}
      </div>

      <nav className="mt-6 flex flex-col gap-1">
        {isAdminArea ? <>
          {renderNavLink(adminNavItems[0])}
          <button
            type="button"
            onClick={() => setCadastrosAberto((aberto) => !aberto)}
            title="Cadastros"
            className="group mt-1 flex w-full items-center justify-center rounded-2xl border border-transparent py-2 text-left text-sm font-black uppercase tracking-[0.05em] text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground xl:justify-start xl:gap-3 xl:px-4 xl:py-3"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-muted text-muted-foreground group-hover:text-foreground"><FolderPlus className="size-5" /></span>
            <span className="hidden flex-1 xl:inline">Cadastros</span>
            <ChevronDown className={cn("hidden size-4 transition-transform xl:block", cadastrosAberto && "rotate-180")} />
          </button>
          {cadastrosAberto && adminNavItems.slice(1, 3).map((item) => renderNavLink(item, true))}
          {adminNavItems.slice(3).map((item) => renderNavLink(item))}
        </> : <>
          {navItems.map((item) => renderNavLink(item))}
          <MenuMais />
        </>}
      </nav>

    </aside>
  );
}
