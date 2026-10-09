"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type DragEvent, type KeyboardEvent, type ReactNode } from "react";
import {
  AlertTriangle, ArrowLeft, ChevronDown, ChevronRight, Copy, FilePenLine, GripVertical, Layers, Plus, Trash2, UsersRound,
} from "lucide-react";
import { Pagina } from "../shell";
import { Botao, Erro, Esqueleto, Interruptor, Selo, Vazio } from "../ui";
import { ConfirmarDigitando } from "../dialogo";
import { apagarComDesfazer, avisar } from "../avisos";
import { EscolhaDeLogo } from "./logo";
import { TextoEditavel } from "./texto-editavel";
import { usePerfil } from "@/hooks/use-perfil";
import { invalidar, pedir, trocarNoCache, useDados } from "@/lib/admin/api";
import { numero, relativo } from "@/lib/admin/formato";
import { cn } from "@/lib/utils";
import type { Arvore, AulaDaArvore, ProblemaDeAula, SecaoDaArvore, UnidadeDaArvore } from "@/lib/admin/tipos";

export const PROBLEMAS: Record<ProblemaDeAula, { texto: string; explicacao: string; grave: boolean }> = {
  sem_questoes: { texto: "Sem questões", explicacao: "A aula não tem nenhuma questão publicada.", grave: true },
  questao_invisivel: { texto: "Questão invisível", explicacao: "Há questões gravadas numa etapa que a aula não mostra (vieram do administrativo antigo). Abra e publique a aula para consertar.", grave: true },
  etapa_vazia: { texto: "Etapa vazia", explicacao: "Uma das etapas não tem questão: quem chegar nela não tem o que responder.", grave: true },
  sem_resposta: { texto: "Sem resposta certa", explicacao: "Uma questão tem a resposta certa fora das opções.", grave: true },
  sem_introducao: { texto: "Sem explicação", explicacao: "A aula vai direto às questões, sem explicar o conteúdo antes.", grave: false },
};

type Arrastado = { tipo: "secao" | "unidade" | "aula"; id: string };
type Alvo = { tipo: "secao" | "unidade" | "aula"; id: string; onde: "antes" | "depois" | "dentro" };

const SEM_SECAO = "__sem_secao__";

/**
 * A árvore do curso: tudo numa tela, do curso às aulas. Arrastar reordena (e
 * muda de lugar: uma aula vai para outra unidade, uma unidade para outra
 * seção); pelo teclado, Alt+↑/↓ faz o mesmo na linha em foco. A mudança
 * aparece na hora e é confirmada no servidor por baixo; se falhar, a árvore
 * volta ao que o servidor tem.
 */
export function ArvoreDoCurso({ cursoId }: { cursoId: string }) {
  const router = useRouter();
  const { perfil } = usePerfil();
  const ehAdmin = perfil?.role === "ADMIN";
  const chave = `/admin/conteudo/cursos/${cursoId}/arvore`;
  const { dados: a, erro, recarregar, atualizando } = useDados<Arvore>(chave, { velhoDepoisDe: 5_000 });
  const [fechados, setFechados] = useState<Set<string>>(new Set());
  const [soProblemas, setSoProblemas] = useState(false);
  const [arrastado, setArrastado] = useState<Arrastado | null>(null);
  const [alvo, setAlvo] = useState<Alvo | null>(null);
  const [apagarCurso, setApagarCurso] = useState(false);

  if (erro && !a) return <Pagina><Erro tentarDeNovo={recarregar}>{erro}</Erro></Pagina>;
  if (!a) return <Pagina><Esqueleto linhas={12} /></Pagina>;

  // ── Mudanças, com a tela mudando antes do servidor responder ──

  const mudarLocal = (f: (x: Arvore) => Arvore) => trocarNoCache<Arvore>(chave, (x) => (x ? f(structuredClone(x)) : x!));
  const confirmar = async (pedido: Promise<unknown>, ok?: string) => {
    try {
      await pedido;
      if (ok) avisar(ok);
    } catch (e) {
      avisar(e instanceof Error ? e.message : "Não foi possível salvar.", { tom: "erro" });
    } finally {
      invalidar(chave);
      invalidar("/admin/conteudo/cursos");
    }
  };

  const grupos: (SecaoDaArvore & { semSecao?: boolean })[] = [
    ...a.secoes,
    ...(a.unidadesSemSecao.length ? [{ id: SEM_SECAO, titulo: "Unidades sem seção", descricao: null, nivelamento: false, ordem: 9999, unidades: a.unidadesSemSecao, semSecao: true }] : []),
  ];
  const todasAsAulas = grupos.flatMap((g) => g.unidades.flatMap((u) => u.aulas));
  const comProblema = todasAsAulas.filter((x) => x.problemas.some((p) => PROBLEMAS[p].grave)).length;
  const invisiveis = todasAsAulas.filter((x) => x.problemas.includes("questao_invisivel")).length;

  const consertarEtapas = async () => {
    try {
      const r = await pedir<{ questoes: number; aulas: number }>(`/admin/conteudo/cursos/${cursoId}/consertar-etapas`, { method: "POST" });
      avisar(r.questoes ? `${r.questoes} questões voltaram a aparecer, em ${r.aulas} aulas.` : "Nada para consertar.");
    } catch (e) {
      avisar(e instanceof Error ? e.message : "Não foi possível consertar.", { tom: "erro" });
    } finally {
      invalidar(chave);
      invalidar("/admin/conteudo/cursos");
    }
  };

  const unidadesDe = (x: Arvore, secaoId: string) => (secaoId === SEM_SECAO ? x.unidadesSemSecao : x.secoes.find((s) => s.id === secaoId)!.unidades);
  const acharUnidade = (x: Arvore, unidadeId: string) => {
    for (const g of [...x.secoes.map((s) => ({ id: s.id, unidades: s.unidades })), { id: SEM_SECAO, unidades: x.unidadesSemSecao }]) {
      const i = g.unidades.findIndex((u) => u.id === unidadeId);
      if (i >= 0) return { secaoId: g.id, lista: g.unidades, i };
    }
    return null;
  };
  const acharAula = (x: Arvore, aulaId: string) => {
    for (const g of [...x.secoes.flatMap((s) => s.unidades), ...x.unidadesSemSecao]) {
      const i = g.aulas.findIndex((l) => l.id === aulaId);
      if (i >= 0) return { unidade: g, i };
    }
    return null;
  };

  /** Move um item para junto do alvo, na árvore local, e manda a nova ordem ao servidor. */
  const mover = (item: Arrastado, destino: Alvo) => {
    if (item.id === destino.id) return;
    let pedido: { tipo: string; paiId: string | null; ids: string[] } | null = null;

    mudarLocal((x) => {
      if (item.tipo === "aula") {
        const origem = acharAula(x, item.id);
        if (!origem) return x;
        const [aula] = origem.unidade.aulas.splice(origem.i, 1);
        let unidade: UnidadeDaArvore | undefined;
        let pos = 0;
        if (destino.tipo === "aula") {
          const d = acharAula(x, destino.id);
          if (!d) return x;
          unidade = d.unidade;
          pos = d.i + (destino.onde === "depois" ? 1 : 0);
        } else if (destino.tipo === "unidade") {
          unidade = acharUnidade(x, destino.id)?.lista.find((u) => u.id === destino.id);
          pos = unidade?.aulas.length ?? 0;
        }
        if (!unidade) return x;
        unidade.aulas.splice(pos, 0, aula);
        pedido = { tipo: "aula", paiId: unidade.id, ids: unidade.aulas.map((l) => l.id) };
      }

      if (item.tipo === "unidade") {
        const origem = acharUnidade(x, item.id);
        if (!origem) return x;
        const [unidade] = origem.lista.splice(origem.i, 1);
        let secaoId: string | undefined;
        let pos = 0;
        if (destino.tipo === "unidade") {
          const d = acharUnidade(x, destino.id);
          if (!d) return x;
          secaoId = d.secaoId;
          pos = d.i + (destino.onde === "depois" ? 1 : 0);
        } else if (destino.tipo === "secao") {
          secaoId = destino.id;
          pos = unidadesDe(x, destino.id).length;
        }
        if (!secaoId) return x;
        unidadesDe(x, secaoId).splice(pos, 0, unidade);
        pedido = { tipo: "unidade", paiId: secaoId === SEM_SECAO ? null : secaoId, ids: unidadesDe(x, secaoId).map((u) => u.id) };
      }

      if (item.tipo === "secao" && destino.tipo === "secao" && destino.id !== SEM_SECAO) {
        const i = x.secoes.findIndex((s) => s.id === item.id);
        const [secao] = x.secoes.splice(i, 1);
        const j = x.secoes.findIndex((s) => s.id === destino.id) + (destino.onde === "depois" ? 1 : 0);
        x.secoes.splice(j, 0, secao);
        pedido = { tipo: "secao", paiId: cursoId, ids: x.secoes.map((s) => s.id) };
      }
      return x;
    });

    if (pedido) void confirmar(pedir("/admin/conteudo/reordenar", { method: "POST", json: pedido }));
  };

  /** Alt+↑/↓: o mesmo que arrastar, para quem usa o teclado. */
  const moverComTeclado = (e: KeyboardEvent, item: Arrastado, irmaos: { id: string }[]) => {
    if (!e.altKey || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
    e.preventDefault();
    const i = irmaos.findIndex((x) => x.id === item.id);
    const j = e.key === "ArrowUp" ? i - 1 : i + 1;
    if (j < 0 || j >= irmaos.length) return;
    mover(item, { tipo: item.tipo, id: irmaos[j].id, onde: e.key === "ArrowUp" ? "antes" : "depois" });
  };

  // ── Arrastar ──

  const aoArrastar = (item: Arrastado) => (e: DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", item.id);
    setArrastado(item);
  };
  const aceita = (destino: Alvo["tipo"]) =>
    arrastado && (arrastado.tipo === destino || (arrastado.tipo === "aula" && destino === "unidade") || (arrastado.tipo === "unidade" && destino === "secao"));
  const sobre = (tipo: Alvo["tipo"], id: string, podeDentro: boolean) => (e: DragEvent) => {
    if (!aceita(tipo) || arrastado?.id === id) return;
    e.preventDefault();
    e.stopPropagation();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const onde = arrastado!.tipo !== tipo && podeDentro ? "dentro" : e.clientY < r.top + r.height / 2 ? "antes" : "depois";
    if (alvo?.id !== id || alvo.onde !== onde) setAlvo({ tipo, id, onde });
  };
  const soltar = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (arrastado && alvo) mover(arrastado, alvo);
    setArrastado(null);
    setAlvo(null);
  };
  const fimDoArraste = () => {
    setArrastado(null);
    setAlvo(null);
  };
  const linhaDoAlvo = (id: string) => (alvo?.id === id ? (alvo.onde === "antes" ? "before:absolute before:inset-x-0 before:-top-px before:h-0.5 before:rounded before:bg-primary" : alvo.onde === "depois" ? "after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded after:bg-primary" : "ring-2 ring-primary/60") : "");

  // ── Criar, renomear, apagar ──

  const alternar = (id: string) => setFechados((f) => {
    const n = new Set(f);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    return n;
  });

  const novaSecao = () => confirmar(pedir(`/admin/conteudo/cursos/${cursoId}/secoes`, { method: "POST", json: { titulo: "Nova seção" } }), "Seção criada.");
  const novaUnidade = (secaoId: string) =>
    confirmar(pedir("/admin/conteudo/unidades", { method: "POST", json: { cursoId, secaoId: secaoId === SEM_SECAO ? null : secaoId, titulo: "Nova unidade" } }), "Unidade criada.");
  const novaAula = async (unidadeId: string) => {
    try {
      const aula = await pedir<{ id: string }>(`/admin/conteudo/unidades/${unidadeId}/aulas`, { method: "POST", json: { titulo: "Nova aula" } });
      invalidar(chave);
      router.push(`/admin/conteudo/aula/${aula.id}`);
    } catch (e) {
      avisar(e instanceof Error ? e.message : "Não foi possível criar.", { tom: "erro" });
    }
  };
  const renomear = (tipo: "secoes" | "unidades", id: string, titulo: string) => {
    mudarLocal((x) => {
      if (tipo === "secoes") x.secoes.find((s) => s.id === id)!.titulo = titulo;
      else {
        const u = acharUnidade(x, id);
        if (u) u.lista[u.i].titulo = titulo;
      }
      return x;
    });
    void confirmar(pedir(`/admin/conteudo/${tipo}/${id}`, { method: "PATCH", json: { titulo } }));
  };
  const apagar = (tipo: "secao" | "unidade" | "aula", id: string, titulo: string) => {
    const antes = structuredClone(a);
    apagarComDesfazer({
      texto: `${tipo === "secao" ? "Seção" : tipo === "unidade" ? "Unidade" : "Aula"} "${titulo}" apagada.${tipo === "secao" ? " As unidades ficam soltas no curso." : ""}`,
      tirarDaTela: () => mudarLocal((x) => {
        if (tipo === "secao") {
          const i = x.secoes.findIndex((s) => s.id === id);
          const [s] = x.secoes.splice(i, 1);
          x.unidadesSemSecao.push(...s.unidades);
        } else if (tipo === "unidade") {
          const u = acharUnidade(x, id);
          u?.lista.splice(u.i, 1);
        } else {
          const l = acharAula(x, id);
          l?.unidade.aulas.splice(l.i, 1);
        }
        return x;
      }),
      restaurar: () => trocarNoCache<Arvore>(chave, () => antes),
      executar: () => confirmar(pedir(`/admin/conteudo/${tipo === "secao" ? "secoes" : tipo === "unidade" ? "unidades" : "aulas"}/${id}`, { method: "DELETE" })),
    });
  };
  const duplicar = (id: string) => confirmar(pedir(`/admin/conteudo/aulas/${id}/duplicar`, { method: "POST" }), "Aula duplicada logo abaixo da original.");

  const editarCurso = (dados: Record<string, unknown>, ok?: string) => {
    mudarLocal((x) => ({ ...x, ...("nome" in dados ? { nome: dados.nome as string } : {}), ...("descricao" in dados ? { descricao: dados.descricao as string } : {}), ...("logoUrl" in dados ? { logoUrl: dados.logoUrl as string | null } : {}), ...("ativo" in dados ? { ativo: dados.ativo as boolean } : {}) }));
    void confirmar(pedir(`/admin/conteudo/cursos/${cursoId}`, { method: "PATCH", json: dados }), ok);
  };

  return (
    <Pagina>
      <Link href="/admin/conteudo" className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Conteúdo
      </Link>

      {/* ── Curso ── */}
      <header className={cn("mb-5 flex flex-wrap items-start gap-4 transition-opacity", atualizando && "opacity-80")}>
        <EscolhaDeLogo valor={a.logoUrl} nome={a.nome} aoMudar={(v) => editarCurso({ logoUrl: v }, "Logo atualizada.")} />
        <div className="min-w-0 flex-1">
          <TextoEditavel valor={a.nome} aoSalvar={(v) => editarCurso({ nome: v })} className="flex w-fit text-[1.5rem] font-black" rotulo="Nome do curso" />
          <TextoEditavel valor={a.descricao ?? ""} aoSalvar={(v) => editarCurso({ descricao: v })} vazio="Adicionar uma descrição…" className="flex w-fit text-sm text-muted-foreground" rotulo="Descrição" />
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="font-mono">/{a.slug}</span>
            <span className="inline-flex items-center gap-1"><UsersRound className="size-3" />{numero(a.alunos)} alunos</span>
            <span>{numero(todasAsAulas.length)} aulas</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {ehAdmin && (
            <label className="flex items-center gap-2 text-sm font-bold">
              <Interruptor rotulo="Curso no ar" ligado={a.ativo} aoMudar={(v) => editarCurso({ ativo: v }, v ? "Curso no ar para os alunos." : "Curso tirado do ar.")} />
              {a.ativo ? "No ar" : "Fora do ar"}
            </label>
          )}
          <Botao variante="primario" icone={<Plus className="size-4" />} onClick={novaSecao}>Nova seção</Botao>
          {ehAdmin && <Botao variante="fantasma" icone={<Trash2 className="size-4" />} onClick={() => setApagarCurso(true)} aria-label="Apagar curso" />}
        </div>
      </header>

      {comProblema > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 text-sm">
          <span className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-200">
            <AlertTriangle className="size-4" /> {comProblema} {comProblema === 1 ? "aula precisa" : "aulas precisam"} de atenção
          </span>
          <label className="flex items-center gap-2 text-xs font-bold">
            <Interruptor rotulo="Mostrar só aulas com problema" ligado={soProblemas} aoMudar={setSoProblemas} /> Só as com problema
          </label>
          {invisiveis > 0 && (
            <div className="flex w-full flex-wrap items-center justify-between gap-2 border-t border-amber-500/20 pt-2.5">
              <p className="max-w-2xl text-xs text-amber-900 dark:text-amber-100">
                <b>{invisiveis} {invisiveis === 1 ? "aula tem" : "aulas têm"} questões que os alunos não veem:</b> estão gravadas com o nome de etapa errado para a aula.
                O conserto troca só esse nome; o texto, as opções e a resposta ficam iguais. Aulas com rascunho aberto ficam de fora (publicar já conserta).
              </p>
              <Botao tamanho="sm" variante="primario" onClick={consertarEtapas}>Consertar {invisiveis} {invisiveis === 1 ? "aula" : "aulas"}</Botao>
            </div>
          )}
        </div>
      )}

      {grupos.length === 0 ? (
        <Vazio titulo="Curso vazio" icone={<Layers className="size-5" />} acao={<Botao variante="primario" onClick={novaSecao}>Criar a primeira seção</Botao>}>
          Seções agrupam unidades; unidades agrupam aulas.
        </Vazio>
      ) : (
        <div className="space-y-3" onDragEnd={fimDoArraste}>
          {grupos.map((s) => {
            const fechada = fechados.has(s.id);
            return (
              <section
                key={s.id}
                onDragOver={s.semSecao ? sobre("secao", s.id, true) : sobre("secao", s.id, true)}
                onDrop={soltar}
                className={cn("relative rounded-xl border bg-card", linhaDoAlvo(s.id))}
              >
                <div
                  className="flex items-center gap-2 border-b px-3 py-2.5"
                  draggable={!s.semSecao}
                  onDragStart={s.semSecao ? undefined : aoArrastar({ tipo: "secao", id: s.id })}
                  tabIndex={s.semSecao ? undefined : 0}
                  onKeyDown={s.semSecao ? undefined : (e) => moverComTeclado(e, { tipo: "secao", id: s.id }, a.secoes)}
                >
                  {!s.semSecao && <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground/60" aria-hidden />}
                  <button type="button" onClick={() => alternar(s.id)} aria-expanded={!fechada} aria-label={fechada ? "Abrir seção" : "Fechar seção"} className="text-muted-foreground hover:text-foreground">
                    {fechada ? <ChevronRight className="size-4" /> : <ChevronDown className="size-4" />}
                  </button>
                  {s.semSecao ? (
                    <span className="text-sm font-black text-muted-foreground">{s.titulo}</span>
                  ) : (
                    <TextoEditavel valor={s.titulo} aoSalvar={(v) => renomear("secoes", s.id, v)} className="text-sm font-black" rotulo="Nome da seção" />
                  )}
                  {s.nivelamento && <Selo tom="azul">Nivelamento</Selo>}
                  <span className="ml-auto flex items-center gap-1">
                    <span className="mr-2 text-xs text-muted-foreground">{s.unidades.length} {s.unidades.length === 1 ? "unidade" : "unidades"}</span>
                    <Botao tamanho="sm" variante="fantasma" icone={<Plus className="size-3.5" />} onClick={() => novaUnidade(s.id)}>Unidade</Botao>
                    {!s.semSecao && <Botao tamanho="sm" variante="fantasma" icone={<Trash2 className="size-3.5" />} aria-label={`Apagar a seção ${s.titulo}`} onClick={() => apagar("secao", s.id, s.titulo)} />}
                  </span>
                </div>

                {!fechada && (
                  <div className="space-y-2 p-2">
                    {s.unidades.length === 0 && <p className="px-2 py-3 text-xs text-muted-foreground">Nenhuma unidade. Arraste uma para cá ou crie uma nova.</p>}
                    {s.unidades.map((u) => {
                      const aulas = soProblemas ? u.aulas.filter((l) => l.problemas.some((p) => PROBLEMAS[p].grave)) : u.aulas;
                      if (soProblemas && !aulas.length) return null;
                      const fechadaU = fechados.has(u.id);
                      return (
                        <div
                          key={u.id}
                          onDragOver={sobre("unidade", u.id, true)}
                          onDrop={soltar}
                          className={cn("relative rounded-lg border bg-background/60", linhaDoAlvo(u.id))}
                        >
                          <div
                            className="flex items-center gap-2 px-2.5 py-2"
                            draggable
                            onDragStart={aoArrastar({ tipo: "unidade", id: u.id })}
                            tabIndex={0}
                            onKeyDown={(e) => moverComTeclado(e, { tipo: "unidade", id: u.id }, s.unidades)}
                          >
                            <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground/60" aria-hidden />
                            <button type="button" onClick={() => alternar(u.id)} aria-expanded={!fechadaU} aria-label={fechadaU ? "Abrir unidade" : "Fechar unidade"} className="text-muted-foreground hover:text-foreground">
                              {fechadaU ? <ChevronRight className="size-4" /> : <ChevronDown className="size-4" />}
                            </button>
                            <TextoEditavel valor={u.titulo} aoSalvar={(v) => renomear("unidades", u.id, v)} className="text-sm font-bold" rotulo="Nome da unidade" />
                            <span className="ml-auto flex items-center gap-1">
                              <span className="mr-2 text-xs text-muted-foreground">{u.aulas.length} {u.aulas.length === 1 ? "aula" : "aulas"}</span>
                              <Botao tamanho="sm" variante="fantasma" icone={<Plus className="size-3.5" />} onClick={() => novaAula(u.id)}>Aula</Botao>
                              <Botao tamanho="sm" variante="fantasma" icone={<Trash2 className="size-3.5" />} aria-label={`Apagar a unidade ${u.titulo}`} onClick={() => apagar("unidade", u.id, u.titulo)} />
                            </span>
                          </div>
                          {!fechadaU && (
                            <ul className="space-y-1 px-2 pb-2">
                              {aulas.length === 0 && <li className="px-2 py-2 text-xs text-muted-foreground">Nenhuma aula. Arraste uma para cá ou crie uma nova.</li>}
                              {aulas.map((l) => (
                                <LinhaDaAula
                                  key={l.id}
                                  l={l}
                                  className={linhaDoAlvo(l.id)}
                                  aoArrastar={aoArrastar({ tipo: "aula", id: l.id })}
                                  aoPassar={sobre("aula", l.id, false)}
                                  aoSoltar={soltar}
                                  aoTeclar={(e) => moverComTeclado(e, { tipo: "aula", id: l.id }, u.aulas)}
                                  aoDuplicar={() => duplicar(l.id)}
                                  aoApagar={() => apagar("aula", l.id, l.titulo)}
                                />
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
          <p className="text-center text-xs text-muted-foreground">Arraste pela alça para reordenar. Com uma linha em foco, <b>Alt + ↑/↓</b> faz o mesmo.</p>
        </div>
      )}

      <ConfirmarDigitando
        aberto={apagarCurso}
        aoFechar={() => setApagarCurso(false)}
        titulo="Apagar o curso inteiro"
        palavra={a.nome}
        rotuloDoBotao="Apagar o curso"
        aoConfirmar={async () => {
          await pedir(`/admin/conteudo/cursos/${cursoId}/apagar`, { method: "POST", json: { confirmacao: a.nome } });
          invalidar("/admin/conteudo/cursos");
          avisar("Curso apagado.");
          router.push("/admin/conteudo");
        }}
      >
        Apaga o curso <b className="text-foreground">{a.nome}</b> com todas as seções, unidades, aulas e o progresso de {numero(a.alunos)} alunos nele. Não dá para desfazer.
      </ConfirmarDigitando>
    </Pagina>
  );
}

function LinhaDaAula({
  l, className, aoArrastar, aoPassar, aoSoltar, aoTeclar, aoDuplicar, aoApagar,
}: {
  l: AulaDaArvore; className: string;
  aoArrastar: (e: DragEvent) => void; aoPassar: (e: DragEvent) => void; aoSoltar: (e: DragEvent) => void; aoTeclar: (e: KeyboardEvent) => void;
  aoDuplicar: () => void; aoApagar: () => void;
}) {
  const graves = l.problemas.filter((p) => PROBLEMAS[p].grave);
  const leves = l.problemas.filter((p) => !PROBLEMAS[p].grave);
  return (
    <li
      draggable
      onDragStart={aoArrastar}
      onDragOver={aoPassar}
      onDrop={aoSoltar}
      tabIndex={0}
      onKeyDown={aoTeclar}
      className={cn("group relative flex flex-wrap items-center gap-2 rounded-md px-2 py-1.5 outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-primary/40", className)}
    >
      <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground/50" aria-hidden />
      <Link href={`/admin/conteudo/aula/${l.id}`} className="min-w-0 flex-1 truncate text-sm font-bold hover:text-primary">{l.titulo}</Link>
      <span className="flex flex-wrap items-center gap-1">
        {!l.publicada && <Selo tom="neutro">Não publicada</Selo>}
        {l.temRascunho && l.publicada && <Selo tom="roxo" icone={<FilePenLine className="size-3" />}>Rascunho {relativo(l.rascunhoSalvoEm)}</Selo>}
        {graves.map((p) => <Selo key={p} tom="vermelho" icone={<AlertTriangle className="size-3" />}><span title={PROBLEMAS[p].explicacao}>{PROBLEMAS[p].texto}</span></Selo>)}
        {leves.map((p) => <Selo key={p}><span title={PROBLEMAS[p].explicacao}>{PROBLEMAS[p].texto}</span></Selo>)}
        <span className="ml-1 hidden text-xs tabular-nums text-muted-foreground sm:inline" title="Questões por etapa">
          {l.porEtapa.map((n, i) => <Contagem key={i} n={n} />)} · {l.xp} XP · {numero(l.alunos)} {l.alunos === 1 ? "aluno" : "alunos"}
        </span>
      </span>
      <span className="flex items-center opacity-60 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <Link href={`/admin/conteudo/aula/${l.id}`} aria-label={`Editar ${l.titulo}`} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-primary"><FilePenLine className="size-3.5" /></Link>
        <button type="button" onClick={aoDuplicar} aria-label={`Duplicar ${l.titulo}`} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground"><Copy className="size-3.5" /></button>
        <button type="button" onClick={aoApagar} aria-label={`Apagar ${l.titulo}`} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-rose-500"><Trash2 className="size-3.5" /></button>
      </span>
    </li>
  );
}

function Contagem({ n }: { n: number }): ReactNode {
  return <span className={cn("mr-0.5 inline-block min-w-4 rounded px-1 text-center font-bold", n === 0 ? "bg-rose-500/15 text-rose-600 dark:text-rose-300" : "bg-muted")}>{n}</span>;
}
