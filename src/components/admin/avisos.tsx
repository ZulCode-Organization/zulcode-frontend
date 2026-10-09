"use client";

import { useEffect, useSyncExternalStore } from "react";
import { CheckCircle2, CircleAlert, Undo2, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Os avisos do canto da tela, com "desfazer".
 *
 * O desfazer de uma exclusão funciona segurando o pedido: a tela some com o
 * item na hora, mas o pedido ao servidor só sai quando o aviso vence. Desfazer
 * antes disso é só não mandar. Assim o "desfazer" funciona para tudo, sem
 * lixeira no banco.
 */

type Aviso = { id: number; texto: string; tom: "ok" | "erro"; desfazer?: () => void; vence: number };

let avisos: Aviso[] = [];
const ouvintes = new Set<() => void>();
let proximo = 1;
const mudar = (novos: Aviso[]) => {
  avisos = novos;
  ouvintes.forEach((f) => f());
};

export function avisar(texto: string, opcoes: { tom?: "ok" | "erro"; desfazer?: () => void; duracao?: number } = {}) {
  const id = proximo++;
  const duracao = opcoes.duracao ?? (opcoes.desfazer ? 6000 : 3500);
  mudar([...avisos.slice(-3), { id, texto, tom: opcoes.tom ?? "ok", desfazer: opcoes.desfazer, vence: Date.now() + duracao }]);
  setTimeout(() => fechar(id), duracao);
  return id;
}

function fechar(id: number) {
  mudar(avisos.filter((a) => a.id !== id));
}

/**
 * Apaga com "desfazer": tira da tela já, manda o pedido só quando o aviso
 * vence. `restaurar` devolve o item à tela se a pessoa desfizer ou se o pedido
 * falhar.
 */
export function apagarComDesfazer({ texto, tirarDaTela, restaurar, executar }: {
  texto: string; tirarDaTela: () => void; restaurar: () => void; executar: () => Promise<unknown>;
}) {
  tirarDaTela();
  let desfeito = false;
  const duracao = 6000;
  avisar(texto, {
    duracao,
    desfazer: () => {
      desfeito = true;
      restaurar();
    },
  });
  setTimeout(() => {
    if (desfeito) return;
    executar().catch((e: unknown) => {
      restaurar();
      avisar(e instanceof Error ? e.message : "Não foi possível apagar.", { tom: "erro" });
    });
  }, duracao);
}

export function Avisos() {
  const lista = useSyncExternalStore(
    (f) => {
      ouvintes.add(f);
      return () => ouvintes.delete(f);
    },
    () => avisos,
    () => avisos,
  );

  // Sair da página com uma exclusão pendente a confirmaria sem a pessoa ver:
  // o navegador pergunta antes.
  useEffect(() => {
    const segurar = (e: BeforeUnloadEvent) => {
      if (avisos.some((a) => a.desfazer)) e.preventDefault();
    };
    window.addEventListener("beforeunload", segurar);
    return () => window.removeEventListener("beforeunload", segurar);
  }, []);

  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(92vw,380px)] flex-col gap-2">
      {lista.map((a) => (
        <div
          key={a.id}
          className={cn(
            "zc-adm-aviso pointer-events-auto flex items-center gap-2.5 rounded-xl border bg-card px-3.5 py-3 text-sm font-bold shadow-xl",
            a.tom === "erro" && "border-rose-500/40",
          )}
        >
          {a.tom === "erro" ? <CircleAlert className="size-4 shrink-0 text-rose-500" /> : <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />}
          <span className="min-w-0 flex-1">{a.texto}</span>
          {a.desfazer && (
            <button
              type="button"
              onClick={() => {
                a.desfazer?.();
                fechar(a.id);
              }}
              className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-black text-primary hover:bg-primary/10"
            >
              <Undo2 className="size-3.5" /> Desfazer
            </button>
          )}
          <button type="button" aria-label="Fechar aviso" onClick={() => fechar(a.id)} className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground">
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
