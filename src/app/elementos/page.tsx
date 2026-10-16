"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Search, X } from "lucide-react";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { AppShell } from "@/components/app-shell/app-shell";
import { ElementoTile, SimboloDoElemento } from "@/components/elementos/elemento-tile";
import { ElementoDetalhe } from "@/components/elementos/elemento-detalhe";
import { AvisoDemora, Esqueleto, EsqueletoElemento } from "@/components/shared/esqueleto";
import { useJornada } from "@/hooks/use-jornada";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";
import { corDoAssunto } from "@/lib/elementos";
import { ElementoGlossario } from "@/lib/types/elemento";
import { cn } from "@/lib/utils";

type Estado = {
  curso: string | null;
  nomeDoCurso: string;
  elementos: ElementoGlossario[];
  carregando: boolean;
  abrir: (elemento: ElementoGlossario) => void;
};
const Contexto = createContext<Estado | null>(null);
const useElementos = () => {
  const estado = useContext(Contexto);
  if (!estado) throw new Error("useElementos fora da página de elementos");
  return estado;
};

/**
 * Os elementos do curso, buscados uma vez e divididos entre a coluna do meio
 * e o painel da direita (que só existe no computador). O detalhe aberto mora
 * aqui também, para o "praticar" atualizar o domínio nos dois lugares.
 */
function ProvedorDeElementos({ children }: { children: ReactNode }) {
  const { cursoAtual, cursos, loading } = useJornada();
  const [elementos, setElementos] = useState<ElementoGlossario[]>([]);
  const [buscados, setBuscados] = useState<string | null>(null);
  const [aberto, setAberto] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token || !cursoAtual) return;
    let vivo = true;
    fetchComTimeout(`${API_BASE_URL}/languages/${cursoAtual}/elements`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : []))
      .then((lista: ElementoGlossario[]) => {
        if (!vivo) return;
        setElementos(Array.isArray(lista) ? lista : []);
        setBuscados(cursoAtual);
      })
      .catch(() => vivo && setBuscados(cursoAtual));
    return () => {
      vivo = false;
    };
  }, [cursoAtual]);

  const atualizar = useCallback((id: string, dominio: number, errosRecentes: number) => {
    setElementos((lista) => lista.map((e) => (e.id === id ? { ...e, dominio, errosRecentes } : e)));
  }, []);
  const fechar = useCallback(() => setAberto(null), []);

  const elementoAberto = elementos.find((e) => e.id === aberto) ?? null;
  const estado: Estado = {
    curso: cursoAtual,
    nomeDoCurso: cursos.find((curso) => curso.id === cursoAtual)?.name ?? cursoAtual ?? "",
    elementos,
    carregando: loading || (!!cursoAtual && buscados !== cursoAtual),
    abrir: (elemento) => setAberto(elemento.id),
  };

  return (
    <Contexto.Provider value={estado}>
      {children}
      {elementoAberto && cursoAtual && (
        <ElementoDetalhe elemento={elementoAberto} todos={elementos} curso={cursoAtual} aoFechar={fechar} aoAtualizar={atualizar} />
      )}
    </Contexto.Provider>
  );
}

/** Os assuntos na ordem em que aparecem na trilha do curso. */
function porAssunto(elementos: ElementoGlossario[]) {
  const grupos = new Map<string, ElementoGlossario[]>();
  for (const elemento of elementos) {
    const grupo = grupos.get(elemento.category) ?? [];
    grupo.push(elemento);
    grupos.set(elemento.category, grupo);
  }
  return [...grupos.entries()]
    .map(([assunto, itens]) => [assunto, [...itens].sort((a, b) => a.posicao - b.posicao)] as const)
    .sort((a, b) => a[1][0].posicao - b[1][0].posicao);
}

function Progresso({ className }: { className?: string }) {
  const { elementos } = useElementos();
  const aprendidos = elementos.filter((e) => e.aprendido).length;
  return (
    <div className={cn("rounded-[18px] border border-border bg-card px-4 py-3.5", className)}>
      <div className="flex items-center justify-between text-[0.85rem] font-black">
        <span>Aprendidos</span>
        <span className="text-muted-foreground">{aprendidos} de {elementos.length}</span>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary shadow-[inset_0_-3px_0_rgba(0,0,0,0.2)] transition-[width] duration-500"
          style={{ width: `${elementos.length ? (aprendidos / elementos.length) * 100 : 0}%` }}
        />
      </div>
      <p className="mt-1.5 text-[0.75rem] text-muted-foreground">Cada aula concluída destrava os elementos dela.</p>
    </div>
  );
}

/** O painel da direita, no computador: progresso, cada assunto e o que revisar. */
function PainelDeElementos() {
  const { elementos, carregando, abrir } = useElementos();
  if (carregando || !elementos.length) return null;
  // Para revisar: o aprendido com mais erros na semana; sem erros, o de menor domínio.
  const aprendidos = elementos.filter((e) => e.aprendido);
  const revisar = [...aprendidos].sort((a, b) => b.errosRecentes - a.errosRecentes || a.dominio - b.dominio)[0];

  return (
    <>
      <Progresso />
      <div className="rounded-[18px] border border-border bg-card px-4 py-3.5">
        <p className="mb-2.5 text-[0.7rem] font-black uppercase tracking-[0.12em] text-muted-foreground">Por assunto</p>
        {porAssunto(elementos).map(([assunto, itens]) => {
          const feitos = itens.filter((e) => e.aprendido).length;
          return (
            <div key={assunto} className="grid grid-cols-[9px_1fr_64px_28px] items-center gap-2 py-1.5 text-[0.8rem]">
              <span className="size-2.5 rounded-full" style={{ background: corDoAssunto(assunto).cor }} />
              <span className="truncate font-bold">{assunto}</span>
              <span className="h-1.5 overflow-hidden rounded-full bg-muted">
                <span className="block h-full rounded-full" style={{ width: `${(feitos / itens.length) * 100}%`, background: corDoAssunto(assunto).cor }} />
              </span>
              <span className="text-right text-[0.72rem] font-black text-muted-foreground">{feitos}/{itens.length}</span>
            </div>
          );
        })}
      </div>
      {revisar && (
        <div className="rounded-[18px] border border-border bg-card px-4 py-3.5">
          <p className="mb-2.5 text-[0.7rem] font-black uppercase tracking-[0.12em] text-muted-foreground">Para revisar</p>
          <div className="flex items-center gap-3">
            <SimboloDoElemento elemento={revisar} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-[0.9rem] font-black">{revisar.term}</p>
              <p className="text-[0.72rem] text-muted-foreground">
                {revisar.errosRecentes > 0
                  ? `${revisar.errosRecentes} ${revisar.errosRecentes === 1 ? "erro" : "erros"} nesta semana`
                  : revisar.dominio === 0 ? "Ainda sem prática" : `Domínio ${revisar.dominio} de 3`}
              </p>
            </div>
            <button type="button" onClick={() => abrir(revisar)} className="zc-press h-9 rounded-xl bg-primary px-3 text-[0.7rem] font-black uppercase tracking-[0.05em] text-primary-foreground shadow-[inset_0_-3px_0_rgba(0,0,0,0.2)]">
              Praticar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function ElementosContent() {
  const { elementos, carregando, nomeDoCurso, abrir } = useElementos();
  const [busca, setBusca] = useState("");

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return elementos;
    return elementos.filter((e) => [e.term, e.label, e.category].some((t) => t.toLowerCase().includes(termo)));
  }, [busca, elementos]);
  const assuntos = useMemo(() => porAssunto(filtrados), [filtrados]);

  return (
    <div className="pt-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-foreground sm:text-[1.7rem]">Elementos de {nomeDoCurso}</h1>
        {!carregando && elementos.length > 0 && (
          <label className="hidden w-[280px] items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2.5 text-sm focus-within:border-primary lg:flex">
            <Search className="size-4 text-muted-foreground" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Procurar elemento" className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground" />
            {busca && <button type="button" aria-label="Limpar busca" onClick={() => setBusca("")}><X className="size-4 text-muted-foreground" /></button>}
          </label>
        )}
      </div>

      {carregando ? (
        <div className="mt-6">
          {[0, 1, 2].map((secao) => (
            <div key={secao} className={secao ? "mt-9" : ""}>
              <Esqueleto className="h-4 w-32 rounded-full" />
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {[0, 1, 2, 3].map((item) => <EsqueletoElemento key={item} />)}
              </div>
            </div>
          ))}
          <AvisoDemora>Carregando seus elementos… isso pode levar alguns segundos.</AvisoDemora>
        </div>
      ) : elementos.length === 0 ? (
        <p className="mt-10 text-center text-[0.85rem] text-muted-foreground">Este curso ainda não tem elementos.</p>
      ) : (
        <>
          {/* No celular o progresso e a busca ficam no topo; no computador, na lateral e no título. */}
          <Progresso className="mt-4 lg:hidden" />
          <label className="mt-3 flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2.5 text-sm focus-within:border-primary lg:hidden">
            <Search className="size-4 text-muted-foreground" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Procurar elemento" className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground" />
            {busca && <button type="button" aria-label="Limpar busca" onClick={() => setBusca("")}><X className="size-4 text-muted-foreground" /></button>}
          </label>

          {assuntos.map(([assunto, itens]) => (
            <section key={assunto} className="mt-7">
              <div className="flex items-center gap-2.5">
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: corDoAssunto(assunto).cor }} />
                <h2 className="text-[1.05rem] font-black text-foreground">{assunto}</h2>
                <span className="ml-auto text-[0.78rem] font-black text-muted-foreground">
                  {itens.filter((e) => e.aprendido).length}/{itens.length}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {itens.map((elemento) => <ElementoTile key={elemento.id} elemento={elemento} aoAbrir={abrir} />)}
              </div>
            </section>
          ))}
          {assuntos.length === 0 && <p className="mt-10 text-center text-[0.85rem] text-muted-foreground">Nenhum elemento com “{busca}”.</p>}
        </>
      )}
    </div>
  );
}

export default function ElementosPage() {
  useRequireAuth();

  return (
    <ProvedorDeElementos>
      <AppShell rightPanel={<PainelDeElementos />} contentClassName="max-w-[1000px]">
        <ElementosContent />
      </AppShell>
    </ProvedorDeElementos>
  );
}
