"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DropdownMenu } from "radix-ui";
import {
  AlertTriangle, ArrowLeft, Check, ClipboardPaste, CloudOff, Download, FileUp, Keyboard, Loader2, MoreHorizontal, Play, RotateCcw, Rocket, Undo2,
} from "lucide-react";
import { Botao, Erro, Esqueleto, Atalho } from "../ui";
import { Dialogo } from "../dialogo";
import { avisar } from "../avisos";
import { Trilho } from "./trilho";
import { Palco } from "./palco";
import { Painel } from "./painel";
import { Previa } from "./previa";
import { ColarPerguntas } from "./colar";
import { arquivoDaAula, conferir, converterTipo, lerArquivoDaAula, novaQuestao, novoId, ordenadas } from "./regras";
import { ErroDaApi, invalidar, pedir, salvarArquivo, useDados } from "@/lib/admin/api";
import { relativo } from "@/lib/admin/formato";
import { cn } from "@/lib/utils";
import type { AulaNoEditor, QuestaoDoRascunho, RascunhoDaAula, TipoDeQuestao } from "@/lib/admin/tipos";

export type Selecao = { tipo: "introducao" } | { tipo: "questao"; id: string };
type Salvamento = "salvo" | "pendente" | "salvando" | "erro" | "conflito";

/**
 * O editor de aula.
 *
 * Três partes, como nas ferramentas de montar quiz: à esquerda as questões em
 * miniatura, por etapa; no meio a questão do jeito que o aluno vê, editável no
 * próprio lugar; à direita as configurações da questão e da aula, e a
 * conferência do que falta para publicar.
 *
 * Tudo o que se faz aqui vai para o rascunho, salvo sozinho poucos instantes
 * depois de cada mudança. Os alunos só recebem a aula quando alguém aperta
 * "Publicar" — e o servidor confere tudo de novo antes de aceitar.
 */
export function EditorDeAula({ aulaId }: { aulaId: string }) {
  const { dados, erro, recarregar } = useDados<AulaNoEditor>(`/admin/conteudo/aulas/${aulaId}/editor`, { velhoDepoisDe: Infinity });
  const [versao, setVersao] = useState(0);

  if (erro && !dados) return <div className="p-6"><Erro tentarDeNovo={recarregar}>{erro}</Erro></div>;
  if (!dados) return <div className="p-6"><Esqueleto linhas={10} /></div>;
  // A chave reinicia o editor quando a aula volta do servidor inteira (depois
  // de publicar, descartar ou resolver um conflito).
  return (
    <Editor
      key={`${aulaId}-${versao}`}
      inicial={dados}
      aoRecomecar={async () => {
        invalidar(`/admin/conteudo/aulas/${aulaId}/editor`);
        await recarregar();
        setVersao((v) => v + 1);
      }}
    />
  );
}

function Editor({ inicial, aoRecomecar }: { inicial: AulaNoEditor; aoRecomecar: () => Promise<void> }) {
  const router = useRouter();
  const params = useSearchParams();
  const aula = inicial.aula;
  const [rascunho, setRascunhoBruto] = useState<RascunhoDaAula>(inicial.rascunho);
  const [selecao, setSelecao] = useState<Selecao>(() => {
    const pedida = params.get("questao");
    if (pedida && inicial.rascunho.questoes.some((q) => q.id === pedida)) return { tipo: "questao", id: pedida };
    const primeira = ordenadas(inicial.rascunho)[0];
    return primeira ? { tipo: "questao", id: primeira.id } : { tipo: "introducao" };
  });
  const [temRascunho, setTemRascunho] = useState(inicial.temRascunho);
  const [estado, setEstado] = useState<Salvamento>("salvo");
  const [salvoEm, setSalvoEm] = useState<string | null>(inicial.rascunhoSalvoEm);
  const [previa, setPrevia] = useState(false);
  const [colar, setColar] = useState(false);
  const [ajuda, setAjuda] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [, forcarRelogio] = useState(0);

  // ── Histórico (Ctrl+Z) ──
  const passado = useRef<RascunhoDaAula[]>([]);
  const futuro = useRef<RascunhoDaAula[]>([]);
  const ultimoTexto = useRef<{ chave: string; quando: number } | null>(null);
  const [podeDesfazer, setPodeDesfazer] = useState(false);

  /**
   * Toda mudança passa por aqui. Digitar no mesmo campo seguidamente vira um
   * passo só no histórico (senão o Ctrl+Z desfaria letra por letra); qualquer
   * outra mudança é um passo próprio.
   */
  // O rascunho mais recente, sempre à mão: as mudanças em sequência (duas no
  // mesmo clique) partem dele, e não do valor do último render.
  const atual = useRef(inicial.rascunho);

  const trocar = useCallback((novo: RascunhoDaAula) => {
    atual.current = novo;
    setRascunhoBruto(novo);
    setEstado("pendente");
  }, []);

  const mudar = useCallback((f: (r: RascunhoDaAula) => RascunhoDaAula, campoDeTexto?: string) => {
    const antes = atual.current;
    const agora = Date.now();
    const juntar = campoDeTexto && ultimoTexto.current?.chave === campoDeTexto && agora - ultimoTexto.current.quando < 1200;
    if (!juntar) {
      passado.current = [...passado.current.slice(-79), antes];
      futuro.current = [];
    }
    ultimoTexto.current = campoDeTexto ? { chave: campoDeTexto, quando: agora } : null;
    trocar(f(antes));
    setPodeDesfazer(true);
  }, [trocar]);

  const desfazer = useCallback(() => {
    const anterior = passado.current.pop();
    if (!anterior) return;
    futuro.current.push(atual.current);
    ultimoTexto.current = null;
    trocar(anterior);
    setPodeDesfazer(passado.current.length > 0);
  }, [trocar]);

  const refazer = useCallback(() => {
    const proximo = futuro.current.pop();
    if (!proximo) return;
    passado.current.push(atual.current);
    trocar(proximo);
    setPodeDesfazer(true);
  }, [trocar]);

  // ── Salvamento automático ──
  const base = useRef<string | null>(inicial.rascunhoSalvoEm);
  const ultimoEnviado = useRef<RascunhoDaAula>(inicial.rascunho);
  const salvando = useRef<Promise<boolean> | null>(null);

  const salvar = useCallback(async (): Promise<boolean> => {
    if (salvando.current) await salvando.current;
    const enviar = atual.current;
    if (enviar === ultimoEnviado.current) return true;
    const tarefa = (async () => {
      setEstado("salvando");
      try {
        const r = await pedir<{ salvoEm: string }>(`/admin/conteudo/aulas/${aula.id}/rascunho`, { method: "PUT", json: { rascunho: enviar, base: base.current } });
        base.current = r.salvoEm;
        ultimoEnviado.current = enviar;
        setSalvoEm(r.salvoEm);
        setTemRascunho(true);
        setEstado(atual.current === enviar ? "salvo" : "pendente");
        return true;
      } catch (e) {
        setEstado(e instanceof ErroDaApi && e.status === 409 ? "conflito" : "erro");
        return false;
      } finally {
        salvando.current = null;
      }
    })();
    salvando.current = tarefa;
    return tarefa;
  }, [aula.id]);

  useEffect(() => {
    if (estado !== "pendente") return;
    const id = setTimeout(() => void salvar(), 900);
    return () => clearTimeout(id);
  }, [rascunho, estado, salvar]);

  // "Salvo há 3 s" anda sozinho.
  useEffect(() => {
    const id = setInterval(() => forcarRelogio((n) => n + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  // Sair com mudança não salva: o navegador pergunta antes.
  useEffect(() => {
    const segurar = (e: BeforeUnloadEvent) => {
      if (estado === "pendente" || estado === "salvando" || estado === "erro") e.preventDefault();
    };
    window.addEventListener("beforeunload", segurar);
    return () => window.removeEventListener("beforeunload", segurar);
  }, [estado]);

  // ── Ações ──
  const problemas = useMemo(() => conferir(rascunho), [rascunho]);
  const erros = problemas.filter((p) => p.nivel === "erro");
  const questaoAtual = selecao.tipo === "questao" ? rascunho.questoes.find((q) => q.id === selecao.id) ?? null : null;
  const etapaAtual = questaoAtual?.etapa ?? 1;

  const adicionar = useCallback((tipo: TipoDeQuestao, etapa: number) => {
    const q = novaQuestao(tipo, etapa);
    mudar((r) => {
      // Entra logo depois da questão aberta, se for da mesma etapa; senão, no fim da etapa.
      const lista = [...r.questoes];
      const depoisDe = selecao.tipo === "questao" ? lista.findIndex((x) => x.id === selecao.id && x.etapa === etapa) : -1;
      if (depoisDe >= 0) lista.splice(depoisDe + 1, 0, q);
      else lista.push(q);
      return { ...r, questoes: lista };
    });
    setSelecao({ tipo: "questao", id: q.id });
  }, [mudar, selecao]);

  const duplicar = useCallback((id: string) => {
    const copia = { ...structuredClone(rascunho.questoes.find((q) => q.id === id)!), id: novoId() };
    mudar((r) => {
      const lista = [...r.questoes];
      lista.splice(lista.findIndex((q) => q.id === id) + 1, 0, copia);
      return { ...r, questoes: lista };
    });
    setSelecao({ tipo: "questao", id: copia.id });
  }, [mudar, rascunho.questoes]);

  const apagar = useCallback((id: string) => {
    const lista = ordenadas(rascunho);
    const i = lista.findIndex((q) => q.id === id);
    const vizinha = lista[i + 1] ?? lista[i - 1];
    mudar((r) => ({ ...r, questoes: r.questoes.filter((q) => q.id !== id) }));
    setSelecao(vizinha ? { tipo: "questao", id: vizinha.id } : { tipo: "introducao" });
    avisar("Questão apagada.", { desfazer: () => desfazer() });
  }, [mudar, rascunho, desfazer]);

  const alterarQuestao = useCallback((id: string, f: (q: QuestaoDoRascunho) => QuestaoDoRascunho, campoDeTexto?: string) => {
    mudar((r) => ({ ...r, questoes: r.questoes.map((q) => (q.id === id ? f(q) : q)) }), campoDeTexto ? `${id}:${campoDeTexto}` : undefined);
  }, [mudar]);

  /** Move uma questão para junto de outra (ou para o fim de uma etapa), mudando de etapa se preciso. */
  const mover = useCallback((id: string, destino: { antesDe?: string; etapa: number }) => {
    mudar((r) => {
      const lista = r.questoes.filter((q) => q.id !== id);
      const q = { ...r.questoes.find((x) => x.id === id)!, etapa: destino.etapa };
      let pos = destino.antesDe ? lista.findIndex((x) => x.id === destino.antesDe) : -1;
      if (pos < 0) {
        const ultimaDaEtapa = lista.map((x, i) => ({ x, i })).filter(({ x }) => x.etapa === destino.etapa).pop();
        pos = ultimaDaEtapa ? ultimaDaEtapa.i + 1 : lista.length;
      }
      lista.splice(pos, 0, q);
      return { ...r, questoes: lista };
    });
  }, [mudar]);

  const navegar = useCallback((passo: number) => {
    const lista = ordenadas(rascunho);
    if (selecao.tipo === "introducao") {
      if (passo > 0 && lista[0]) setSelecao({ tipo: "questao", id: lista[0].id });
      return;
    }
    const i = lista.findIndex((q) => q.id === selecao.id);
    const j = i + passo;
    if (j < 0) setSelecao({ tipo: "introducao" });
    else if (lista[j]) setSelecao({ tipo: "questao", id: lista[j].id });
  }, [rascunho, selecao]);

  const publicar = async () => {
    setPublicando(true);
    try {
      if (!(await salvar())) throw new Error("Não foi possível salvar antes de publicar.");
      await pedir(`/admin/conteudo/aulas/${aula.id}/publicar`, { method: "POST" });
      invalidar(`/admin/conteudo/cursos/${aula.cursoId}/arvore`);
      invalidar("/admin/conteudo/cursos");
      avisar("Aula publicada. Os alunos já recebem esta versão.");
      await aoRecomecar();
    } catch (e) {
      avisar(e instanceof Error ? e.message : "Não foi possível publicar.", { tom: "erro" });
      setPublicando(false);
    }
  };

  const descartar = async () => {
    if (!window.confirm("Descartar todas as alterações não publicadas? A aula volta a ser a que os alunos veem.")) return;
    try {
      await pedir(`/admin/conteudo/aulas/${aula.id}/rascunho`, { method: "DELETE" });
      invalidar(`/admin/conteudo/cursos/${aula.cursoId}/arvore`);
      avisar("Rascunho descartado.");
      await aoRecomecar();
    } catch (e) {
      avisar(e instanceof Error ? e.message : "Não foi possível descartar.", { tom: "erro" });
    }
  };

  const importar = () => {
    const entrada = document.createElement("input");
    entrada.type = "file";
    entrada.accept = "application/json,.json";
    entrada.onchange = async () => {
      const arquivo = entrada.files?.[0];
      if (!arquivo) return;
      try {
        const nova = lerArquivoDaAula(await arquivo.text());
        if (!window.confirm(`Trocar o conteúdo desta aula por "${nova.titulo}" (${nova.questoes.length} questões)? Dá para desfazer com Ctrl+Z.`)) return;
        mudar(() => nova);
        const primeira = ordenadas(nova)[0];
        setSelecao(primeira ? { tipo: "questao", id: primeira.id } : { tipo: "introducao" });
        avisar("Aula importada para o rascunho.");
      } catch (e) {
        avisar(e instanceof Error ? e.message : "Não foi possível importar.", { tom: "erro" });
      }
    };
    entrada.click();
  };

  // ── Teclado ──
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null;
      const digitando = Boolean(alvo?.closest("input, textarea, select, [contenteditable=true]"));
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void salvar();
        return;
      }
      if (ctrl && e.key === "Enter") {
        e.preventDefault();
        setPrevia(true);
        return;
      }
      if (e.altKey && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
        e.preventDefault();
        navegar(e.key === "ArrowDown" ? 1 : -1);
        return;
      }
      if (ctrl && e.key.toLowerCase() === "d" && questaoAtual) {
        e.preventDefault();
        duplicar(questaoAtual.id);
        return;
      }
      // Alt+1…6 marca a alternativa certa mesmo com o cursor num campo.
      if (e.altKey && /^[1-6]$/.test(e.key) && questaoAtual) {
        e.preventDefault();
        const i = Number(e.key) - 1;
        if (questaoAtual.tipo === "MULTIPLE_CHOICE" && i < (questaoAtual.alternativas?.length ?? 0)) alterarQuestao(questaoAtual.id, (q) => ({ ...q, correta: i }));
        if (questaoAtual.tipo === "FILL_BLANK" && i < (questaoAtual.blocos?.length ?? 0)) alterarQuestao(questaoAtual.id, (q) => ({ ...q, correta: i }));
        if (questaoAtual.tipo === "TRUE_FALSE" && i < 2) alterarQuestao(questaoAtual.id, (q) => ({ ...q, verdadeiro: i === 0 }));
        return;
      }
      if (digitando) return;
      if (ctrl && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) refazer();
        else desfazer();
        return;
      }
      if (ctrl && e.key.toLowerCase() === "y") {
        e.preventDefault();
        refazer();
        return;
      }
      if (e.key === "n" && !ctrl) {
        e.preventDefault();
        adicionar("MULTIPLE_CHOICE", etapaAtual);
      }
      if ((e.key === "Delete" || e.key === "Backspace") && questaoAtual) {
        e.preventDefault();
        apagar(questaoAtual.id);
      }
      if (e.key === "?") setAjuda(true);
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [adicionar, alterarQuestao, apagar, desfazer, duplicar, etapaAtual, navegar, questaoAtual, refazer, salvar]);

  const propsDoPainel = {
    rascunho,
    questao: questaoAtual,
    problemas,
    desempenho: questaoAtual ? inicial.desempenho[questaoAtual.id] : undefined,
    aoMudar: mudar,
    aoTrocarTipo: (id: string, tipo: TipoDeQuestao) => alterarQuestao(id, (q) => converterTipo(q, tipo)),
    aoMudarEtapa: (id: string, etapa: number) => mover(id, { etapa }),
    aoDuplicar: duplicar,
    aoApagar: apagar,
    // Problema de uma questão leva até ela; os da introdução, até a introdução.
    aoIrPara: (p: { questaoId?: string; etapa?: number }) => {
      if (p.questaoId) setSelecao({ tipo: "questao", id: p.questaoId });
      else if (p.etapa === undefined) setSelecao({ tipo: "introducao" });
    },
  };

  const menuItem = "flex cursor-pointer select-none items-center gap-2 rounded-md px-2.5 py-2 text-sm outline-none data-[highlighted]:bg-muted";

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* ── Barra de cima ── */}
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b bg-card px-3 py-2">
        <Link href={`/admin/conteudo/${aula.cursoId}`} className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Voltar ao curso">
          <ArrowLeft className="size-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.7rem] font-bold text-muted-foreground">{aula.curso}{aula.secao ? ` › ${aula.secao}` : ""} › {aula.unidade}</p>
          <input
            value={rascunho.titulo}
            onChange={(e) => mudar((r) => ({ ...r, titulo: e.target.value }), "titulo")}
            aria-label="Título da aula"
            placeholder="Título da aula"
            className="w-full min-w-0 truncate rounded-md bg-transparent text-base font-black outline-none placeholder:text-muted-foreground hover:bg-muted/50 focus:bg-muted/50"
          />
        </div>
        <EstadoDoSalvamento estado={estado} salvoEm={salvoEm} temRascunho={temRascunho} publicadaEm={aula.publicadaEm} aoTentar={() => void salvar()} />
        <Botao variante="fantasma" tamanho="sm" icone={<Undo2 className="size-4" />} disabled={!podeDesfazer} onClick={desfazer} title="Desfazer (Ctrl+Z)" aria-label="Desfazer" />
        <Botao tamanho="sm" icone={<Play className="size-4" />} onClick={() => setPrevia(true)} title="Jogar como aluno (Ctrl+Enter)">Jogar como aluno</Botao>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Botao tamanho="sm" variante="fantasma" icone={<MoreHorizontal className="size-4" />} aria-label="Mais opções" />
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content align="end" sideOffset={6} className="zc-adm-entra z-50 min-w-56 rounded-xl border bg-popover p-1 shadow-xl">
              <DropdownMenu.Item className={menuItem} onSelect={() => setColar(true)}><ClipboardPaste className="size-4" /> Colar perguntas em texto</DropdownMenu.Item>
              <DropdownMenu.Item className={menuItem} onSelect={() => salvarArquivo(new Blob([arquivoDaAula(rascunho)], { type: "application/json" }), `aula-${rascunho.titulo.trim().toLowerCase().replace(/\W+/g, "-") || aula.id}.json`)}>
                <Download className="size-4" /> Exportar aula (arquivo)
              </DropdownMenu.Item>
              <DropdownMenu.Item className={menuItem} onSelect={importar}><FileUp className="size-4" /> Importar aula (arquivo)</DropdownMenu.Item>
              <DropdownMenu.Item className={menuItem} onSelect={async () => {
                try {
                  const r = await pedir<{ id: string }>(`/admin/conteudo/aulas/${aula.id}/duplicar`, { method: "POST" });
                  invalidar(`/admin/conteudo/cursos/${aula.cursoId}/arvore`);
                  avisar("Aula duplicada.");
                  router.push(`/admin/conteudo/aula/${r.id}`);
                } catch (e) {
                  avisar(e instanceof Error ? e.message : "Não foi possível duplicar.", { tom: "erro" });
                }
              }}>
                <RotateCcw className="size-4" /> Duplicar a aula inteira
              </DropdownMenu.Item>
              <DropdownMenu.Item className={menuItem} onSelect={() => setAjuda(true)}><Keyboard className="size-4" /> Atalhos do editor</DropdownMenu.Item>
              {temRascunho && aula.publicadaEm && (
                <>
                  <DropdownMenu.Separator className="my-1 h-px bg-border" />
                  <DropdownMenu.Item className={cn(menuItem, "text-rose-600 dark:text-rose-400")} onSelect={descartar}><RotateCcw className="size-4" /> Descartar alterações</DropdownMenu.Item>
                </>
              )}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
        <Botao
          variante="primario"
          tamanho="sm"
          icone={<Rocket className="size-4" />}
          carregando={publicando}
          disabled={erros.length > 0 || (!temRascunho && estado === "salvo")}
          onClick={publicar}
          title={erros.length ? `Resolva ${erros.length} ${erros.length === 1 ? "problema" : "problemas"} antes` : "Publicar para os alunos"}
        >
          {erros.length ? `${erros.length} a resolver` : aula.publicadaEm ? "Publicar alterações" : "Publicar"}
        </Botao>
      </header>

      {estado === "conflito" && (
        <div className="flex flex-wrap items-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm">
          <AlertTriangle className="size-4 text-amber-600" />
          <span className="flex-1 font-bold">Esta aula foi salva em outra aba ou por outra pessoa enquanto você editava.</span>
          <Botao tamanho="sm" onClick={() => void aoRecomecar()}>Carregar a versão salva</Botao>
          <Botao
            tamanho="sm"
            variante="primario"
            onClick={async () => {
              const r = await pedir<AulaNoEditor>(`/admin/conteudo/aulas/${aula.id}/editor`).catch(() => null);
              base.current = r?.rascunhoSalvoEm ?? null;
              ultimoEnviado.current = { ...atual.current };
              setEstado("pendente");
            }}
          >
            Manter a minha
          </Botao>
        </div>
      )}

      {/* ── As três partes ── */}
      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[240px_1fr] xl:grid-cols-[256px_1fr_300px]">
        <Trilho
          rascunho={rascunho}
          selecao={selecao}
          problemas={problemas}
          desempenho={inicial.desempenho}
          aoSelecionar={setSelecao}
          aoAdicionar={adicionar}
          aoMover={mover}
          aoColar={() => setColar(true)}
        />
        <Palco
          rascunho={rascunho}
          selecao={selecao}
          problemas={problemas}
          aoMudarQuestao={alterarQuestao}
          aoMudar={mudar}
          rodape={<Painel className="mt-8 flex rounded-xl border xl:hidden" {...propsDoPainel} />}
        />
        <Painel className="hidden xl:flex" {...propsDoPainel} />
      </div>

      {previa && <Previa aulaId={aula.id} rascunho={rascunho} etapaInicial={etapaAtual} aoFechar={() => setPrevia(false)} />}
      {colar && (
        <ColarPerguntas
          etapas={rascunho.etapas}
          etapaInicial={etapaAtual}
          aoFechar={() => setColar(false)}
          aoAdicionar={(questoes) => {
            mudar((r) => ({ ...r, questoes: [...r.questoes, ...questoes] }));
            if (questoes[0]) setSelecao({ tipo: "questao", id: questoes[0].id });
            avisar(`${questoes.length} ${questoes.length === 1 ? "questão adicionada" : "questões adicionadas"}.`);
            setColar(false);
          }}
        />
      )}
      <Dialogo aberto={ajuda} aoFechar={() => setAjuda(false)} titulo="Atalhos do editor">
        <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2.5 text-sm">
          <dt><Atalho>N</Atalho></dt><dd>Nova questão de alternativa (na etapa aberta)</dd>
          <dt><Atalho>Alt</Atalho> <Atalho>↑</Atalho><Atalho>↓</Atalho></dt><dd>Questão anterior ou seguinte</dd>
          <dt><Atalho>Alt</Atalho> <Atalho>1</Atalho>…<Atalho>6</Atalho></dt><dd>Marcar a alternativa (ou bloco) certa</dd>
          <dt><Atalho>Ctrl</Atalho> <Atalho>D</Atalho></dt><dd>Duplicar a questão</dd>
          <dt><Atalho>Delete</Atalho></dt><dd>Apagar a questão (fora de um campo)</dd>
          <dt><Atalho>Ctrl</Atalho> <Atalho>Z</Atalho></dt><dd>Desfazer · <Atalho>Ctrl</Atalho> <Atalho>Y</Atalho> refazer</dd>
          <dt><Atalho>Ctrl</Atalho> <Atalho>S</Atalho></dt><dd>Salvar agora (o salvamento já é automático)</dd>
          <dt><Atalho>Ctrl</Atalho> <Atalho>Enter</Atalho></dt><dd>Jogar como aluno</dd>
        </dl>
      </Dialogo>
    </div>
  );
}

function EstadoDoSalvamento({ estado, salvoEm, temRascunho, publicadaEm, aoTentar }: { estado: Salvamento; salvoEm: string | null; temRascunho: boolean; publicadaEm: string | null; aoTentar: () => void }) {
  if (estado === "salvando" || estado === "pendente") {
    return <span className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground"><Loader2 className="size-3.5 animate-spin" /> Salvando…</span>;
  }
  if (estado === "erro") {
    return (
      <button type="button" onClick={aoTentar} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold text-rose-600 hover:bg-rose-500/10 dark:text-rose-400">
        <CloudOff className="size-3.5" /> Não salvou · tentar de novo
      </button>
    );
  }
  if (estado === "conflito") return <span className="text-xs font-bold text-amber-600">Conflito</span>;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground" title={temRascunho ? "Salvo no rascunho; ainda não publicado" : "Igual ao que os alunos veem"}>
      <Check className="size-3.5 text-emerald-500" />
      {temRascunho ? `Rascunho salvo ${relativo(salvoEm)}` : publicadaEm ? `Publicada ${relativo(publicadaEm)}` : "Salvo"}
    </span>
  );
}
