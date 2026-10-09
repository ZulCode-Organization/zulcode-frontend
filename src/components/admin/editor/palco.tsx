"use client";

import { type KeyboardEvent, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Check, Code2, Lightbulb, Plus, Terminal, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { nomeDaEtapa, nomeDoTipo, ordenadas } from "./regras";
import type { Selecao } from "./editor-de-aula";
import type { Problema, QuestaoDoRascunho, RascunhoDaAula } from "@/lib/admin/tipos";

/**
 * As cores das alternativas. Cada uma tem a letra junto, então a cor ajuda a
 * achar a opção mas nunca é o único jeito de saber qual é qual. Tons escuros o
 * bastante para o texto branco ler bem em cima.
 */
const CORES = ["#2563eb", "#7c3aed", "#0f766e", "#c2410c", "#be185d", "#a16207"];
const LETRAS = "ABCDEF";

type MudarQuestao = (id: string, f: (q: QuestaoDoRascunho) => QuestaoDoRascunho, campoDeTexto?: string) => void;

export function Palco({
  rascunho, selecao, problemas, aoMudarQuestao, aoMudar, rodape,
}: {
  rascunho: RascunhoDaAula;
  selecao: Selecao;
  problemas: Problema[];
  aoMudarQuestao: MudarQuestao;
  aoMudar: (f: (r: RascunhoDaAula) => RascunhoDaAula, campoDeTexto?: string) => void;
  rodape?: ReactNode;
}) {
  const q = selecao.tipo === "questao" ? rascunho.questoes.find((x) => x.id === selecao.id) : undefined;
  const numero = q ? ordenadas(rascunho).findIndex((x) => x.id === q.id) + 1 : 0;
  const dela = q ? problemas.filter((p) => p.questaoId === q.id) : [];

  return (
    <main className="min-h-0 overflow-y-auto bg-muted/30">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-8">
        {selecao.tipo === "introducao" ? (
          <Introducao rascunho={rascunho} aoMudar={aoMudar} />
        ) : !q ? (
          <p className="py-20 text-center text-sm text-muted-foreground">Escolha uma questão à esquerda, ou crie uma com <b>N</b>.</p>
        ) : (
          <div key={q.id} className="zc-adm-entra">
            <p className="mb-3 flex flex-wrap items-center gap-2 text-xs font-bold text-muted-foreground">
              <span className="rounded-md bg-card px-2 py-1 shadow-sm">Questão {numero}</span>
              <span>{nomeDaEtapa(q.etapa, rascunho.etapas)}</span>
              <span>·</span>
              <span>{nomeDoTipo(q.tipo)}</span>
            </p>

            <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
              <textarea
                value={q.enunciado}
                onChange={(e) => aoMudarQuestao(q.id, (x) => ({ ...x, enunciado: e.target.value }), "enunciado")}
                placeholder={q.tipo === "TRUE_FALSE" ? "Escreva a afirmação que a pessoa vai julgar…" : "Escreva a pergunta…"}
                aria-label="Enunciado"
                rows={2}
                className="w-full resize-none bg-transparent text-center text-xl font-black leading-snug outline-none [field-sizing:content] placeholder:font-bold placeholder:text-muted-foreground/60 sm:text-2xl"
              />
            </div>

            <div className="mt-4">
              {q.tipo === "MULTIPLE_CHOICE" && <Alternativas q={q} aoMudar={aoMudarQuestao} />}
              {q.tipo === "TRUE_FALSE" && <VerdadeiroOuFalso q={q} aoMudar={aoMudarQuestao} />}
              {q.tipo === "FILL_BLANK" && <Completar q={q} aoMudar={aoMudarQuestao} />}
              {q.tipo === "CODE_ORDER" && <EscreverCodigo q={q} aoMudar={aoMudarQuestao} />}
            </div>

            {dela.length > 0 && (
              <ul className="mt-4 space-y-1">
                {dela.map((p, i) => (
                  <li key={i} className={cn("rounded-lg px-3 py-2 text-xs font-bold", p.nivel === "erro" ? "bg-rose-500/10 text-rose-700 dark:text-rose-300" : "bg-amber-500/10 text-amber-800 dark:text-amber-200")}>
                    {p.texto.replace(/^Questão \d+: /, "")}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {rodape}
      </div>
    </main>
  );
}

// ── Campos ───────────────────────────────────────────────────────────────

/** Um campo de código: fonte monoespaçada, e Tab indenta em vez de sair do campo. */
export function CampoDeCodigo({ valor, aoMudar, placeholder, rotulo, linhas = 4, className }: { valor: string; aoMudar: (v: string) => void; placeholder?: string; rotulo: string; linhas?: number; className?: string }) {
  const aoTeclar = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Tab" || e.shiftKey) return;
    e.preventDefault();
    const el = e.currentTarget;
    const { selectionStart: i, selectionEnd: f } = el;
    const novo = `${valor.slice(0, i)}  ${valor.slice(f)}`;
    aoMudar(novo);
    requestAnimationFrame(() => el.setSelectionRange(i + 2, i + 2));
  };
  return (
    <textarea
      value={valor}
      onChange={(e) => aoMudar(e.target.value)}
      onKeyDown={aoTeclar}
      placeholder={placeholder}
      aria-label={rotulo}
      rows={linhas}
      spellCheck={false}
      className={cn("w-full resize-y rounded-lg border bg-[#0f1115] px-3 py-2.5 font-mono text-[0.82rem] leading-relaxed text-slate-100 outline-none [field-sizing:content] placeholder:text-slate-500 focus:border-primary", className)}
    />
  );
}

function Marcador({ certo, aoMarcar, rotulo }: { certo: boolean; aoMarcar: () => void; rotulo: string }) {
  return (
    <button
      type="button"
      onClick={aoMarcar}
      role="radio"
      aria-checked={certo}
      aria-label={rotulo}
      title={certo ? "Esta é a certa" : "Marcar como a certa"}
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-all",
        certo ? "scale-110 border-white bg-white text-emerald-600 shadow" : "border-white/70 text-transparent hover:border-white hover:text-white/60",
      )}
    >
      <Check className="size-4" strokeWidth={3.5} />
    </button>
  );
}

// ── Alternativa ──────────────────────────────────────────────────────────

function Alternativas({ q, aoMudar }: { q: QuestaoDoRascunho; aoMudar: MudarQuestao }) {
  const alts = q.alternativas ?? [];
  const comCodigo = q.codigo !== undefined;
  const mudarAlt = (i: number, texto: string) => aoMudar(q.id, (x) => ({ ...x, alternativas: (x.alternativas ?? []).map((a, j) => (j === i ? texto : a)) }), `alt${i}`);
  const tirar = (i: number) => aoMudar(q.id, (x) => {
    const lista = (x.alternativas ?? []).filter((_, j) => j !== i);
    const c = x.correta ?? 0;
    return { ...x, alternativas: lista, correta: c === i ? 0 : c > i ? c - 1 : c };
  });

  return (
    <div className="space-y-3">
      {comCodigo ? (
        <div className="rounded-xl border bg-card p-3">
          <div className="mb-2 flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span className="flex items-center gap-1.5"><Code2 className="size-3.5" /> Código mostrado acima das alternativas</span>
            <button type="button" onClick={() => aoMudar(q.id, (x) => { const { codigo: _c, ...resto } = x; return resto; })} className="flex items-center gap-1 hover:text-rose-500"><X className="size-3" /> tirar</button>
          </div>
          <CampoDeCodigo valor={q.codigo ?? ""} aoMudar={(v) => aoMudar(q.id, (x) => ({ ...x, codigo: v }), "codigo")} rotulo="Código acima das alternativas" placeholder={'const x = 2;\nconsole.log(x * 3);'} />
        </div>
      ) : (
        <button type="button" onClick={() => aoMudar(q.id, (x) => ({ ...x, codigo: "" }))} className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary">
          <Code2 className="size-3.5" /> Mostrar um trecho de código acima das alternativas
        </button>
      )}

      <div role="radiogroup" aria-label="Alternativas" className="grid gap-2.5 sm:grid-cols-2">
        {alts.map((a, i) => {
          const certa = q.correta === i;
          return (
            <div
              key={i}
              className={cn("group relative flex min-h-[76px] items-center gap-2.5 rounded-xl px-3 py-3 text-white shadow-sm transition-[box-shadow,transform]", certa && "ring-4 ring-emerald-400/70")}
              style={{ background: CORES[i % CORES.length] }}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-black/20 text-sm font-black">{LETRAS[i]}</span>
              <textarea
                value={a}
                onChange={(e) => mudarAlt(i, e.target.value)}
                placeholder={`Alternativa ${LETRAS[i]}${i < 2 ? "" : " (opcional)"}`}
                aria-label={`Alternativa ${LETRAS[i]}`}
                rows={1}
                className="min-w-0 flex-1 resize-none bg-transparent font-bold leading-snug text-white outline-none [field-sizing:content] placeholder:text-white/60"
              />
              <Marcador certo={certa} aoMarcar={() => aoMudar(q.id, (x) => ({ ...x, correta: i }))} rotulo={`Marcar ${LETRAS[i]} como certa`} />
              {alts.length > 2 && (
                <button type="button" onClick={() => tirar(i)} aria-label={`Tirar a alternativa ${LETRAS[i]}`} className="absolute -right-1.5 -top-1.5 hidden size-5 items-center justify-center rounded-full border bg-card text-muted-foreground shadow group-hover:flex hover:text-rose-500">
                  <X className="size-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
      {alts.length < 6 && (
        <button type="button" onClick={() => aoMudar(q.id, (x) => ({ ...x, alternativas: [...(x.alternativas ?? []), ""] }))} className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed py-2.5 text-sm font-bold text-muted-foreground hover:border-primary hover:text-primary">
          <Plus className="size-4" /> Alternativa
        </button>
      )}
      <p className="text-center text-xs text-muted-foreground">Clique no círculo para marcar a certa · <b>Alt + 1…6</b> também marca</p>
    </div>
  );
}

// ── Verdadeiro ou falso ──────────────────────────────────────────────────

function VerdadeiroOuFalso({ q, aoMudar }: { q: QuestaoDoRascunho; aoMudar: MudarQuestao }) {
  return (
    <div role="radiogroup" aria-label="Resposta certa" className="grid grid-cols-2 gap-3">
      {[{ valor: true, nome: "Verdadeiro", cor: CORES[0] }, { valor: false, nome: "Falso", cor: CORES[3] }].map((o) => {
        const certa = q.verdadeiro === o.valor;
        return (
          <button
            key={o.nome}
            type="button"
            role="radio"
            aria-checked={certa}
            onClick={() => aoMudar(q.id, (x) => ({ ...x, verdadeiro: o.valor }))}
            className={cn("flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl text-lg font-black text-white shadow-sm transition-all", certa ? "ring-4 ring-emerald-400/70" : "opacity-80 hover:opacity-100")}
            style={{ background: o.cor }}
          >
            {o.nome}
            <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-xs", certa ? "bg-white text-emerald-700" : "bg-black/20 text-white/80")}>
              {certa ? <><Check className="size-3" strokeWidth={3.5} /> resposta certa</> : "marcar como certa"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Completar ────────────────────────────────────────────────────────────

function Completar({ q, aoMudar }: { q: QuestaoDoRascunho; aoMudar: MudarQuestao }) {
  const blocos = q.blocos ?? [];
  const certo = blocos[q.correta ?? 0];
  return (
    <div className="space-y-3">
      <div className="rounded-xl border bg-card p-3">
        <p className="mb-2 text-xs font-bold text-muted-foreground">O código, com o espaço para completar no meio</p>
        <CampoDeCodigo valor={q.codigoAntes ?? ""} aoMudar={(v) => aoMudar(q.id, (x) => ({ ...x, codigoAntes: v }), "antes")} rotulo="Código antes do espaço" placeholder="let nome = " linhas={2} />
        <div className="my-2 flex items-center justify-center">
          <span className="rounded-md border-2 border-dashed border-primary bg-primary/10 px-3 py-1 font-mono text-sm font-bold text-primary">
            {certo?.trim() || "espaço"}
          </span>
        </div>
        <CampoDeCodigo valor={q.codigoDepois ?? ""} aoMudar={(v) => aoMudar(q.id, (x) => ({ ...x, codigoDepois: v }), "depois")} rotulo="Código depois do espaço" placeholder={";\nconsole.log(nome);"} linhas={2} />
      </div>
      <div>
        <p className="mb-2 text-xs font-bold text-muted-foreground">Os blocos para encaixar (a certa e as que confundem)</p>
        <div role="radiogroup" aria-label="Blocos" className="grid gap-2 sm:grid-cols-2">
          {blocos.map((b, i) => {
            const marcado = q.correta === i;
            return (
              <div key={i} className={cn("group relative flex items-center gap-2 rounded-xl px-3 py-2.5 text-white", marcado && "ring-4 ring-emerald-400/70")} style={{ background: CORES[i % CORES.length] }}>
                <input
                  value={b}
                  onChange={(e) => aoMudar(q.id, (x) => ({ ...x, blocos: (x.blocos ?? []).map((y, j) => (j === i ? e.target.value : y)) }), `bloco${i}`)}
                  placeholder={`Bloco ${i + 1}`}
                  aria-label={`Bloco ${i + 1}`}
                  className="min-w-0 flex-1 bg-transparent font-mono text-sm font-bold text-white outline-none placeholder:text-white/60"
                />
                <Marcador certo={marcado} aoMarcar={() => aoMudar(q.id, (x) => ({ ...x, correta: i }))} rotulo={`Marcar o bloco ${i + 1} como certo`} />
                {blocos.length > 2 && (
                  <button type="button" onClick={() => aoMudar(q.id, (x) => {
                    const lista = (x.blocos ?? []).filter((_, j) => j !== i);
                    const c = x.correta ?? 0;
                    return { ...x, blocos: lista, correta: c === i ? 0 : c > i ? c - 1 : c };
                  })} aria-label={`Tirar o bloco ${i + 1}`} className="absolute -right-1.5 -top-1.5 hidden size-5 items-center justify-center rounded-full border bg-card text-muted-foreground shadow group-hover:flex hover:text-rose-500">
                    <X className="size-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {blocos.length < 8 && (
          <button type="button" onClick={() => aoMudar(q.id, (x) => ({ ...x, blocos: [...(x.blocos ?? []), ""] }))} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed py-2 text-sm font-bold text-muted-foreground hover:border-primary hover:text-primary">
            <Plus className="size-4" /> Bloco
          </button>
        )}
      </div>
    </div>
  );
}

// ── Escrever código ──────────────────────────────────────────────────────

function EscreverCodigo({ q, aoMudar }: { q: QuestaoDoRascunho; aoMudar: MudarQuestao }) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border bg-card p-3">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-muted-foreground"><Code2 className="size-3.5" /> O que já vem escrito no editor (pode ficar vazio)</p>
        <CampoDeCodigo valor={q.codigoInicial ?? ""} aoMudar={(v) => aoMudar(q.id, (x) => ({ ...x, codigoInicial: v }), "inicial")} rotulo="Código inicial" placeholder={'// escreva aqui\n'} linhas={5} />
      </div>
      <div className="rounded-xl border bg-card p-3">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-muted-foreground"><Terminal className="size-3.5" /> O console.log precisa imprimir exatamente</p>
        <input
          value={q.resultadoEsperado ?? ""}
          onChange={(e) => aoMudar(q.id, (x) => ({ ...x, resultadoEsperado: e.target.value }), "esperado")}
          placeholder="Olá, mundo"
          aria-label="Resultado esperado"
          className="w-full rounded-lg border bg-[#0f1115] px-3 py-2 font-mono text-sm text-emerald-300 outline-none focus:border-primary"
        />
        <p className="mt-1.5 text-[0.72rem] text-muted-foreground">O código da pessoa roda de verdade; acerta quando algum console.log imprime este texto (espaços nas pontas não contam).</p>
      </div>
      <div className="rounded-xl border bg-card p-3">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-muted-foreground"><Lightbulb className="size-3.5" /> Dica</p>
        <input
          value={q.dica ?? ""}
          onChange={(e) => aoMudar(q.id, (x) => ({ ...x, dica: e.target.value }), "dica")}
          placeholder="Use console.log com o texto entre aspas."
          aria-label="Dica"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>
    </div>
  );
}

// ── Introdução ───────────────────────────────────────────────────────────

function Introducao({ rascunho, aoMudar }: { rascunho: RascunhoDaAula; aoMudar: (f: (r: RascunhoDaAula) => RascunhoDaAula, campoDeTexto?: string) => void }) {
  const slides = rascunho.introducao;
  const mudarSlide = (i: number, campo: "titulo" | "texto" | "codigo", valor: string | undefined) =>
    aoMudar((r) => ({ ...r, introducao: r.introducao.map((s, j) => (j === i ? { ...s, [campo]: valor } : s)) }), `slide${i}:${campo}`);
  const trocar = (i: number, j: number) => aoMudar((r) => {
    const lista = [...r.introducao];
    [lista[i], lista[j]] = [lista[j], lista[i]];
    return { ...r, introducao: lista };
  });

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-black">Introdução</h2>
        <p className="text-sm text-muted-foreground">Os slides que explicam o conteúdo antes das questões. Toda pergunta deveria dar para responder só com o que aparece aqui.</p>
      </div>
      {slides.map((s, i) => (
        <div key={i} className="zc-adm-entra rounded-2xl border bg-card p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-black text-muted-foreground">Slide {i + 1}</span>
            <span className="flex items-center gap-0.5">
              <button type="button" disabled={i === 0} onClick={() => trocar(i, i - 1)} aria-label="Subir slide" className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30"><ArrowUp className="size-3.5" /></button>
              <button type="button" disabled={i === slides.length - 1} onClick={() => trocar(i, i + 1)} aria-label="Descer slide" className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30"><ArrowDown className="size-3.5" /></button>
              <button type="button" onClick={() => aoMudar((r) => ({ ...r, introducao: r.introducao.filter((_, j) => j !== i) }))} aria-label="Apagar slide" className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-rose-500"><Trash2 className="size-3.5" /></button>
            </span>
          </div>
          <input
            value={s.titulo}
            onChange={(e) => mudarSlide(i, "titulo", e.target.value)}
            placeholder="Título (ex.: O que é uma variável?)"
            aria-label={`Título do slide ${i + 1}`}
            className="w-full bg-transparent text-lg font-black outline-none placeholder:text-muted-foreground/60"
          />
          <textarea
            value={s.texto}
            onChange={(e) => mudarSlide(i, "texto", e.target.value)}
            placeholder="A explicação, em linguagem simples…"
            aria-label={`Texto do slide ${i + 1}`}
            rows={3}
            className="mt-1 w-full resize-none bg-transparent leading-relaxed text-muted-foreground outline-none [field-sizing:content] placeholder:text-muted-foreground/50"
          />
          {s.codigo !== undefined ? (
            <div className="mt-2">
              <CampoDeCodigo valor={s.codigo} aoMudar={(v) => mudarSlide(i, "codigo", v)} rotulo={`Código do slide ${i + 1}`} placeholder="let idade = 18;" linhas={3} />
              <button type="button" onClick={() => mudarSlide(i, "codigo", undefined)} className="mt-1 flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-rose-500"><X className="size-3" /> tirar o código</button>
            </div>
          ) : (
            <button type="button" onClick={() => mudarSlide(i, "codigo", "")} className="mt-2 flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary"><Code2 className="size-3.5" /> Adicionar um exemplo de código</button>
          )}
        </div>
      ))}
      <button type="button" onClick={() => aoMudar((r) => ({ ...r, introducao: [...r.introducao, { titulo: "", texto: "" }] }))} className="flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed py-3 text-sm font-bold text-muted-foreground hover:border-primary hover:text-primary">
        <Plus className="size-4" /> Slide
      </button>
    </div>
  );
}
