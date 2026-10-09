"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle, ArrowDown, ArrowUp, BadgeCheck, Bookmark, ChevronLeft, ChevronRight, Code2, Crown, Download, Filter, Flame, Gem, Search, Sparkles, X,
} from "lucide-react";
import { Pagina } from "../shell";
import { AvatarPequeno, Botao, Cabecalho, Cartao, Entrada, Erro, Escolha, Esqueleto, Rotulo, Selo, Vazio } from "../ui";
import { avisar } from "../avisos";
import { Dialogo, perguntar } from "../dialogo";
import { AcoesEmLote } from "./lote";
import { baixar, invalidar, pedir, query, useDados } from "@/lib/admin/api";
import { data, numero, relativo } from "@/lib/admin/formato";
import { cn } from "@/lib/utils";
import type { Alerta, PaginaDePessoas, PessoaDaLista, Segmento } from "@/lib/admin/tipos";

/** Os filtros que a lista entende. Ficam na URL: o link de uma busca leva à mesma busca. */
const CAMPOS = ["busca", "status", "papel", "plano", "curso", "faixa", "semEstudarDias", "cadastroDe", "cadastroAte", "origem", "selo", "ordem", "direcao", "pagina"] as const;
type Campo = (typeof CAMPOS)[number];
type Filtros = Partial<Record<Campo, string>>;

const ROTULOS: Partial<Record<Campo, Record<string, string>>> = {
  status: { ativos: "Ativas", bloqueados: "Bloqueadas", suspensos: "Suspensas" },
  papel: { USER: "Aluno", PROFESSOR: "Professor", ADMIN: "Administrador" },
  plano: { pro: "PRO pagante", teste: "Em teste", cortesia: "Cortesia", gratis: "Grátis" },
  faixa: { nenhuma: "Sem ofensiva", azul: "Chama azul", ciano: "Chama ciano", dourada: "Chama dourada" },
  selo: { dev: "Desenvolvedor", tester: "Pioneiro", verificado: "Verificado" },
};

export function ListaDePessoas() {
  const router = useRouter();
  const caminho = usePathname();
  const params = useSearchParams();
  const filtros: Filtros = useMemo(() => Object.fromEntries(CAMPOS.map((c) => [c, params.get(c) ?? ""]).filter(([, v]) => v)), [params]);

  const [textoBusca, setTextoBusca] = useState(filtros.busca ?? "");
  const relogioDaBusca = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [painelFiltros, setPainelFiltros] = useState(false);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [lote, setLote] = useState(false);
  const [exportando, setExportando] = useState(false);

  const mudar = (novos: Filtros, manterPagina = false) => {
    const juntos = { ...filtros, ...novos };
    if (!manterPagina) delete juntos.pagina;
    const limpos = Object.fromEntries(Object.entries(juntos).filter(([, v]) => v));
    router.replace(`${caminho}${query(limpos)}`, { scroll: false });
    setSelecionados(new Set());
  };

  // A busca digitada só vira filtro depois de uma pausa: sem isto, cada letra
  // seria um pedido ao servidor. Na hora de aplicar, lê a URL do momento — os
  // outros filtros podem ter mudado durante a pausa.
  const digitar = (valor: string) => {
    setTextoBusca(valor);
    if (relogioDaBusca.current) clearTimeout(relogioDaBusca.current);
    relogioDaBusca.current = setTimeout(() => {
      const atual = new URLSearchParams(window.location.search);
      if (valor) atual.set("busca", valor);
      else atual.delete("busca");
      atual.delete("pagina");
      const q = atual.toString();
      router.replace(`${caminho}${q ? `?${q}` : ""}`, { scroll: false });
    }, 300);
  };

  const endereco = `/admin/pessoas${query({ ...filtros, porPagina: 25 })}`;
  const { dados, erro, carregando, atualizando, recarregar } = useDados<PaginaDePessoas>(endereco, { velhoDepoisDe: 10_000 });
  const opcoes = useDados<{ cursos: { id: string; name: string }[]; origens: { slug: string; label: string }[] }>("/admin/pessoas/opcoes");
  const segmentos = useDados<Segmento[]>("/admin/segmentos");
  const alertas = useDados<Alerta[]>("/admin/pessoas/alertas");

  const ordem = filtros.ordem ?? "cadastro";
  const direcao = filtros.direcao ?? "desc";
  const ordenar = (campo: string) => mudar({ ordem: campo, direcao: ordem === campo && direcao === "desc" ? "asc" : "desc" });

  const ativos = Object.entries(filtros).filter(([c]) => !["busca", "ordem", "direcao", "pagina"].includes(c));
  const pagina = dados?.pagina ?? 1;

  const todosDaPagina = dados?.itens.map((p) => p.id) ?? [];
  const todosMarcados = todosDaPagina.length > 0 && todosDaPagina.every((id) => selecionados.has(id));

  const [nomeDoSegmento, setNomeDoSegmento] = useState<string | null>(null);
  const salvarSegmento = async () => {
    const nome = nomeDoSegmento?.trim();
    if (!nome) return;
    const { pagina: _p, ...semPagina } = filtros;
    try {
      await pedir("/admin/segmentos", { method: "POST", json: { nome, filtros: semPagina } });
      invalidar("/admin/segmentos");
      avisar("Segmento salvo.");
      setNomeDoSegmento(null);
    } catch (e) {
      avisar(e instanceof Error ? e.message : "Não foi possível salvar.", { tom: "erro" });
    }
  };

  const apagarSegmento = async (s: Segmento) => {
    if (!(await perguntar({ titulo: `Apagar o segmento "${s.name}"?`, texto: "Só o atalho some; as pessoas e os filtros continuam como estão.", sim: "Apagar", perigoso: true }))) return;
    await pedir(`/admin/segmentos/${s.id}`, { method: "DELETE" }).catch((e: unknown) => avisar(e instanceof Error ? e.message : "Não foi possível apagar.", { tom: "erro" }));
    invalidar("/admin/segmentos");
  };

  return (
    <Pagina larga>
      <Cabecalho
        titulo="Pessoas"
        descricao={dados ? `${numero(dados.total)} ${dados.total === 1 ? "conta encontrada" : "contas encontradas"}` : "Todas as contas do ZulCode"}
        acoes={
          <>
            <Botao
              icone={<Download className="size-4" />}
              carregando={exportando}
              onClick={async () => {
                setExportando(true);
                try {
                  await baixar(`/admin/pessoas/exportar${query(filtros)}`, `pessoas-zulcode-${new Date().toISOString().slice(0, 10)}.csv`);
                } catch (e) {
                  avisar(e instanceof Error ? e.message : "Não foi possível exportar.", { tom: "erro" });
                } finally {
                  setExportando(false);
                }
              }}
            >
              Exportar planilha
            </Botao>
          </>
        }
      />

      {/* ── Alertas ── */}
      {alertas.dados && alertas.dados.length > 0 && (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-black text-amber-700 dark:text-amber-300">
            <AlertTriangle className="size-4" /> {alertas.dados.length} {alertas.dados.length === 1 ? "conta pede" : "contas pedem"} uma olhada
          </p>
          <ul className="flex flex-wrap gap-2">
            {alertas.dados.slice(0, 8).map((a) => (
              <li key={`${a.tipo}-${a.pessoa.id}`}>
                <Link href={`/admin/pessoas/${a.pessoa.id}`} className="flex items-center gap-2 rounded-lg border bg-card px-2.5 py-1.5 text-xs hover:border-amber-500/50">
                  <AvatarPequeno id={a.pessoa.avatarId} className="size-6 rounded-md text-[0.7rem]" />
                  <span><b>{a.pessoa.name}</b> <span className="text-muted-foreground">· {a.texto}</span></span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Busca, filtros e segmentos ── */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Entrada
            data-busca-da-pagina
            value={textoBusca}
            onChange={(e) => digitar(e.target.value)}
            placeholder="Nome, e-mail, código ou id…  ( / )"
            className="pl-8"
            aria-label="Buscar pessoas"
          />
        </div>
        <Botao icone={<Filter className="size-4" />} onClick={() => setPainelFiltros((v) => !v)} aria-expanded={painelFiltros}>
          Filtros{ativos.length ? ` (${ativos.length})` : ""}
        </Botao>
        {ativos.length > 0 && <Botao variante="fantasma" icone={<Bookmark className="size-4" />} onClick={() => setNomeDoSegmento("")}>Salvar como segmento</Botao>}
      </div>

      {segmentos.dados && segmentos.dados.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-muted-foreground">Segmentos:</span>
          {segmentos.dados.map((s) => (
            <span key={s.id} className="group inline-flex items-center rounded-lg border bg-card text-xs font-bold">
              <button type="button" onClick={() => { setTextoBusca(s.filters.busca ?? ""); router.replace(`${caminho}${query(s.filters)}`); }} className="px-2.5 py-1 hover:text-primary">
                {s.name}
              </button>
              <button type="button" aria-label={`Apagar ${s.name}`} onClick={() => apagarSegmento(s)} className="border-l px-1.5 py-1 text-muted-foreground opacity-60 hover:text-rose-500 group-hover:opacity-100">
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {painelFiltros && (
        <Cartao className="mb-3" corpo="p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(["status", "plano", "faixa", "papel", "selo"] as const).map((c) => (
              <Rotulo key={c} texto={{ status: "Situação", plano: "Plano", faixa: "Ofensiva", papel: "Papel", selo: "Selo" }[c]}>
                <Escolha value={filtros[c] ?? ""} onChange={(e) => mudar({ [c]: e.target.value })}>
                  <option value="">Qualquer</option>
                  {Object.entries(ROTULOS[c]!).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                </Escolha>
              </Rotulo>
            ))}
            <Rotulo texto="Curso">
              <Escolha value={filtros.curso ?? ""} onChange={(e) => mudar({ curso: e.target.value })}>
                <option value="">Qualquer</option>
                {opcoes.dados?.cursos.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Escolha>
            </Rotulo>
            <Rotulo texto="Como conheceu">
              <Escolha value={filtros.origem ?? ""} onChange={(e) => mudar({ origem: e.target.value })}>
                <option value="">Qualquer</option>
                {opcoes.dados?.origens.map((o) => <option key={o.slug} value={o.slug}>{o.label}</option>)}
              </Escolha>
            </Rotulo>
            <Rotulo texto="Sem estudar há">
              <Escolha value={filtros.semEstudarDias ?? ""} onChange={(e) => mudar({ semEstudarDias: e.target.value })}>
                <option value="">Qualquer</option>
                {[1, 3, 7, 14, 30, 90].map((d) => <option key={d} value={d}>{d} {d === 1 ? "dia" : "dias"} ou mais</option>)}
              </Escolha>
            </Rotulo>
            <Rotulo texto="Cadastro a partir de">
              <Entrada type="date" value={filtros.cadastroDe ?? ""} onChange={(e) => mudar({ cadastroDe: e.target.value })} />
            </Rotulo>
            <Rotulo texto="Cadastro até">
              <Entrada type="date" value={filtros.cadastroAte ?? ""} onChange={(e) => mudar({ cadastroAte: e.target.value })} />
            </Rotulo>
          </div>
        </Cartao>
      )}

      {ativos.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {ativos.map(([c, v]) => (
            <button key={c} type="button" onClick={() => mudar({ [c]: "" })} className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-bold text-primary hover:bg-primary/15">
              {textoDoFiltro(c as Campo, v, opcoes.dados)}
              <X className="size-3" />
            </button>
          ))}
          <button type="button" onClick={() => { setTextoBusca(""); router.replace(caminho); }} className="px-1.5 text-xs font-bold text-muted-foreground hover:text-foreground">Limpar tudo</button>
        </div>
      )}

      {/* ── Barra da seleção ── */}
      {selecionados.size > 0 && (
        <div className="sticky top-0 z-10 mb-2 flex flex-wrap items-center gap-2 rounded-lg border bg-primary/10 px-3 py-2 text-sm backdrop-blur">
          <b>{selecionados.size} {selecionados.size === 1 ? "selecionada" : "selecionadas"}</b>
          <Botao tamanho="sm" variante="primario" onClick={() => setLote(true)}>Ação em lote…</Botao>
          <Botao tamanho="sm" variante="fantasma" onClick={() => setSelecionados(new Set())}>Limpar seleção</Botao>
        </div>
      )}

      {erro && <Erro tentarDeNovo={recarregar}>{erro}</Erro>}

      <div className={cn("overflow-hidden rounded-xl border bg-card transition-opacity", atualizando && "opacity-60")}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="w-10 px-3 py-2.5">
                  <input
                    type="checkbox"
                    aria-label="Selecionar todas desta página"
                    checked={todosMarcados}
                    onChange={() => setSelecionados((s) => {
                      const n = new Set(s);
                      todosDaPagina.forEach((id) => (todosMarcados ? n.delete(id) : n.add(id)));
                      return n;
                    })}
                    className="size-4 accent-[var(--primary)]"
                  />
                </th>
                <Coluna campo="nome" rotulo="Pessoa" ordem={ordem} direcao={direcao} aoOrdenar={ordenar} alinhar="left" />
                <th className="px-3 py-2.5 text-left font-bold">Plano</th>
                <Coluna campo="xp" rotulo="XP" ordem={ordem} direcao={direcao} aoOrdenar={ordenar} />
                <Coluna campo="ofensiva" rotulo="Ofensiva" ordem={ordem} direcao={direcao} aoOrdenar={ordenar} />
                <Coluna campo="rupees" rotulo="Rupees" ordem={ordem} direcao={direcao} aoOrdenar={ordenar} />
                <Coluna campo="atividade" rotulo="Estudou" ordem={ordem} direcao={direcao} aoOrdenar={ordenar} />
                <Coluna campo="cadastro" rotulo="Cadastro" ordem={ordem} direcao={direcao} aoOrdenar={ordenar} />
              </tr>
            </thead>
            <tbody>
              {!dados && carregando &&
                Array.from({ length: 8 }, (_, i) => (
                  <tr key={i} className="border-b last:border-0"><td colSpan={8} className="px-3 py-3"><Esqueleto linhas={1} /></td></tr>
                ))}
              {dados?.itens.map((p) => (
                <LinhaDaPessoa
                  key={p.id}
                  p={p}
                  marcado={selecionados.has(p.id)}
                  aoMarcar={() => setSelecionados((s) => {
                    const n = new Set(s);
                    if (n.has(p.id)) n.delete(p.id);
                    else n.add(p.id);
                    return n;
                  })}
                />
              ))}
            </tbody>
          </table>
        </div>
        {dados && dados.itens.length === 0 && (
          <Vazio titulo="Ninguém com esses filtros" icone={<Search className="size-5" />}>Tente tirar algum filtro ou buscar por outro termo.</Vazio>
        )}
      </div>

      {dados && dados.paginas > 1 && (
        <div className="mt-3 flex items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground">Página {pagina} de {dados.paginas}</span>
          <div className="flex gap-1.5">
            <Botao tamanho="sm" disabled={pagina <= 1} onClick={() => mudar({ pagina: String(pagina - 1) }, true)} icone={<ChevronLeft className="size-4" />}>Anterior</Botao>
            <Botao tamanho="sm" disabled={pagina >= dados.paginas} onClick={() => mudar({ pagina: String(pagina + 1) }, true)}>
              Próxima <ChevronRight className="size-4" />
            </Botao>
          </div>
        </div>
      )}

      <Dialogo
        aberto={nomeDoSegmento !== null}
        aoFechar={() => setNomeDoSegmento(null)}
        titulo="Salvar segmento"
        descricao="Os filtros de agora viram um atalho, que toda a equipe vê acima da lista."
        rodape={
          <>
            <Botao variante="fantasma" onClick={() => setNomeDoSegmento(null)}>Cancelar</Botao>
            <Botao variante="primario" disabled={!nomeDoSegmento?.trim()} onClick={salvarSegmento}>Salvar</Botao>
          </>
        }
      >
        <Entrada
          autoFocus
          value={nomeDoSegmento ?? ""}
          onChange={(e) => setNomeDoSegmento(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void salvarSegmento()}
          placeholder="Ex.: PRO que sumiram há 7 dias"
          maxLength={60}
          aria-label="Nome do segmento"
        />
      </Dialogo>

      <AcoesEmLote
        aberto={lote}
        ids={[...selecionados]}
        aoFechar={() => setLote(false)}
        aoConcluir={() => {
          setLote(false);
          setSelecionados(new Set());
          invalidar("/admin/pessoas");
        }}
      />
    </Pagina>
  );
}

function textoDoFiltro(c: Campo, v: string, opcoes?: { cursos: { id: string; name: string }[]; origens: { slug: string; label: string }[] }) {
  if (c === "curso") return `Curso: ${opcoes?.cursos.find((x) => x.id === v)?.name ?? "…"}`;
  if (c === "origem") return `Conheceu por: ${opcoes?.origens.find((x) => x.slug === v)?.label ?? v}`;
  if (c === "semEstudarDias") return `Sem estudar há ${v}+ dias`;
  if (c === "cadastroDe") return `Cadastro desde ${data(v)}`;
  if (c === "cadastroAte") return `Cadastro até ${data(v)}`;
  return ROTULOS[c]?.[v] ?? v;
}

function Coluna({ campo, rotulo, ordem, direcao, aoOrdenar, alinhar = "right" }: { campo: string; rotulo: string; ordem: string; direcao: string; aoOrdenar: (c: string) => void; alinhar?: "left" | "right" }) {
  const ativa = ordem === campo;
  return (
    <th className={cn("px-3 py-2.5 font-bold", alinhar === "left" ? "text-left" : "text-right")} aria-sort={ativa ? (direcao === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" onClick={() => aoOrdenar(campo)} className={cn("inline-flex items-center gap-1 hover:text-foreground", ativa && "text-foreground")}>
        {rotulo}
        {ativa && (direcao === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
      </button>
    </th>
  );
}

function SeloDoPlano({ p }: { p: PessoaDaLista }) {
  if (p.subscription?.status === "trialing") return <Selo tom="roxo" icone={<Sparkles className="size-3" />}>Teste</Selo>;
  if (p.proCourtesyUntil && new Date(p.proCourtesyUntil) > new Date()) return <Selo tom="roxo">Cortesia</Selo>;
  if (p.isPro) return <Selo tom="roxo" icone={<Crown className="size-3" />}>PRO</Selo>;
  return <span className="text-xs text-muted-foreground">Grátis</span>;
}

function LinhaDaPessoa({ p, marcado, aoMarcar }: { p: PessoaDaLista; marcado: boolean; aoMarcar: () => void }) {
  const router = useRouter();
  const suspensa = p.isBanned && p.bannedUntil;
  return (
    <tr
      className={cn("cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/40", marcado && "bg-primary/5")}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("input, a, button")) return;
        router.push(`/admin/pessoas/${p.id}`);
      }}
    >
      <td className="px-3 py-2">
        <input type="checkbox" checked={marcado} onChange={aoMarcar} aria-label={`Selecionar ${p.name}`} className="size-4 accent-[var(--primary)]" />
      </td>
      <td className="px-3 py-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <AvatarPequeno id={p.avatarId} />
          <div className="min-w-0">
            <Link href={`/admin/pessoas/${p.id}`} className="flex items-center gap-1 font-bold hover:text-primary">
              <span className="truncate">{p.name}</span>
              {p.isVerified && <BadgeCheck className="size-3.5 shrink-0 text-sky-500" aria-label="Verificada" />}
              {p.isDeveloper && <Code2 className="size-3.5 shrink-0 text-teal-500" aria-label="Desenvolvedor" />}
            </Link>
            <p className="truncate text-xs text-muted-foreground">{p.email} · #{p.publicCode}</p>
          </div>
          {p.role !== "USER" && <Selo tom="azul">{p.role === "ADMIN" ? "Admin" : "Professor"}</Selo>}
          {p.isBanned && <Selo tom="vermelho">{suspensa ? "Suspensa" : "Bloqueada"}</Selo>}
        </div>
      </td>
      <td className="px-3 py-2"><SeloDoPlano p={p} /></td>
      <td className="px-3 py-2 text-right tabular-nums">{numero(p.xp)}</td>
      <td className="px-3 py-2 text-right tabular-nums">
        <span className="inline-flex items-center gap-1">{p.currentStreak > 0 && <Flame className="size-3.5 text-orange-500" />}{numero(p.currentStreak)}</span>
      </td>
      <td className="px-3 py-2 text-right tabular-nums"><span className="inline-flex items-center gap-1"><Gem className="size-3 text-emerald-500" />{numero(p.coins)}</span></td>
      <td className="whitespace-nowrap px-3 py-2 text-right text-xs text-muted-foreground">{relativo(p.lastActivityAt)}</td>
      <td className="whitespace-nowrap px-3 py-2 text-right text-xs text-muted-foreground">{data(p.createdAt)}</td>
    </tr>
  );
}
