"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

/** A paleta de comandos.
 *
 *  Neste layout ela é o menu do programa: não há lateral nem barra de menus, e
 *  tudo o que o playground faz passa por aqui. Por isso cada comando carrega
 *  palavras-chave — quem procura "tema" e quem procura "cor" têm de achar a
 *  mesma coisa — e o atalho aparece do lado, para a próxima vez não precisar
 *  da paleta. */

export type Comando = {
  id: string;
  titulo: string;
  secao: string;
  /** Sinônimos para a busca encontrar. Não aparecem na tela. */
  busca?: string;
  atalho?: string;
  Icone?: React.ComponentType<{ className?: string }>;
  detalhe?: string;
  executar: () => void;
};

/** Sem acento e em minúscula: quem digita "arquivo novo" e quem digita
 *  "Arquivo Nôvo" procuram a mesma coisa. */
function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function PaletaComandos({
  comandos, aoFechar,
}: {
  comandos: Comando[];
  aoFechar: () => void;
}) {
  const [busca, setBusca] = useState("");
  const [indice, setIndice] = useState(0);
  const lista = useRef<HTMLDivElement | null>(null);

  const filtrados = useMemo(() => {
    const termo = normalizar(busca.trim());
    if (!termo) return comandos;
    // Palavras de uma letra saem fora: a busca é por trecho, então o "o" de
    // "renomear o projeto" casaria dentro de "renomear" e faria qualquer
    // comando passar no teste.
    const palavras = termo.split(/\s+/).filter((palavra) => palavra.length > 1);
    if (!palavras.length) return comandos;
    return comandos.filter((comando) => {
      const alvo = normalizar(`${comando.titulo} ${comando.secao} ${comando.busca ?? ""}`);
      return palavras.every((palavra) => alvo.includes(palavra));
    });
  }, [busca, comandos]);

  const escolhido = filtrados[Math.min(indice, filtrados.length - 1)];

  // Onde cada seção começa, calculado junto da lista. Um contador mutável
  // durante a renderização daria o mesmo resultado na primeira passada e
  // resultados diferentes nas seguintes.
  const comCabecalho = useMemo(
    () => filtrados.map((comando, posicao) => ({
      comando,
      abreSecao: posicao === 0 || filtrados[posicao - 1].secao !== comando.secao,
    })),
    [filtrados],
  );

  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") return aoFechar();
      if (evento.key === "ArrowDown" || evento.key === "ArrowUp") {
        evento.preventDefault();
        setIndice((atual) => {
          const total = filtrados.length;
          if (!total) return 0;
          const passo = evento.key === "ArrowDown" ? 1 : -1;
          return (Math.min(atual, total - 1) + passo + total) % total;
        });
      }
      if (evento.key === "Enter" && escolhido) {
        evento.preventDefault();
        aoFechar();
        escolhido.executar();
      }
    };
    document.addEventListener("keydown", aoTeclar, true);
    return () => document.removeEventListener("keydown", aoTeclar, true);
  }, [aoFechar, escolhido, filtrados.length]);

  // Mantém o item escolhido visível ao navegar com as setas.
  useEffect(() => {
    lista.current?.querySelector<HTMLElement>('[data-escolhido="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [indice, busca]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-hidden bg-black/45 p-4 pt-[10vh]"
      onPointerDown={(evento) => {
        if (evento.target === evento.currentTarget) aoFechar();
      }}
    >
      <div
        role="dialog"
        aria-modal
        aria-label="Comandos"
        className="zc-pg zc-pg-barra zc-pg-borda flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-md border"
      >
        <div className="zc-pg-borda flex shrink-0 items-center gap-2 border-b px-3">
          <Search className="zc-pg-apagado size-3.5 shrink-0" />
          <input
            autoFocus
            value={busca}
            onChange={(evento) => { setBusca(evento.target.value); setIndice(0); }}
            placeholder="Procure um comando…"
            aria-label="Procure um comando"
            spellCheck={false}
            className="zc-pg-texto h-10 min-w-0 flex-1 bg-transparent text-[0.85rem] outline-none placeholder:[color:var(--pg-apagado)]"
          />
          <kbd className="zc-pg-apagado zc-pg-mono hidden text-[0.65rem] sm:block">esc</kbd>
        </div>

        <div ref={lista} className="min-h-0 flex-1 overflow-y-auto py-1">
          {filtrados.length === 0 && (
            <p className="zc-pg-apagado px-3 py-6 text-center text-[0.78rem]">
              Nenhum comando com esse nome.
            </p>
          )}
          {comCabecalho.map(({ comando, abreSecao }, posicao) => {
            const ativo = comando === escolhido;
            return (
              <div key={comando.id}>
                {abreSecao && <p className="zc-pg-rotulo px-3 pt-2 pb-1">{comando.secao}</p>}
                <button
                  type="button"
                  data-escolhido={ativo}
                  onPointerEnter={() => setIndice(posicao)}
                  onClick={() => { aoFechar(); comando.executar(); }}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[0.8rem]",
                    ativo && "[background:var(--pg-ativo)]",
                  )}
                >
                  {comando.Icone && (
                    <comando.Icone className={cn("size-3.5 shrink-0", ativo ? "zc-pg-acento" : "zc-pg-apagado")} />
                  )}
                  <span className="min-w-0 flex-1 truncate">
                    {comando.titulo}
                    {comando.detalhe && (
                      <span className="zc-pg-apagado ml-2 text-[0.7rem]">{comando.detalhe}</span>
                    )}
                  </span>
                  {comando.atalho && (
                    <kbd className="zc-pg-apagado zc-pg-mono shrink-0 text-[0.65rem]">{comando.atalho}</kbd>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
