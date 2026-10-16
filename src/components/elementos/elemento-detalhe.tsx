"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Check, Lock, X } from "lucide-react";
import { IconeSolar } from "@/components/shared/icone-duo";
import { DOMINIO_CHEIO, pareceCodigo, perguntasDe, realcar, registrarResposta, type Pedaco, type Pergunta } from "@/lib/elementos";
import { reagir } from "@/lib/reacoes";
import { ElementoGlossario } from "@/lib/types/elemento";
import { cn } from "@/lib/utils";
import { BarraDeDominio, SimboloDoElemento } from "./elemento-tile";

const COR_DO_PEDACO: Record<Pedaco["tipo"], string> = {
  palavra: "text-violet-400",
  texto: "text-green-400",
  numero: "text-amber-400",
  comentario: "text-muted-foreground",
  simbolo: "text-sky-300",
  comum: "text-foreground",
};

/** O exemplo: em bloco de código com cores quando é código, entre aspas quando é uma frase. */
export function Exemplo({ texto, rotulo = "Exemplo" }: { texto: string; rotulo?: string }) {
  if (!pareceCodigo(texto)) {
    return (
      <div className="rounded-2xl border border-border bg-background/60 px-3.5 py-3">
        <span className="text-[0.66rem] font-black uppercase tracking-[0.1em] text-muted-foreground">{rotulo}</span>
        <p className="mt-1 text-[0.92rem] font-bold italic text-foreground">“{texto}”</p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-border bg-background/60 px-3.5 py-3">
      <span className="text-[0.66rem] font-black uppercase tracking-[0.1em] text-muted-foreground">{rotulo}</span>
      <pre className="mt-1.5 overflow-x-auto whitespace-pre-wrap font-mono text-[0.85rem] leading-relaxed">
        {realcar(texto).map((pedaco, i) => (
          <span key={i} className={COR_DO_PEDACO[pedaco.tipo]}>{pedaco.texto}</span>
        ))}
      </pre>
    </div>
  );
}

// ---------------------------------------------------------------------------
// A prática rápida
// ---------------------------------------------------------------------------

function PraticaRapida({
  elemento, perguntas, curso, aoTerminar, aoResponder,
}: {
  elemento: ElementoGlossario;
  perguntas: Pergunta[];
  curso: string;
  aoTerminar: () => void;
  aoResponder: (dominio: number, errosRecentes: number) => void;
}) {
  const [indice, setIndice] = useState(0);
  const [escolha, setEscolha] = useState<number | null>(null);
  const [acertos, setAcertos] = useState(0);
  const pergunta = perguntas[indice];
  const acabou = indice >= perguntas.length;
  const respondida = escolha !== null;
  const certa = respondida && escolha === pergunta?.certa;

  const responder = (opcao: number) => {
    if (respondida || !pergunta) return;
    setEscolha(opcao);
    const acertou = opcao === pergunta.certa;
    if (acertou) setAcertos((n) => n + 1);
    reagir(acertou ? "acerto" : "erro");
    void registrarResposta(curso, elemento.id, acertou).then((r) => r && aoResponder(r.dominio, r.errosRecentes));
  };

  const seguir = () => {
    setEscolha(null);
    setIndice((i) => i + 1);
  };

  if (acabou) {
    return (
      <div className="flex flex-col items-center py-4 text-center">
        <SimboloDoElemento elemento={elemento} grande />
        <p className="mt-4 text-[1.3rem] font-black">{acertos === perguntas.length ? "Mandou bem!" : "Prática feita"}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {acertos} de {perguntas.length} certas em <span className="font-mono font-black text-foreground">{elemento.term}</span>.
        </p>
        <BarraDeDominio elemento={elemento} className="mt-4 h-2 w-48" />
        <p className="mt-1.5 text-xs text-muted-foreground">Domínio: {elemento.dominio} de {DOMINIO_CHEIO} acertos seguidos</p>
        <button type="button" onClick={aoTerminar} className="zc-press mt-6 h-12 w-full rounded-2xl bg-primary text-[0.85rem] font-black uppercase tracking-[0.05em] text-primary-foreground shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)]">
          Voltar ao elemento
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={aoTerminar} aria-label="Sair da prática" className="text-muted-foreground hover:text-foreground">
          <X className="size-5" />
        </button>
        <span className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
          <span className="block h-full rounded-full bg-emerald-500 transition-[width] duration-300" style={{ width: `${((indice + (respondida ? 1 : 0)) / perguntas.length) * 100}%` }} />
        </span>
        <span className="text-xs font-black text-muted-foreground">{indice + 1}/{perguntas.length}</span>
      </div>

      <p className="mt-5 text-[1.15rem] font-black leading-snug">{pergunta.enunciado}</p>
      {pergunta.destaque && (
        <p className="mt-3 rounded-2xl border border-border bg-background/60 px-3.5 py-3 text-[0.92rem] leading-relaxed text-foreground">{pergunta.destaque.texto}</p>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {pergunta.opcoes.map((opcao, i) => {
          const eACerta = respondida && i === pergunta.certa;
          const eAErrada = respondida && i === escolha && !certa;
          return (
            <button
              key={i}
              type="button"
              disabled={respondida}
              onClick={() => responder(i)}
              className={cn(
                "zc-press flex items-center justify-between gap-3 rounded-2xl border-2 px-3.5 py-3 text-left text-[0.88rem] font-bold shadow-[inset_0_-3px_0_rgba(0,0,0,0.15)] transition-colors duration-150",
                eACerta ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                  : eAErrada ? "border-rose-500 bg-rose-500/10 text-rose-500"
                    : "border-border bg-card text-foreground hover:border-primary/40 disabled:opacity-60",
                pareceCodigo(opcao) && opcao.length < 60 && "font-mono",
              )}
            >
              <span>{opcao}</span>
              {eACerta && <Check className="size-4 shrink-0" strokeWidth={3} />}
              {eAErrada && <X className="size-4 shrink-0" strokeWidth={3} />}
            </button>
          );
        })}
      </div>

      {respondida && (
        <button type="button" onClick={seguir} className={cn("zc-press mt-5 h-12 w-full rounded-2xl text-[0.85rem] font-black uppercase tracking-[0.05em] text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)]", certa ? "bg-emerald-500" : "bg-rose-500")}>
          {indice + 1 < perguntas.length ? "Continuar" : "Ver resultado"}
        </button>
      )}
      <p className="mt-3 text-center text-[0.72rem] text-muted-foreground">Prática rápida: não gasta pena e não mexe no XP.</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// O detalhe
// ---------------------------------------------------------------------------

/**
 * O detalhe de um elemento: no celular sobe de baixo como uma folha; no
 * computador abre no meio da tela. Tem o significado, o exemplo com cores, a
 * aula onde se aprende e o domínio; dos aprendidos dá para praticar ali mesmo.
 *
 * Vai por portal para o body: os ladrilhos animam com transform ao entrar, o
 * que viraria referência para o position:fixed.
 */
export function ElementoDetalhe({
  elemento, todos, curso, aoFechar, aoAtualizar,
}: {
  elemento: ElementoGlossario;
  todos: ElementoGlossario[];
  curso: string;
  aoFechar: () => void;
  aoAtualizar: (id: string, dominio: number, errosRecentes: number) => void;
}) {
  const router = useRouter();
  const [perguntas, setPerguntas] = useState<Pergunta[] | null>(null);

  useEffect(() => {
    const tecla = (evento: KeyboardEvent) => evento.key === "Escape" && aoFechar();
    window.addEventListener("keydown", tecla);
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", tecla);
      document.body.style.overflow = antes;
    };
  }, [aoFechar]);

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal aria-label={elemento.term}>
      <button type="button" aria-label="Fechar" onClick={aoFechar} className="absolute inset-0 bg-black/60" />
      <div className="animate-fade-in-up relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[26px] border border-border bg-card px-5 pb-6 pt-3 sm:max-w-[440px] sm:rounded-[26px] sm:pt-5">
        <span aria-hidden className="mx-auto mb-4 block h-1.5 w-11 rounded-full bg-border sm:hidden" />

        {perguntas ? (
          <PraticaRapida
            elemento={elemento}
            perguntas={perguntas}
            curso={curso}
            aoTerminar={() => setPerguntas(null)}
            aoResponder={(dominio, erros) => aoAtualizar(elemento.id, dominio, erros)}
          />
        ) : (
          <>
            <button type="button" onClick={aoFechar} aria-label="Fechar" className="absolute right-4 top-4 hidden text-muted-foreground hover:text-foreground sm:block">
              <X className="size-5" />
            </button>
            <div className="flex items-center gap-3.5">
              <SimboloDoElemento elemento={elemento} grande />
              <div className="min-w-0">
                <p className="truncate font-mono text-[1.45rem] font-black leading-tight">{elemento.term}</p>
                <p className="text-[0.7rem] font-black uppercase tracking-[0.05em] text-muted-foreground">
                  {elemento.label} · {elemento.category}
                </p>
              </div>
            </div>

            {elemento.aprendido ? (
              <>
                <p className="mt-4 text-[0.95rem] leading-relaxed text-foreground/90">{elemento.meaning}</p>
                <div className="mt-4"><Exemplo texto={elemento.example} /></div>
                <div className="mt-4 text-[0.8rem] text-muted-foreground">
                  <p className="flex items-center gap-1.5">
                    <IconeSolar nome="Historico" className="size-4" />
                    Aprendido na aula <span className="font-black text-foreground">{elemento.aula.titulo}</span>
                  </p>
                  <BarraDeDominio elemento={elemento} className="mt-2.5 h-2" />
                  <p className="mt-1.5 text-[0.75rem]">
                    Domínio: {elemento.dominio} de {DOMINIO_CHEIO} acertos seguidos
                    {elemento.errosRecentes > 0 && <> · {elemento.errosRecentes} {elemento.errosRecentes === 1 ? "erro" : "erros"} nesta semana</>}
                  </p>
                </div>
                <div className="mt-5 grid grid-cols-[1fr_1.4fr] gap-2">
                  <button type="button" onClick={() => router.push(`/atividade/${elemento.aula.id}`)} className="zc-press h-12 rounded-2xl border-2 border-border text-[0.8rem] font-black uppercase tracking-[0.05em] text-foreground">
                    Ver a aula
                  </button>
                  <button
                    type="button"
                    onClick={() => setPerguntas(perguntasDe(elemento, todos))}
                    className="zc-press h-12 rounded-2xl bg-primary text-[0.8rem] font-black uppercase tracking-[0.05em] text-primary-foreground shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)]"
                  >
                    Praticar
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-dashed border-border px-4 py-4">
                <Lock className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                <p className="text-[0.9rem] leading-snug text-muted-foreground">
                  Você aprende este elemento na aula <span className="font-black text-foreground">{elemento.aula.titulo}</span>, da unidade{" "}
                  <span className="font-black text-foreground">{elemento.unidade}</span>. Conclua a aula para ver o significado e praticar.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
