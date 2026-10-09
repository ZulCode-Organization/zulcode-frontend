"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Botao, Entrada } from "./ui";

/**
 * O diálogo do administrativo. Radix por baixo: foco preso dentro, Esc fecha,
 * leitor de tela anuncia o título — o que um modal feito à mão quase sempre
 * esquece.
 */
export function Dialogo({
  aberto, aoFechar, titulo, descricao, children, rodape, largura = "max-w-lg",
}: {
  aberto: boolean; aoFechar: () => void; titulo: ReactNode; descricao?: ReactNode; children?: ReactNode; rodape?: ReactNode; largura?: string;
}) {
  return (
    <Dialog.Root open={aberto} onOpenChange={(v) => !v && aoFechar()}>
      <Dialog.Portal>
        <Dialog.Overlay className="zc-adm-veu fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px]" />
        <Dialog.Content
          className={cn(
            "zc-adm-janela fixed left-1/2 top-1/2 z-50 flex max-h-[88dvh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border bg-card shadow-2xl focus:outline-none",
            largura,
          )}
        >
          <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
            <div className="min-w-0">
              <Dialog.Title className="text-base font-black">{titulo}</Dialog.Title>
              {descricao ? (
                <Dialog.Description className="mt-1 text-sm text-muted-foreground">{descricao}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{typeof titulo === "string" ? titulo : "Diálogo"}</Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <button type="button" aria-label="Fechar" className="-mr-1.5 flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>
          {children && <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>}
          {rodape && <div className="flex flex-wrap items-center justify-end gap-2 border-t px-5 py-3">{rodape}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/**
 * Confirmação para ações grandes: a pessoa digita uma palavra (o e-mail da
 * conta, o nome do curso, "CONFIRMAR") antes de o botão destravar. Um clique
 * por engano não consegue tirar mil rupees nem apagar um curso.
 */
export function ConfirmarDigitando({
  aberto, aoFechar, titulo, children, palavra, rotuloDoBotao, aoConfirmar, perigoso = true,
}: {
  aberto: boolean; aoFechar: () => void; titulo: string; children: ReactNode; palavra: string; rotuloDoBotao: string;
  aoConfirmar: () => Promise<void> | void; perigoso?: boolean;
}) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const confere = texto.trim().toLowerCase() === palavra.trim().toLowerCase();

  const fechar = () => {
    setTexto("");
    setErro("");
    aoFechar();
  };

  return (
    <Dialogo
      aberto={aberto}
      aoFechar={fechar}
      titulo={titulo}
      rodape={
        <>
          <Botao variante="fantasma" onClick={fechar}>Cancelar</Botao>
          <Botao
            variante={perigoso ? "perigo" : "primario"}
            disabled={!confere}
            carregando={enviando}
            onClick={async () => {
              setEnviando(true);
              setErro("");
              try {
                await aoConfirmar();
                fechar();
              } catch (e) {
                setErro(e instanceof Error ? e.message : "Não foi possível concluir.");
              } finally {
                setEnviando(false);
              }
            }}
          >
            {rotuloDoBotao}
          </Botao>
        </>
      }
    >
      <div className="space-y-3 text-sm">
        <div className="text-muted-foreground">{children}</div>
        <label className="block">
          <span className="mb-1 block text-xs font-bold text-muted-foreground">
            Para confirmar, digite <b className="select-all font-mono text-foreground">{palavra}</b>
          </span>
          <Entrada value={texto} onChange={(e) => setTexto(e.target.value)} autoFocus autoComplete="off" spellCheck={false} />
        </label>
        {erro && <p role="alert" className="font-bold text-rose-600 dark:text-rose-400">{erro}</p>}
      </div>
    </Dialogo>
  );
}

// ── Pergunta de sim ou não ───────────────────────────────────────────────

type Pergunta = { titulo: string; texto?: ReactNode; sim: string; perigoso: boolean; responder: (sim: boolean) => void };

let pergunta: Pergunta | null = null;
const ouvintes = new Set<() => void>();
const trocar = (nova: Pergunta | null) => {
  pergunta = nova;
  ouvintes.forEach((f) => f());
};

/**
 * O `window.confirm` do administrativo: abre o diálogo da casa e devolve a
 * resposta. Uso: `if (!(await perguntar({ titulo: "Apagar?" }))) return;`.
 * Fechar com Esc ou clicar fora conta como "não".
 */
export function perguntar({ titulo, texto, sim = "Confirmar", perigoso = false }: { titulo: string; texto?: ReactNode; sim?: string; perigoso?: boolean }) {
  pergunta?.responder(false);
  return new Promise<boolean>((resolver) => {
    trocar({
      titulo, texto, sim, perigoso,
      responder: (r) => {
        trocar(null);
        resolver(r);
      },
    });
  });
}

export function Perguntas() {
  const p = useSyncExternalStore(
    (f) => {
      ouvintes.add(f);
      return () => ouvintes.delete(f);
    },
    () => pergunta,
    () => null,
  );
  return (
    <Dialogo
      aberto={Boolean(p)}
      aoFechar={() => p?.responder(false)}
      titulo={p?.titulo ?? ""}
      descricao={p?.texto}
      largura="max-w-md"
      rodape={
        <>
          <Botao variante="fantasma" onClick={() => p?.responder(false)}>Cancelar</Botao>
          <Botao variante={p?.perigoso ? "perigo" : "primario"} onClick={() => p?.responder(true)} autoFocus>{p?.sim}</Botao>
        </>
      }
    />
  );
}
