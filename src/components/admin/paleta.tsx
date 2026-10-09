"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "radix-ui";
import { BookOpen, CornerDownLeft, Loader2, Search, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { pedir, query, useAtrasado, useDados } from "@/lib/admin/api";
import type { CursoDoAdmin, PaginaDePessoas } from "@/lib/admin/tipos";
import { SECOES } from "./secoes";
import { AvatarPequeno } from "./ui";

type Resultado = { chave: string; grupo: string; titulo: string; detalhe?: string; icone: React.ReactNode; ir: string };

/**
 * A busca rápida do administrativo (Ctrl+K): pessoas por nome, e-mail ou
 * código, cursos e as próprias telas. Setas escolhem, Enter abre.
 */
export function Paleta({ aberta, aoFechar, ehAdmin }: { aberta: boolean; aoFechar: () => void; ehAdmin: boolean }) {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [indice, setIndice] = useState(0);
  const busca = useAtrasado(texto.trim(), 200);
  const [pessoas, setPessoas] = useState<PaginaDePessoas["itens"]>([]);
  const [buscando, setBuscando] = useState(false);
  const { dados: cursos } = useDados<CursoDoAdmin[]>(aberta ? "/admin/conteudo/cursos" : null);
  const lista = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!aberta || !ehAdmin || busca.length < 2) return;
    let vivo = true;
    // O "buscando" liga dentro da promessa, e não aqui: o efeito só dispara a
    // busca, e o estado acompanha a resposta.
    Promise.resolve()
      .then(() => vivo && setBuscando(true))
      .then(() => pedir<PaginaDePessoas>(`/admin/pessoas${query({ busca, porPagina: 10 })}`))
      .then((r) => vivo && setPessoas(r.itens.slice(0, 6)))
      .catch(() => vivo && setPessoas([]))
      .finally(() => vivo && setBuscando(false));
    return () => {
      vivo = false;
    };
  }, [aberta, busca, ehAdmin]);

  const resultados = useMemo<Resultado[]>(() => {
    const t = texto.trim().toLowerCase();
    const telas = SECOES.filter((s) => (ehAdmin || !s.soAdmin) && (!t || s.rotulo.toLowerCase().includes(t))).map((s) => ({
      chave: s.href, grupo: "Telas", titulo: s.rotulo, icone: <s.Icone className="size-4" />, ir: s.href,
    }));
    const deCursos = (cursos ?? [])
      .filter((c) => !t || c.name.toLowerCase().includes(t) || c.slug.includes(t))
      .slice(0, 5)
      .map((c) => ({ chave: `curso-${c.id}`, grupo: "Cursos", titulo: c.name, detalhe: `${c.aulas} aulas`, icone: <BookOpen className="size-4" />, ir: `/admin/conteudo/${c.id}` }));
    const dePessoas = busca.length >= 2 && texto.trim().length >= 2
      ? pessoas.map((p) => ({
          chave: `pessoa-${p.id}`, grupo: "Pessoas", titulo: p.name, detalhe: `${p.email} · #${p.publicCode}`,
          icone: <AvatarPequeno id={p.avatarId} className="size-6 rounded-md text-[0.75rem]" />, ir: `/admin/pessoas/${p.id}`,
        }))
      : [];
    return [...dePessoas, ...deCursos, ...telas];
  }, [texto, busca, pessoas, cursos, ehAdmin]);

  const escolhido = Math.min(indice, Math.max(0, resultados.length - 1));

  const abrir = (r: Resultado) => {
    aoFechar();
    setTexto("");
    router.push(r.ir);
  };

  useEffect(() => {
    lista.current?.querySelector(`[data-indice="${escolhido}"]`)?.scrollIntoView({ block: "nearest" });
  }, [escolhido]);

  let grupoAnterior = "";

  return (
    <Dialog.Root open={aberta} onOpenChange={(v) => !v && aoFechar()}>
      <Dialog.Portal>
        <Dialog.Overlay className="zc-adm-veu fixed inset-0 z-50 bg-black/45" />
        <Dialog.Content
          className="zc-adm-entra fixed left-1/2 top-[12vh] z-50 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border bg-card shadow-2xl focus:outline-none"
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">Buscar no administrativo</Dialog.Title>
          <div className="flex items-center gap-2 border-b px-4">
            {buscando ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : <Search className="size-4 text-muted-foreground" />}
            <input
              autoFocus
              value={texto}
              onChange={(e) => {
                setTexto(e.target.value);
                setIndice(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setIndice((i) => Math.min(resultados.length - 1, i + 1));
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setIndice((i) => Math.max(0, i - 1));
                }
                if (e.key === "Enter" && resultados[escolhido]) abrir(resultados[escolhido]);
              }}
              placeholder={ehAdmin ? "Nome, e-mail, código, curso ou tela…" : "Curso ou tela…"}
              className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              aria-label="Buscar"
              role="combobox"
              aria-expanded
              aria-controls="paleta-resultados"
              aria-activedescendant={resultados[escolhido] ? `paleta-${escolhido}` : undefined}
            />
          </div>
          <ul ref={lista} id="paleta-resultados" role="listbox" className="max-h-[52vh] overflow-y-auto p-1.5">
            {resultados.length === 0 && (
              <li className="px-3 py-8 text-center text-sm text-muted-foreground">{buscando ? "Buscando…" : "Nada encontrado."}</li>
            )}
            {resultados.map((r, i) => {
              const titulo = r.grupo !== grupoAnterior ? r.grupo : null;
              grupoAnterior = r.grupo;
              return (
                <li key={r.chave} role="presentation">
                  {titulo && <p className="px-2.5 pb-1 pt-2 text-[0.68rem] font-black uppercase tracking-wider text-muted-foreground">{titulo}</p>}
                  <button
                    id={`paleta-${i}`}
                    data-indice={i}
                    role="option"
                    aria-selected={i === escolhido}
                    type="button"
                    onMouseMove={() => setIndice(i)}
                    onClick={() => abrir(r)}
                    className={cn("flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm", i === escolhido ? "bg-primary/10" : "hover:bg-muted")}
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center text-muted-foreground">{r.icone ?? <UserRound className="size-4" />}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold">{r.titulo}</span>
                      {r.detalhe && <span className="block truncate text-xs text-muted-foreground">{r.detalhe}</span>}
                    </span>
                    {i === escolhido && <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
