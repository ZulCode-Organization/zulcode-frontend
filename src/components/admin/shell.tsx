"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { ArrowLeft, ChevronsLeft, ChevronsRight, Keyboard, Search } from "lucide-react";
import { PerfilProvider, usePerfil } from "@/hooks/use-perfil";
import { cn } from "@/lib/utils";
import { Avisos } from "./avisos";
import { Paleta } from "./paleta";
import { Dialogo, Perguntas } from "./dialogo";
import { Atalho } from "./ui";
import { SECOES } from "./secoes";



const CHAVE_RECOLHIDO = "zulcode:admin:menu-recolhido";

/**
 * A casca do administrativo: menu lateral fixo, a busca rápida (Ctrl+K) e os
 * atalhos de teclado. Fica fora da casca do app de propósito — aqui a tela é
 * de trabalho, e o espaço que a barra de cima e o painel direito do app
 * ocupariam vira espaço para tabelas e para o editor.
 */
export function CascaDoAdmin({ children }: { children: ReactNode }) {
  return (
    <PerfilProvider>
      <Casca>{children}</Casca>
    </PerfilProvider>
  );
}

function Casca({ children }: { children: ReactNode }) {
  const router = useRouter();
  const caminho = usePathname();
  const { perfil, loading } = usePerfil();
  const papel = perfil?.role;
  const podeEntrar = papel === "ADMIN" || papel === "PROFESSOR";
  const ehAdmin = papel === "ADMIN";

  const recolhido = useMenuRecolhido();
  const [paleta, setPaleta] = useState(false);
  const [ajuda, setAjuda] = useState(false);

  useEffect(() => {
    if (!loading && !podeEntrar) router.replace("/home");
  }, [loading, podeEntrar, router]);

  // Professor só tem a área de conteúdo: qualquer outra rota leva para lá.
  useEffect(() => {
    if (papel === "PROFESSOR" && !caminho.startsWith("/admin/conteudo")) router.replace("/admin/conteudo");
  }, [papel, caminho, router]);

  // Atalhos: Ctrl/⌘+K abre a busca; "g" e uma letra vai para uma seção; "?" mostra a lista.
  const esperandoG = useRef(0);
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null;
      const digitando = alvo?.closest("input, textarea, select, [contenteditable=true], .cm-editor");
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaleta(true);
        return;
      }
      if (digitando || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "?") {
        setAjuda(true);
        return;
      }
      if (e.key === "/") {
        const busca = document.querySelector<HTMLInputElement>("[data-busca-da-pagina]");
        if (busca) {
          e.preventDefault();
          busca.focus();
        }
        return;
      }
      if (e.key === "g") {
        esperandoG.current = Date.now();
        return;
      }
      if (Date.now() - esperandoG.current < 900) {
        const secao = SECOES.find((s) => s.atalho === e.key && (ehAdmin || !s.soAdmin));
        if (secao) router.push(secao.href);
        esperandoG.current = 0;
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [ehAdmin, router]);

  const alternarMenu = () => gravarMenuRecolhido(!recolhido);

  if (loading || !podeEntrar) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <div className="h-1 w-40 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
        </div>
      </div>
    );
  }

  const secoes = SECOES.filter((s) => ehAdmin || !s.soAdmin);

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      {/* ── Menu lateral ── */}
      <aside className={cn("hidden shrink-0 flex-col border-r bg-card transition-[width] duration-200 lg:flex", recolhido ? "w-[60px]" : "w-[232px]")}>
        <div className={cn("flex h-14 items-center gap-2 border-b", recolhido ? "justify-center px-2" : "px-4")}>
          {/* eslint-disable-next-line @next/next/no-img-element -- logo pequena e local, sem ganho com o Image. */}
          <img src="/icon-only.svg" alt="" className="size-7 dark:hidden" />
          {/* eslint-disable-next-line @next/next/no-img-element -- idem. */}
          <img src="/icon-only-dark.svg" alt="" className="hidden size-7 dark:block" />
          {!recolhido && (
            <div className="min-w-0 leading-tight">
              <p className="text-sm font-black">ZulCode</p>
              <p className="text-[0.68rem] font-bold text-muted-foreground">Administrativo</p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setPaleta(true)}
          className={cn(
            "mx-2 mt-3 flex h-9 items-center gap-2 rounded-lg border bg-background text-sm text-muted-foreground hover:text-foreground",
            recolhido ? "justify-center" : "px-2.5",
          )}
          title="Buscar (Ctrl+K)"
        >
          <Search className="size-4 shrink-0" />
          {!recolhido && (
            <>
              <span className="flex-1 text-left">Buscar…</span>
              <Atalho>Ctrl K</Atalho>
            </>
          )}
        </button>

        <nav aria-label="Seções do administrativo" className="mt-3 flex-1 space-y-0.5 overflow-y-auto px-2">
          {secoes.map(({ href, rotulo, Icone }) => {
            const ativa = caminho === href || caminho.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                title={recolhido ? rotulo : undefined}
                aria-current={ativa ? "page" : undefined}
                className={cn(
                  "flex h-9 items-center gap-2.5 rounded-lg text-sm font-bold transition-colors",
                  recolhido ? "justify-center" : "px-2.5",
                  ativa ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icone className="size-[18px] shrink-0" />
                {!recolhido && <span className="truncate">{rotulo}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-0.5 border-t p-2">
          <button
            type="button"
            onClick={() => setAjuda(true)}
            className={cn("flex h-9 w-full items-center gap-2.5 rounded-lg text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground", recolhido ? "justify-center" : "px-2.5")}
            title="Atalhos de teclado (?)"
          >
            <Keyboard className="size-[18px] shrink-0" />
            {!recolhido && "Atalhos"}
          </button>
          <Link
            href="/home"
            className={cn("flex h-9 items-center gap-2.5 rounded-lg text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground", recolhido ? "justify-center" : "px-2.5")}
            title="Voltar ao ZulCode"
          >
            <ArrowLeft className="size-[18px] shrink-0" />
            {!recolhido && "Voltar ao ZulCode"}
          </Link>
          <button
            type="button"
            onClick={alternarMenu}
            className={cn("flex h-9 w-full items-center gap-2.5 rounded-lg text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground", recolhido ? "justify-center" : "px-2.5")}
            aria-label={recolhido ? "Abrir o menu" : "Recolher o menu"}
          >
            {recolhido ? <ChevronsRight className="size-[18px]" /> : <ChevronsLeft className="size-[18px]" />}
            {!recolhido && "Recolher"}
          </button>
        </div>
      </aside>

      {/* ── Conteúdo ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* No celular e no tablet o menu vira uma faixa no topo, rolando de lado. */}
        <div className="flex h-12 shrink-0 items-center gap-1 overflow-x-auto border-b bg-card px-2 lg:hidden">
          <Link href="/home" aria-label="Voltar ao ZulCode" className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground"><ArrowLeft className="size-4" /></Link>
          <button type="button" onClick={() => setPaleta(true)} aria-label="Buscar" className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground"><Search className="size-4" /></button>
          {secoes.map(({ href, rotulo, Icone }) => {
            const ativa = caminho === href || caminho.startsWith(`${href}/`);
            return (
              <Link key={href} href={href} className={cn("flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold", ativa ? "bg-primary/10 text-primary" : "text-muted-foreground")}>
                <Icone className="size-4" /> {rotulo}
              </Link>
            );
          })}
        </div>
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>

      <Paleta aberta={paleta} aoFechar={() => setPaleta(false)} ehAdmin={ehAdmin} />
      <Dialogo aberto={ajuda} aoFechar={() => setAjuda(false)} titulo="Atalhos de teclado">
        <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2.5 text-sm">
          <dt><Atalho>Ctrl</Atalho> <Atalho>K</Atalho></dt><dd>Buscar pessoas, cursos e telas</dd>
          <dt><Atalho>/</Atalho></dt><dd>Ir para a busca da página</dd>
          {secoes.map((s) => (
            <div key={s.href} className="contents">
              <dt><Atalho>g</Atalho> <Atalho>{s.atalho}</Atalho></dt><dd>Ir para {s.rotulo}</dd>
            </div>
          ))}
          <dt><Atalho>?</Atalho></dt><dd>Mostrar esta lista</dd>
        </dl>
        <p className="mt-4 text-xs text-muted-foreground">O editor de aula tem atalhos próprios, mostrados dentro dele.</p>
      </Dialogo>
      <Avisos />
      <Perguntas />
    </div>
  );
}

// O menu recolhido é preferência deste navegador. Lido por um store, e não por
// um efeito: assim o primeiro desenho no servidor e o do navegador concordam, e
// a troca não dispara um segundo render pela casca inteira.
const ouvintesDoMenu = new Set<() => void>();
function lerMenuRecolhido() {
  try {
    return localStorage.getItem(CHAVE_RECOLHIDO) === "1";
  } catch {
    return false;
  }
}
function gravarMenuRecolhido(valor: boolean) {
  try {
    localStorage.setItem(CHAVE_RECOLHIDO, valor ? "1" : "0");
  } catch {}
  ouvintesDoMenu.forEach((f) => f());
}
function useMenuRecolhido() {
  return useSyncExternalStore(
    (f) => {
      ouvintesDoMenu.add(f);
      return () => ouvintesDoMenu.delete(f);
    },
    lerMenuRecolhido,
    () => false,
  );
}

/** A área de uma página comum: largura de leitura e respiro. O editor não usa. */
export function Pagina({ children, larga = false }: { children: ReactNode; larga?: boolean }) {
  return <div className={cn("mx-auto w-full px-4 py-6 sm:px-6", larga ? "max-w-[1400px]" : "max-w-[1180px]")}>{children}</div>;
}
