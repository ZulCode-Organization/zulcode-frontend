"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { AlertTriangle, ArrowLeft, Check, Clock, Code2, Lightbulb, Play, X } from "lucide-react";
import { ActivityPlayer } from "@/components/atividade/activity-player";
import { atividadeDaApi, type ApiLesson } from "@/lib/course-content";
import { useDados } from "@/lib/admin/api";
import { numero } from "@/lib/admin/formato";
import { cn } from "@/lib/utils";
import { Botao, Erro, Esqueleto, Selo } from "../ui";
import { Pagina } from "../shell";

type Conteudo = Record<string, unknown>;

interface AulaNovaParaLer {
  aula: { id: string; cursoId: string; curso: string; secao: string | null; unidade: string; publicadaEm: string | null };
  linguagem: string | null;
  titulo: string;
  tipo: string;
  minutos: number | null;
  xp: number;
  metas: unknown;
  fonte: string | null;
  resumo: unknown;
  introducao: unknown;
  questoes: { id: string; tipo: string; enunciado: string; conteudo: Conteudo }[];
  problemas: string[];
  desempenho: Record<string, { respostas: number; acertos: number }>;
}

/** O nome de cada tipo de aula do formato novo, como aparece na trilha. */
export const NOME_DO_TIPO_DE_AULA: Record<string, string> = {
  CONCEPT: "Conceito",
  CODE: "Código",
  DEBUG: "Depuração",
  EXAM: "Revisão",
  PROJECT: "Projeto",
  UNIT_EXAM: "Prova da unidade",
};

const NOME_DA_QUESTAO: Record<string, string> = {
  MULTIPLE_CHOICE: "Múltipla escolha",
  FILL_BLANK: "Completar",
  TYPE_ANSWER: "Digitar a resposta",
  FIND_BUG: "Achar o erro",
  CODE_TESTS: "Escrever código",
  TRUE_FALSE: "Verdadeiro ou falso",
};

const textos = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
const texto = (v: unknown) => (typeof v === "string" ? v : "");
const mostrar = (v: unknown) => (v === undefined ? "undefined" : JSON.stringify(v));

/**
 * Uma aula do formato novo, só para ler: cada questão com a resposta certa e
 * o porquê de cada alternativa, a taxa de acerto e o "jogar como aluno".
 *
 * Essas aulas não se editam aqui. O conteúdo delas mora no código do servidor
 * (src/conteudo/cursos) e chega pelo botão "Aulas novas"; uma edição feita no
 * banco sumiria na próxima importação, e por lá cada mudança ainda passa pelo
 * conferidor, que roda o código de verdade.
 */
export function LeituraDaAula({ aulaId }: { aulaId: string }) {
  const { dados, erro, recarregar } = useDados<AulaNovaParaLer>(`/admin/conteudo/aulas/${aulaId}/leitura`);
  const [jogando, setJogando] = useState(false);

  if (erro && !dados) return <Pagina><Erro tentarDeNovo={recarregar}>{erro}</Erro></Pagina>;
  if (!dados) return <Pagina><Esqueleto linhas={10} /></Pagina>;

  const introducao = Array.isArray(dados.introducao) ? (dados.introducao as { title?: string; text?: string; codigo?: string }[]) : [];
  const resumo = dados.resumo && typeof dados.resumo === "object" ? (dados.resumo as { texto?: string; codigo?: string }) : null;
  const metas = textos(dados.metas);

  return (
    <Pagina>
      <Link href={`/admin/conteudo/${dados.aula.cursoId}`} className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {dados.aula.curso} · {dados.aula.unidade}
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Selo tom="azul">{NOME_DO_TIPO_DE_AULA[dados.tipo] ?? dados.tipo}</Selo>
            {!dados.aula.publicadaEm && <Selo>Não publicada</Selo>}
          </div>
          <h1 className="mt-1.5 text-2xl font-black leading-tight">{dados.titulo}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {dados.minutos ? <span className="inline-flex items-center gap-1"><Clock className="size-3.5" />{dados.minutos} min</span> : null}
            <span>{dados.xp} XP</span>
            <span>{dados.questoes.length} {dados.questoes.length === 1 ? "questão" : "questões"}</span>
            {dados.fonte && <span>Fonte: {dados.fonte}</span>}
          </p>
        </div>
        <Botao variante="primario" icone={<Play className="size-4 fill-current" />} onClick={() => setJogando(true)} className="w-full sm:w-auto">
          Jogar como aluno
        </Botao>
      </div>

      <div className="mt-4 rounded-xl border border-sky-500/30 bg-sky-500/5 px-4 py-3 text-sm">
        <p className="font-bold">Aula do formato novo: só leitura</p>
        <p className="mt-0.5 text-muted-foreground">
          O conteúdo desta aula fica no código do servidor e é conferido rodando os exemplos de verdade antes de entrar. Uma edição feita aqui sumiria na
          próxima importação, por isso as mudanças são feitas lá.
        </p>
      </div>

      {dados.problemas.length > 0 && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-3 text-sm font-bold text-rose-600 dark:text-rose-400">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {dados.problemas.includes("sem_questoes") ? "A aula não tem questões." : "Alguma questão está sem a resposta certa (veja as marcadas abaixo)."}
        </div>
      )}

      {metas.length > 0 && (
        <Bloco titulo="O que a pessoa aprende">
          <ul className="list-disc space-y-0.5 pl-5 text-sm">{metas.map((m) => <li key={m}>{m}</li>)}</ul>
        </Bloco>
      )}

      {introducao.length > 0 && (
        <Bloco titulo="Explicação antes das questões">
          <div className="space-y-3">
            {introducao.map((s, i) => (
              <div key={i}>
                <p className="font-black">{s.title}</p>
                <p className="text-sm text-muted-foreground">{s.text}</p>
                {s.codigo && <Codigo>{s.codigo}</Codigo>}
              </div>
            ))}
          </div>
        </Bloco>
      )}

      <h2 className="mt-6 text-sm font-black uppercase tracking-wide text-muted-foreground">Questões</h2>
      <ol className="mt-2 space-y-3">
        {dados.questoes.map((q, i) => (
          <Questao key={q.id} numero={i + 1} q={q} desempenho={dados.desempenho[q.id]} />
        ))}
      </ol>

      {resumo?.texto && (
        <Bloco titulo="Resumo no fim da aula">
          <p className="text-sm">{resumo.texto}</p>
          {resumo.codigo && <Codigo>{resumo.codigo}</Codigo>}
        </Bloco>
      )}

      {jogando && <JogarComoAluno dados={dados} aoFechar={() => setJogando(false)} />}
    </Pagina>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="mt-4 rounded-xl border bg-card p-4">
      <h2 className="mb-2 text-sm font-black uppercase tracking-wide text-muted-foreground">{titulo}</h2>
      {children}
    </section>
  );
}

function Codigo({ children, linhaMarcada }: { children: string; linhaMarcada?: number }) {
  return (
    <pre className="mt-2 overflow-x-auto rounded-lg border bg-muted/40 py-2 font-mono text-[0.8rem] leading-relaxed">
      {children.split("\n").map((linha, i) => (
        <div key={i} className={cn("flex px-3", linhaMarcada === i + 1 && "bg-rose-500/15")}>
          <span className="mr-3 w-5 shrink-0 select-none text-right text-muted-foreground/60">{i + 1}</span>
          <span className="whitespace-pre">{linha || " "}</span>
        </div>
      ))}
    </pre>
  );
}

/** Uma alternativa (ou bloco) com o seu porquê; a certa vem marcada. */
function Opcao({ texto: t, certa, porque }: { texto: string; certa: boolean; porque?: string }) {
  return (
    <li className={cn("rounded-lg border px-3 py-2 text-sm", certa ? "border-emerald-500/40 bg-emerald-500/5" : "border-border")}>
      <span className="flex items-start gap-2">
        {certa ? <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" /> : <X className="mt-0.5 size-4 shrink-0 text-muted-foreground/50" />}
        <span className="min-w-0">
          <span className="whitespace-pre-wrap font-mono font-bold">{t}</span>
          {porque && <span className="mt-0.5 block text-muted-foreground">{porque}</span>}
        </span>
      </span>
    </li>
  );
}

function Questao({ numero: n, q, desempenho }: { numero: number; q: AulaNovaParaLer["questoes"][number]; desempenho?: { respostas: number; acertos: number } }) {
  const c = q.conteudo ?? {};
  const certa = texto(c.correctAnswer);
  const porques = textos(c.explanations);
  const explicacao = texto(c.explanation);
  const taxa = desempenho && desempenho.respostas ? Math.round((desempenho.acertos / desempenho.respostas) * 100) : null;

  return (
    <li className="rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-black text-muted-foreground">{n}.</span>
        <Selo>{NOME_DA_QUESTAO[q.tipo] ?? q.tipo}</Selo>
        {taxa !== null && (
          <Selo tom={taxa < 50 ? "vermelho" : taxa < 75 ? "ambar" : "verde"}>
            {taxa}% de acerto · {numero(desempenho!.respostas)} {desempenho!.respostas === 1 ? "resposta" : "respostas"}
          </Selo>
        )}
      </div>
      <p className="mt-2 font-bold">{q.enunciado}</p>
      {texto(c.fala) && <p className="mt-1 text-sm italic text-muted-foreground">Zul: “{texto(c.fala)}”</p>}

      {q.tipo === "MULTIPLE_CHOICE" || q.tipo === "TRUE_FALSE" ? (
        <>
          {texto(c.code) && <Codigo>{texto(c.code)}</Codigo>}
          <ul className="mt-2 space-y-1.5">
            {textos(c.options).map((o, i) => <Opcao key={o} texto={o} certa={o === certa} porque={porques[i]} />)}
          </ul>
        </>
      ) : q.tipo === "FILL_BLANK" ? (
        <>
          <Codigo>{`${texto(c.codeBefore)}____${texto(c.codeAfter)}`}</Codigo>
          <ul className="mt-2 space-y-1.5">
            {textos(c.options).map((o, i) => <Opcao key={o} texto={o} certa={o === certa} porque={porques[i]} />)}
          </ul>
        </>
      ) : q.tipo === "TYPE_ANSWER" ? (
        <>
          {texto(c.code) && <Codigo>{texto(c.code)}</Codigo>}
          <ul className="mt-2 space-y-1.5">
            <Opcao texto={certa} certa porque={explicacao} />
            {textos(c.accepted).map((a) => <Opcao key={a} texto={a} certa porque="Também aceita." />)}
          </ul>
        </>
      ) : q.tipo === "FIND_BUG" ? (
        <>
          <Codigo linhaMarcada={Number(c.bugLine)}>{texto(c.code)}</Codigo>
          <p className="mt-2 text-sm"><b>Linha {Number(c.bugLine)}.</b> <span className="text-muted-foreground">{explicacao}</span></p>
        </>
      ) : q.tipo === "CODE_TESTS" ? (
        <TestesDaQuestao c={c} />
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">Tipo de questão sem visualização.</p>
      )}
    </li>
  );
}

function TestesDaQuestao({ c }: { c: Conteudo }) {
  const nome = texto(c.functionName);
  const testes = Array.isArray(c.tests) ? (c.tests as { args?: unknown[]; expected?: unknown }[]) : [];
  const dicas = textos(c.hints);
  return (
    <div className="mt-2 space-y-2 text-sm">
      {c.carryOver === true ? (
        <p className="text-muted-foreground">Começa com o código do passo anterior.</p>
      ) : texto(c.initialCode) ? (
        <div>
          <p className="text-xs font-bold text-muted-foreground">Código inicial</p>
          <Codigo>{texto(c.initialCode)}</Codigo>
        </div>
      ) : null}
      <div>
        <p className="text-xs font-bold text-muted-foreground">Testes</p>
        <ul className="mt-1 space-y-1 font-mono text-[0.8rem]">
          {testes.map((t, i) => (
            <li key={i} className="flex items-center gap-2 rounded-md bg-muted/40 px-2 py-1">
              <Code2 className="size-3.5 shrink-0 text-muted-foreground" />
              {nome}({(t.args ?? []).map(mostrar).join(", ")}) é {mostrar(t.expected)}
            </li>
          ))}
        </ul>
      </div>
      {dicas.length > 0 && (
        <ol className="space-y-1">
          {dicas.map((d, i) => (
            <li key={i} className="flex gap-2 text-amber-700 dark:text-amber-300"><Lightbulb className="mt-0.5 size-3.5 shrink-0" />Dica {i + 1}: {d}</li>
          ))}
        </ol>
      )}
      {texto(c.solution) && (
        <div>
          <p className="text-xs font-bold text-muted-foreground">Solução</p>
          <Codigo>{texto(c.solution)}</Codigo>
        </div>
      )}
      {texto(c.explanation) && <p className="text-muted-foreground">{texto(c.explanation)}</p>}
    </div>
  );
}

/** O mesmo jogador da trilha, sem gravar nada: sem XP, sem penas, sem progresso. */
function JogarComoAluno({ dados, aoFechar }: { dados: AulaNovaParaLer; aoFechar: () => void }) {
  const [rodada, setRodada] = useState(0);
  const licao: ApiLesson = {
    id: dados.aula.id,
    title: dados.titulo,
    xpReward: dados.xp,
    exercises: dados.questoes.map((q) => ({ id: q.id, type: q.tipo as ApiLesson["exercises"][number]["type"], prompt: q.enunciado, content: q.conteudo })),
    introduction: Array.isArray(dados.introducao) ? (dados.introducao as ApiLesson["introduction"]) : [],
    theoryCompleted: false,
    completed: false,
    kind: dados.tipo as ApiLesson["kind"],
    minutes: dados.minutos,
    goals: dados.metas,
    source: dados.fonte,
    summary: dados.resumo,
    language: dados.linguagem ?? undefined,
  };
  const atividade = atividadeDaApi(licao, "");

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-background" role="dialog" aria-modal aria-label="Jogar a aula como aluno">
      <div className="flex shrink-0 items-center gap-2 border-b bg-card px-3 py-2">
        <span className="rounded-md bg-amber-500/15 px-2 py-1 text-xs font-black text-amber-700 dark:text-amber-300">PRÉVIA · nada é salvo</span>
        <button type="button" onClick={() => setRodada((r) => r + 1)} className="h-7 rounded-md px-2.5 text-xs font-bold text-muted-foreground hover:bg-muted">Recomeçar</button>
        <button type="button" onClick={aoFechar} aria-label="Fechar a prévia" className="ml-auto flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ActivityPlayer
          key={rodada}
          atividade={atividade}
          licao={{ id: dados.aula.id, titulo: dados.titulo, subtitulo: "prévia", xp: dados.xp, estado: "atual" }}
          vidas={5}
          vidasIlimitadas
          aoErrar={async () => ({ lives: 5, isUnlimited: true })}
          aoSair={aoFechar}
        />
      </div>
    </div>
  );
}
