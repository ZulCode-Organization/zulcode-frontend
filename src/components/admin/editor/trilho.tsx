"use client";

import { useState, type DragEvent } from "react";
import { DropdownMenu } from "radix-ui";
import { BookText, CheckSquare, ClipboardPaste, Code2, GripVertical, ListChecks, Plus, TextCursorInput } from "lucide-react";
import { cn } from "@/lib/utils";
import { porcento } from "@/lib/admin/formato";
import { TIPOS, nomeDaEtapa, ordenadas } from "./regras";
import type { Selecao } from "./editor-de-aula";
import type { Problema, RascunhoDaAula, TipoDeQuestao } from "@/lib/admin/tipos";

export const ICONE_DO_TIPO: Record<TipoDeQuestao, typeof ListChecks> = {
  MULTIPLE_CHOICE: ListChecks,
  TRUE_FALSE: CheckSquare,
  FILL_BLANK: TextCursorInput,
  CODE_ORDER: Code2,
};

export function Trilho({
  rascunho, selecao, problemas, desempenho, aoSelecionar, aoAdicionar, aoMover, aoColar,
}: {
  rascunho: RascunhoDaAula;
  selecao: Selecao;
  problemas: Problema[];
  desempenho: Record<string, { respostas: number; acertos: number }>;
  aoSelecionar: (s: Selecao) => void;
  aoAdicionar: (tipo: TipoDeQuestao, etapa: number) => void;
  aoMover: (id: string, destino: { antesDe?: string; etapa: number }) => void;
  aoColar: () => void;
}) {
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [sobre, setSobre] = useState<{ id?: string; etapa: number } | null>(null);
  const lista = ordenadas(rascunho);
  const numeroDe = new Map(lista.map((q, i) => [q.id, i + 1]));
  const comErro = new Set(problemas.filter((p) => p.nivel === "erro" && p.questaoId).map((p) => p.questaoId));
  const introComAviso = problemas.some((p) => !p.questaoId && p.etapa === undefined && /introdução|explicação/.test(p.texto));

  const soltar = (destino: { antesDe?: string; etapa: number }) => (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (arrastando && arrastando !== destino.antesDe) aoMover(arrastando, destino);
    setArrastando(null);
    setSobre(null);
  };

  return (
    <nav aria-label="Questões da aula" className="flex min-h-0 flex-col border-r bg-card/60">
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <button
          type="button"
          onClick={() => aoSelecionar({ tipo: "introducao" })}
          className={cn(
            "mb-2 flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-sm transition-colors",
            selecao.tipo === "introducao" ? "border-primary bg-primary/10" : "bg-card hover:border-primary/40",
          )}
        >
          <BookText className="size-4 shrink-0 text-primary" />
          <span className="min-w-0 flex-1">
            <span className="block font-bold">Introdução</span>
            <span className="block text-xs text-muted-foreground">{rascunho.introducao.length} {rascunho.introducao.length === 1 ? "slide" : "slides"} antes das questões</span>
          </span>
          {introComAviso && <span className="size-2 shrink-0 rounded-full bg-amber-500" aria-label="Com aviso" />}
        </button>

        {Array.from({ length: rascunho.etapas }, (_, i) => i + 1).map((etapa) => {
          const daEtapa = lista.filter((q) => q.etapa === etapa);
          return (
            <section
              key={etapa}
              className={cn("mb-2 rounded-lg p-1 transition-colors", sobre?.etapa === etapa && !sobre.id && "bg-primary/10 ring-1 ring-primary/40")}
              onDragOver={(e) => {
                if (!arrastando) return;
                e.preventDefault();
                if (sobre?.etapa !== etapa || sobre.id) setSobre({ etapa });
              }}
              onDrop={soltar({ etapa })}
            >
              <header className="flex items-center justify-between px-1.5 pb-1 pt-1.5">
                <h3 className="text-[0.7rem] font-black uppercase tracking-wider text-muted-foreground">{nomeDaEtapa(etapa, rascunho.etapas)}</h3>
                <span className={cn("text-[0.7rem] font-bold", daEtapa.length ? "text-muted-foreground" : "text-rose-500")}>{daEtapa.length || "vazia"}</span>
              </header>
              <ol className="space-y-1">
                {daEtapa.map((q) => {
                  const Icone = ICONE_DO_TIPO[q.tipo];
                  const d = desempenho[q.id];
                  const taxa = d && d.respostas >= 5 ? (d.acertos / d.respostas) * 100 : null;
                  const ativa = selecao.tipo === "questao" && selecao.id === q.id;
                  return (
                    <li
                      key={q.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", q.id);
                        setArrastando(q.id);
                      }}
                      onDragEnd={() => {
                        setArrastando(null);
                        setSobre(null);
                      }}
                      onDragOver={(e) => {
                        if (!arrastando || arrastando === q.id) return;
                        e.preventDefault();
                        e.stopPropagation();
                        if (sobre?.id !== q.id) setSobre({ id: q.id, etapa });
                      }}
                      onDrop={soltar({ antesDe: q.id, etapa })}
                      className={cn(
                        "zc-adm-entra relative",
                        sobre?.id === q.id && "before:absolute before:inset-x-1 before:-top-[3px] before:h-0.5 before:rounded before:bg-primary",
                        arrastando === q.id && "opacity-40",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => aoSelecionar({ tipo: "questao", id: q.id })}
                        aria-current={ativa ? "true" : undefined}
                        className={cn(
                          "group flex w-full items-start gap-1.5 rounded-lg border px-1.5 py-2 text-left transition-colors",
                          ativa ? "border-primary bg-primary/10 shadow-sm" : "border-transparent bg-card hover:border-border",
                        )}
                      >
                        <GripVertical className="mt-0.5 size-3.5 shrink-0 cursor-grab text-muted-foreground/40 group-hover:text-muted-foreground" aria-hidden />
                        <span className="w-5 shrink-0 pt-px text-right text-xs font-black tabular-nums text-muted-foreground">{numeroDe.get(q.id)}</span>
                        <span className="min-w-0 flex-1">
                          <span className={cn("line-clamp-2 text-xs font-bold leading-snug", !q.enunciado.trim() && "italic text-muted-foreground")}>
                            {q.enunciado.trim() || "Sem enunciado"}
                          </span>
                          <span className="mt-1 flex items-center gap-1.5 text-[0.65rem] text-muted-foreground">
                            <Icone className="size-3" />
                            {TIPOS.find((t) => t.tipo === q.tipo)?.nome}
                            {taxa !== null && (
                              <span className={cn("ml-auto font-bold tabular-nums", taxa < 30 ? "text-rose-500" : taxa < 50 ? "text-amber-500" : "")} title={`${d!.respostas} respostas`}>
                                {porcento(taxa, 0)} acertam
                              </span>
                            )}
                          </span>
                        </span>
                        {comErro.has(q.id) && <span className="mt-1 size-2 shrink-0 rounded-full bg-rose-500" aria-label="Tem problema" />}
                      </button>
                    </li>
                  );
                })}
              </ol>
              <MenuDeNova etapa={etapa} aoAdicionar={aoAdicionar} />
            </section>
          );
        })}
      </div>
      <div className="border-t p-2">
        <button type="button" onClick={aoColar} className="flex w-full items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground">
          <ClipboardPaste className="size-3.5" /> Colar várias perguntas
        </button>
      </div>
    </nav>
  );
}

function MenuDeNova({ etapa, aoAdicionar }: { etapa: number; aoAdicionar: (tipo: TipoDeQuestao, etapa: number) => void }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button type="button" className="mt-1 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed py-1.5 text-xs font-bold text-muted-foreground hover:border-primary hover:text-primary">
          <Plus className="size-3.5" /> Questão
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content side="right" align="start" sideOffset={6} className="zc-adm-entra z-50 w-64 rounded-xl border bg-popover p-1 shadow-xl">
          {TIPOS.map((t) => {
            const Icone = ICONE_DO_TIPO[t.tipo];
            return (
              <DropdownMenu.Item key={t.tipo} onSelect={() => aoAdicionar(t.tipo, etapa)} className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2.5 py-2 outline-none data-[highlighted]:bg-muted">
                <Icone className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  <span className="block text-sm font-bold">{t.nome}</span>
                  <span className="block text-xs text-muted-foreground">{t.descricao}</span>
                </span>
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
