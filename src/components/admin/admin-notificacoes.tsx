"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AlertTriangle, BookmarkPlus, CalendarClock, Hand, Search, Send, Smartphone, Trash2, Users, X, XCircle } from "lucide-react";
import { pedir, query, useDados } from "@/lib/admin/api";
import { personalizar } from "@/lib/notificacoes";
import { cn } from "@/lib/utils";
import { BotaoAcao } from "./botao-acao";
import { useAcao } from "./use-acao";

type Publico = {
  tipo: "todos" | "escolhidos" | "filtro";
  userIds?: string[];
  plano?: "pro" | "gratis";
  cursoId?: string;
  liga?: string;
  inativosDias?: number;
  ofensivaEmRisco?: boolean;
  plataforma?: "android" | "web";
};
type Notificacao = {
  id: string;
  title: string;
  body: string;
  route: string | null;
  imageUrl: string | null;
  actionLabel: string | null;
  actionRoute: string | null;
  audience: Publico | { tipo: "teste" };
  status: "agendada" | "enviando" | "enviada" | "cancelada" | "falhou";
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  isTest: boolean;
  delivered: number;
  failed: number;
  pessoas: number;
  toques: number;
  autor: string | null;
};
type Modelo = { id: string; name: string; title: string; body: string; route: string | null; imageUrl: string | null; actionLabel: string | null; actionRoute: string | null };
type Pessoa = { id: string; name: string; email: string; publicCode?: string | null };
type Alcance = { pessoas: number; comAparelho: number; envioConfigurado: boolean };

/** As telas que uma notificação (ou o botão dela) pode abrir. */
const TELAS: { rota: string; nome: string }[] = [
  { rota: "/home", nome: "Jornada" },
  { rota: "/metas", nome: "Metas" },
  { rota: "/loja", nome: "Loja" },
  { rota: "/tabela-lideres", nome: "Divisão" },
  { rota: "/elementos", nome: "Elementos" },
  { rota: "/perfil", nome: "Perfil" },
  { rota: "/playground", nome: "Playground" },
  { rota: "/pro", nome: "PRO" },
  { rota: "/configuracoes", nome: "Configurações" },
];
const nomeDaTela = (rota?: string | null) => TELAS.find((tela) => tela.rota === rota)?.nome ?? rota ?? "Jornada";

const LIGAS = [
  { id: "BRONZE", nome: "Bronze" },
  { id: "SILVER", nome: "Prata" },
  { id: "GOLD", nome: "Ouro" },
  { id: "PLATINUM", nome: "Platina" },
  { id: "DIAMOND", nome: "Diamante" },
  { id: "MASTER", nome: "Mestre" },
];

const quando = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).replace(".", "") : "—";

/** O público em palavras, para o histórico. */
function descreverPublico(publico: Notificacao["audience"]) {
  if (publico.tipo === "teste") return "Teste (só para quem enviou)";
  if (publico.tipo === "todos") return "Todas as contas";
  if (publico.tipo === "escolhidos") {
    const total = publico.userIds?.length ?? 0;
    return `${total} ${total === 1 ? "pessoa escolhida" : "pessoas escolhidas"}`;
  }
  const partes = [
    publico.plano === "pro" ? "PRO" : publico.plano === "gratis" ? "Grátis" : null,
    publico.liga ? `Liga ${LIGAS.find((l) => l.id === publico.liga)?.nome ?? publico.liga}` : null,
    publico.cursoId ? "um curso" : null,
    publico.inativosDias ? `inativos há ${publico.inativosDias}+ dias` : null,
    publico.ofensivaEmRisco ? "ofensiva em risco" : null,
    publico.plataforma === "android" ? "app Android" : publico.plataforma === "web" ? "site" : null,
  ].filter(Boolean);
  return partes.length ? `Filtro: ${partes.join(", ")}` : "Filtro sem condições (todas as contas)";
}

/** Uma caixa de seleção com o mesmo visual dos campos do formulário. */
function Selecao({ rotulo, valor, aoMudar, opcoes }: { rotulo: string; valor: string; aoMudar: (v: string) => void; opcoes: { valor: string; nome: string }[] }) {
  return (
    <label className="block text-xs font-black text-muted-foreground">
      {rotulo}
      <select value={valor} onChange={(e) => aoMudar(e.target.value)} className="mt-1 w-full rounded-xl border bg-background p-2.5 text-sm font-medium text-foreground outline-none focus:border-primary">
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>{o.nome}</option>
        ))}
      </select>
    </label>
  );
}

/**
 * Notificações do sistema do celular: escolher o público (todas as contas,
 * pessoas escolhidas ou um filtro), escrever com {nome}, imagem e botão,
 * enviar agora, agendar ou mandar um teste só para si, e acompanhar quantas
 * chegaram e quantas pessoas tocaram. Modelos guardam textos que se repetem.
 *
 * Elas chegam na barra do celular (app Android) e do navegador (site). Não
 * existe caixa de notificações dentro do app.
 */
export function AdminNotifications() {
  const [publico, setPublico] = useState<Publico>({ tipo: "todos" });
  const [escolhidas, setEscolhidas] = useState<Pessoa[]>([]);
  const [busca, setBusca] = useState("");
  const [achadas, setAchadas] = useState<Pessoa[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [alcance, setAlcance] = useState<Alcance | null>(null);

  const [titulo, setTitulo] = useState("");
  const [corpo, setCorpo] = useState("");
  const [rota, setRota] = useState("/home");
  const [imagem, setImagem] = useState("");
  const [botaoTexto, setBotaoTexto] = useState("");
  const [botaoRota, setBotaoRota] = useState("/home");
  const [agendar, setAgendar] = useState(false);
  const [agendarPara, setAgendarPara] = useState("");

  const [itens, setItens] = useState<Notificacao[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [carregado, setCarregado] = useState(false);
  const [erroLista, setErroLista] = useState("");
  const campoTexto = useRef<HTMLTextAreaElement>(null);
  const opcoes = useDados<{ cursos: { id: string; name: string }[] }>("/admin/pessoas/opcoes");

  const carregar = useCallback(async () => {
    try {
      const [lista, salvos] = await Promise.all([pedir<Notificacao[]>("/admin/notifications"), pedir<Modelo[]>("/admin/notifications/modelos")]);
      setItens(Array.isArray(lista) ? lista : []);
      setModelos(Array.isArray(salvos) ? salvos : []);
      setErroLista("");
    } catch (e) {
      setErroLista(e instanceof Error ? e.message : "Não foi possível carregar as notificações.");
    } finally {
      setCarregado(true);
    }
  }, []);

  // Todo setState do `carregar` vem depois do await.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void carregar(); }, [carregar]);

  const publicoParaEnviar: Publico = publico.tipo === "escolhidos" ? { tipo: "escolhidos", userIds: escolhidas.map((p) => p.id) } : publico;
  const chaveDoPublico = JSON.stringify(publicoParaEnviar);

  // O alcance é recalculado quando o público muda, com uma pausa para não consultar a cada clique.
  useEffect(() => {
    const alvo = JSON.parse(chaveDoPublico) as Publico;
    if (alvo.tipo === "escolhidos" && !alvo.userIds?.length) return;
    let vivo = true;
    const relogio = window.setTimeout(() => {
      pedir<Alcance>("/admin/notifications/publico", { method: "POST", json: { publico: alvo } })
        .then((r) => vivo && setAlcance(r))
        .catch(() => vivo && setAlcance(null));
    }, 350);
    return () => {
      vivo = false;
      window.clearTimeout(relogio);
    };
  }, [chaveDoPublico]);

  // A busca espera a pessoa parar de digitar.
  useEffect(() => {
    const termo = busca.trim();
    if (publico.tipo !== "escolhidos" || termo.length < 2) return;
    let vivo = true;
    const relogio = window.setTimeout(async () => {
      setBuscando(true);
      try {
        const resposta = await pedir<{ itens: Pessoa[] }>(`/admin/pessoas${query({ busca: termo, porPagina: 10 })}`);
        if (vivo) setAchadas(resposta.itens ?? []);
      } catch {
        if (vivo) setAchadas([]);
      } finally {
        if (vivo) setBuscando(false);
      }
    }, 300);
    return () => {
      vivo = false;
      window.clearTimeout(relogio);
    };
  }, [busca, publico.tipo]);

  const filtro = (mudanca: Partial<Publico>) => setPublico((atual) => ({ ...atual, ...mudanca }));

  const inserirNome = () => {
    const campo = campoTexto.current;
    const inicio = campo?.selectionStart ?? corpo.length;
    const fim = campo?.selectionEnd ?? corpo.length;
    setCorpo(corpo.slice(0, inicio) + "{nome}" + corpo.slice(fim));
    requestAnimationFrame(() => campo?.focus());
  };

  const conteudo = () => ({
    title: titulo.trim(),
    body: corpo.trim(),
    route: rota,
    ...(imagem.trim() ? { imageUrl: imagem.trim() } : {}),
    ...(botaoTexto.trim() ? { actionLabel: botaoTexto.trim(), actionRoute: botaoRota } : {}),
  });

  const usarConteudo = (origem: { title: string; body: string; route: string | null; imageUrl: string | null; actionLabel: string | null; actionRoute: string | null }) => {
    setTitulo(origem.title);
    setCorpo(origem.body);
    setRota(origem.route ?? "/home");
    setImagem(origem.imageUrl ?? "");
    setBotaoTexto(origem.actionLabel ?? "");
    setBotaoRota(origem.actionRoute ?? "/home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const limpar = () => {
    setTitulo("");
    setCorpo("");
    setImagem("");
    setBotaoTexto("");
    setAgendar(false);
    setAgendarPara("");
    setEscolhidas([]);
  };

  const publicar = useAcao(async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (publico.tipo === "escolhidos" && !escolhidas.length) throw new Error("Escolha pelo menos uma pessoa.");
    if (agendar && !agendarPara) throw new Error("Escolha a data e a hora do envio.");
    await pedir("/admin/notifications", {
      method: "POST",
      json: { ...conteudo(), publico: publicoParaEnviar, ...(agendar ? { agendarPara: new Date(agendarPara).toISOString() } : {}) },
    });
    limpar();
    await carregar();
  });

  const testar = useAcao(async () => {
    if (!titulo.trim() || !corpo.trim()) throw new Error("Escreva o título e a mensagem para testar.");
    await pedir("/admin/notifications", { method: "POST", json: { ...conteudo(), publico: { tipo: "todos" }, teste: true } });
    await carregar();
  });

  const salvarModelo = useAcao(async () => {
    if (!titulo.trim() || !corpo.trim()) throw new Error("Escreva o título e a mensagem antes de salvar.");
    const nome = window.prompt("Nome do modelo", titulo.trim().slice(0, 60));
    if (!nome?.trim()) return;
    await pedir("/admin/notifications/modelos", { method: "POST", json: { ...conteudo(), name: nome.trim() } });
    await carregar();
  });

  const excluir = async (item: Notificacao) => {
    const pergunta = item.status === "agendada" ? "Cancelar este envio agendado?" : "Excluir do histórico? Os números dela somem junto.";
    if (!window.confirm(pergunta)) return;
    await pedir(`/admin/notifications/${item.id}`, { method: "DELETE" }).catch((e) => window.alert(e instanceof Error ? e.message : "Não deu para excluir."));
    await carregar();
  };

  const excluirModelo = async (modelo: Modelo) => {
    if (!window.confirm(`Excluir o modelo "${modelo.name}"?`)) return;
    await pedir(`/admin/notifications/modelos/${modelo.id}`, { method: "DELETE" }).catch(() => null);
    await carregar();
  };

  const nomeDeExemplo = publico.tipo === "escolhidos" && escolhidas[0] ? escolhidas[0].name : "Ana";
  const imagemValida = /^https:\/\//.test(imagem.trim());
  const agendadas = itens.filter((i) => i.status === "agendada");
  const enviadas = itens.filter((i) => i.status !== "agendada");
  const textoDoBotao = agendar
    ? "Agendar envio"
    : publico.tipo === "escolhidos"
      ? `Enviar para ${escolhidas.length} ${escolhidas.length === 1 ? "pessoa" : "pessoas"}`
      : alcance
        ? `Enviar para ${alcance.pessoas.toLocaleString("pt-BR")} ${alcance.pessoas === 1 ? "pessoa" : "pessoas"}`
        : "Enviar";

  return (
    <section className="py-7">
      <p className="text-sm font-black uppercase tracking-wider text-primary">Comunicação</p>
      <h1 className="mt-1.5 text-3xl font-black sm:text-4xl">Notificações</h1>
      <p className="mt-2 text-muted-foreground">
        Chegam na barra do celular (app Android) e do navegador (site). Quem desligou as notificações nas Configurações não recebe.
      </p>

      {alcance && !alcance.envioConfigurado && (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-sm font-bold text-amber-700 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          O envio ainda não está configurado neste servidor (Firebase e Web Push). As notificações ficam registradas, mas não chegam a ninguém.
        </p>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <form
          onSubmit={(e) => {
            if (!agendar && publico.tipo !== "escolhidos" && !window.confirm(`Enviar agora para ${alcance?.pessoas ?? "todas as"} pessoas? Não dá para desfazer.`)) {
              e.preventDefault();
              return;
            }
            void publicar.rodar(e);
          }}
          className="rounded-2xl border bg-card p-5"
        >
          {!!modelos.length && (
            <Selecao
              rotulo="Começar de um modelo"
              valor=""
              aoMudar={(id) => {
                const modelo = modelos.find((m) => m.id === id);
                if (modelo) usarConteudo(modelo);
              }}
              opcoes={[{ valor: "", nome: "Escolha um modelo…" }, ...modelos.map((m) => ({ valor: m.id, nome: m.name }))]}
            />
          )}

          <p className={cn("text-sm font-black", modelos.length && "mt-4")}>Para quem</p>
          <div className="mt-1.5 grid grid-cols-3 gap-2" role="radiogroup">
            {(
              [
                ["todos", "Todas as contas"],
                ["escolhidos", "Pessoas escolhidas"],
                ["filtro", "Por filtro"],
              ] as const
            ).map(([tipo, nome]) => (
              <button
                key={tipo}
                type="button"
                role="radio"
                aria-checked={publico.tipo === tipo}
                onClick={() => setPublico({ tipo })}
                className={cn(
                  "rounded-xl border-2 px-2 py-2.5 text-[0.8rem] font-black leading-tight",
                  publico.tipo === tipo ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground",
                )}
              >
                {nome}
              </button>
            ))}
          </div>

          {publico.tipo === "escolhidos" && (
            <div className="mt-3">
              {!!escolhidas.length && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {escolhidas.map((pessoa) => (
                    <span key={pessoa.id} className="flex items-center gap-1 rounded-full bg-primary/10 py-1 pl-3 pr-1 text-xs font-black text-primary">
                      {pessoa.name}
                      <button
                        type="button"
                        aria-label={`Tirar ${pessoa.name}`}
                        onClick={() => setEscolhidas((atual) => atual.filter((p) => p.id !== pessoa.id))}
                        className="grid size-5 place-items-center rounded-full hover:bg-primary/20"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por nome, e-mail ou #código"
                  className="w-full rounded-xl border bg-background py-3 pl-9 pr-3 font-medium outline-none focus:border-primary"
                />
              </label>
              {busca.trim().length >= 2 && (
                <div className="mt-1.5 overflow-hidden rounded-xl border">
                  {buscando && !achadas.length ? (
                    <p className="p-3 text-sm text-muted-foreground">Buscando…</p>
                  ) : !achadas.length ? (
                    <p className="p-3 text-sm text-muted-foreground">Ninguém encontrado.</p>
                  ) : (
                    achadas.map((pessoa) => (
                      <button
                        key={pessoa.id}
                        type="button"
                        onClick={() => {
                          setEscolhidas((atual) => (atual.some((p) => p.id === pessoa.id) ? atual : [...atual, pessoa]));
                          setBusca("");
                          setAchadas([]);
                        }}
                        className="flex w-full items-center justify-between gap-3 border-b px-3 py-2.5 text-left last:border-0 hover:bg-muted/50"
                      >
                        <span className="min-w-0">
                          <b className="block truncate text-sm">{pessoa.name}</b>
                          <span className="block truncate text-xs text-muted-foreground">{pessoa.email}</span>
                        </span>
                        {pessoa.publicCode && <span className="shrink-0 text-xs font-black text-muted-foreground">#{pessoa.publicCode}</span>}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {publico.tipo === "filtro" && (
            <div className="mt-3 grid gap-3 rounded-xl border border-dashed p-3 sm:grid-cols-2">
              <Selecao
                rotulo="Plano"
                valor={publico.plano ?? ""}
                aoMudar={(v) => filtro({ plano: (v || undefined) as Publico["plano"] })}
                opcoes={[{ valor: "", nome: "Todos" }, { valor: "pro", nome: "Só PRO" }, { valor: "gratis", nome: "Só grátis" }]}
              />
              <Selecao
                rotulo="Curso atual"
                valor={publico.cursoId ?? ""}
                aoMudar={(v) => filtro({ cursoId: v || undefined })}
                opcoes={[{ valor: "", nome: "Qualquer curso" }, ...(opcoes.dados?.cursos ?? []).map((c) => ({ valor: c.id, nome: c.name }))]}
              />
              <Selecao
                rotulo="Liga"
                valor={publico.liga ?? ""}
                aoMudar={(v) => filtro({ liga: v || undefined })}
                opcoes={[{ valor: "", nome: "Qualquer liga" }, ...LIGAS.map((l) => ({ valor: l.id, nome: l.nome }))]}
              />
              <Selecao
                rotulo="Recebe por"
                valor={publico.plataforma ?? ""}
                aoMudar={(v) => filtro({ plataforma: (v || undefined) as Publico["plataforma"] })}
                opcoes={[{ valor: "", nome: "App e site" }, { valor: "android", nome: "Só app Android" }, { valor: "web", nome: "Só site" }]}
              />
              <label className="block text-xs font-black text-muted-foreground">
                Sem estudar há (dias)
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={publico.inativosDias ?? ""}
                  onChange={(e) => filtro({ inativosDias: e.target.value ? Math.max(1, Math.min(365, Number(e.target.value))) : undefined })}
                  placeholder="Qualquer"
                  className="mt-1 w-full rounded-xl border bg-background p-2.5 text-sm font-medium text-foreground outline-none focus:border-primary"
                />
              </label>
              <label className="flex items-center gap-2 self-end rounded-xl border bg-background p-2.5 text-sm font-bold">
                <input type="checkbox" checked={Boolean(publico.ofensivaEmRisco)} onChange={(e) => filtro({ ofensivaEmRisco: e.target.checked || undefined })} className="size-4 accent-primary" />
                Ofensiva em risco hoje
              </label>
            </div>
          )}

          {alcance && !(publico.tipo === "escolhidos" && !escolhidas.length) && (
            <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-black text-muted-foreground">
              <span className="flex items-center gap-1.5"><Users className="size-3.5" />{alcance.pessoas.toLocaleString("pt-BR")} {alcance.pessoas === 1 ? "pessoa" : "pessoas"}</span>
              <span className="flex items-center gap-1.5"><Smartphone className="size-3.5" />{alcance.comAparelho.toLocaleString("pt-BR")} podem receber agora</span>
            </p>
          )}

          <label className="mt-4 block text-sm font-black">
            Título
            <input
              required
              maxLength={120}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: {nome}, chegou curso novo!"
              className="mt-1.5 w-full rounded-xl border bg-background p-3 font-medium outline-none focus:border-primary"
            />
          </label>
          <label className="mt-3 block text-sm font-black">
            Mensagem
            <textarea
              ref={campoTexto}
              required
              maxLength={1000}
              value={corpo}
              onChange={(e) => setCorpo(e.target.value)}
              placeholder="O que a pessoa precisa saber"
              className="mt-1.5 min-h-28 w-full rounded-xl border bg-background p-3 font-medium outline-none focus:border-primary"
            />
          </label>
          <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <button type="button" onClick={inserirNome} className="rounded-md bg-muted px-1.5 py-0.5 font-mono font-bold text-foreground hover:bg-muted/70">
              {"{nome}"}
            </button>
            vira o primeiro nome de cada pessoa.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Selecao rotulo="Ao tocar, abre" valor={rota} aoMudar={setRota} opcoes={TELAS.map((t) => ({ valor: t.rota, nome: t.nome }))} />
            <label className="block text-xs font-black text-muted-foreground">
              Imagem grande (opcional)
              <input
                type="url"
                value={imagem}
                onChange={(e) => setImagem(e.target.value)}
                placeholder="https://…/imagem.png"
                className="mt-1 w-full rounded-xl border bg-background p-2.5 text-sm font-medium text-foreground outline-none focus:border-primary"
              />
            </label>
            <label className="block text-xs font-black text-muted-foreground">
              Botão (opcional)
              <input
                maxLength={24}
                value={botaoTexto}
                onChange={(e) => setBotaoTexto(e.target.value)}
                placeholder="Ex.: Estudar agora"
                className="mt-1 w-full rounded-xl border bg-background p-2.5 text-sm font-medium text-foreground outline-none focus:border-primary"
              />
            </label>
            {botaoTexto.trim() && <Selecao rotulo="O botão abre" valor={botaoRota} aoMudar={setBotaoRota} opcoes={TELAS.map((t) => ({ valor: t.rota, nome: t.nome }))} />}
          </div>

          <div className="mt-4 rounded-xl border p-3">
            <label className="flex items-center gap-2 text-sm font-black">
              <input type="checkbox" checked={agendar} onChange={(e) => setAgendar(e.target.checked)} className="size-4 accent-primary" />
              <CalendarClock className="size-4 text-primary" />
              Agendar para depois
            </label>
            {agendar && (
              <input
                type="datetime-local"
                value={agendarPara}
                onChange={(e) => setAgendarPara(e.target.value)}
                className="mt-2 w-full rounded-xl border bg-background p-2.5 text-sm font-medium outline-none focus:border-primary"
              />
            )}
          </div>

          {(publicar.erro || testar.erro || salvarModelo.erro) && (
            <p className="mt-3 rounded-xl bg-destructive/10 p-3 text-sm font-bold text-destructive">{publicar.erro || testar.erro || salvarModelo.erro}</p>
          )}

          <BotaoAcao estado={publicar.estado} type="submit" rotuloEnviando={agendar ? "Agendando…" : "Enviando…"} rotuloConcluido={agendar ? "Agendada" : "Enviada"} className="mt-4 w-full">
            {textoDoBotao}
          </BotaoAcao>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <BotaoAcao estado={testar.estado} type="button" variante="neutro" onClick={() => void testar.rodar()} rotuloEnviando="Enviando…" rotuloConcluido="Teste enviado">
              <Send className="size-4" /> Testar em mim
            </BotaoAcao>
            <BotaoAcao estado={salvarModelo.estado} type="button" variante="neutro" onClick={() => void salvarModelo.rodar()} rotuloEnviando="Salvando…" rotuloConcluido="Modelo salvo">
              <BookmarkPlus className="size-4" /> Salvar modelo
            </BotaoAcao>
          </div>
        </form>

        <div className="rounded-2xl border border-dashed bg-muted/30 p-5">
          <p className="text-sm font-black uppercase tracking-wide text-muted-foreground">Como vai chegar</p>
          {titulo.trim() || corpo.trim() ? (
            <>
              <article className="mt-3 overflow-hidden rounded-[20px] border bg-card shadow-lg">
                <div className="flex items-start gap-3 p-3.5">
                  <Image src="/mascot.png" alt="" width={44} height={44} className="size-11 shrink-0 rounded-xl bg-primary/10 object-contain p-0.5" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.7rem] font-bold text-muted-foreground">ZulCode · agora</span>
                    <b className="block break-words text-[0.92rem]">{personalizar(titulo.trim(), nomeDeExemplo) || "Sem título"}</b>
                    <span className="mt-0.5 block whitespace-pre-wrap break-words text-[0.82rem] leading-snug text-muted-foreground">
                      {personalizar(corpo.trim(), nomeDeExemplo) || "Sem mensagem"}
                    </span>
                  </span>
                </div>
                {imagemValida && (
                  // eslint-disable-next-line @next/next/no-img-element -- endereço de fora, digitado agora: só a prévia.
                  <img src={imagem.trim()} alt="" className="aspect-[2/1] w-full object-cover" />
                )}
                {botaoTexto.trim() && (
                  <div className="border-t px-3.5 py-2.5 text-[0.8rem] font-black uppercase tracking-wide text-primary">{botaoTexto.trim()}</div>
                )}
              </article>
              <p className="mt-3 text-xs text-muted-foreground">
                Ao tocar, abre {nomeDaTela(rota)}.
                {botaoTexto.trim() && ` O botão abre ${nomeDaTela(botaoRota)}.`}
                {(titulo + corpo).includes("{nome}") && ` Na prévia, {nome} aparece como "${nomeDeExemplo.split(" ")[0]}".`}
              </p>
              {imagem.trim() && !imagemValida && <p className="mt-2 text-xs font-bold text-destructive">A imagem precisa ser um endereço https.</p>}
            </>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Comece a escrever para ver a prévia aqui.</p>
          )}

          {!!modelos.length && (
            <div className="mt-6">
              <p className="text-sm font-black uppercase tracking-wide text-muted-foreground">Modelos</p>
              <ul className="mt-2 space-y-1.5">
                {modelos.map((modelo) => (
                  <li key={modelo.id} className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2">
                    <button type="button" onClick={() => usarConteudo(modelo)} className="min-w-0 flex-1 truncate text-left text-sm font-bold hover:text-primary">
                      {modelo.name}
                    </button>
                    <button type="button" onClick={() => void excluirModelo(modelo)} aria-label={`Excluir o modelo ${modelo.name}`} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {erroLista && <p className="mt-6 rounded-xl bg-destructive/10 p-3 text-sm font-bold text-destructive">{erroLista}</p>}

      {!!agendadas.length && (
        <>
          <h2 className="mt-9 text-lg font-black">Agendadas</h2>
          <div className="mt-3 space-y-2.5">
            {agendadas.map((item) => (
              <ItemDoHistorico key={item.id} item={item} aoExcluir={() => void excluir(item)} aoReusar={() => usarConteudo(item)} />
            ))}
          </div>
        </>
      )}

      <h2 className="mt-9 text-lg font-black">Enviadas</h2>
      {!carregado ? (
        <div className="mt-3 space-y-2.5">
          {[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      ) : !enviadas.length ? (
        <p className="mt-3 rounded-2xl border bg-card p-8 text-center text-muted-foreground">Nenhuma notificação enviada ainda.</p>
      ) : (
        <div className="mt-3 space-y-2.5">
          {enviadas.map((item) => (
            <ItemDoHistorico key={item.id} item={item} aoExcluir={() => void excluir(item)} aoReusar={() => usarConteudo(item)} />
          ))}
        </div>
      )}
    </section>
  );
}

/** Uma notificação do histórico: o texto, para quem foi e os números (entregues, falhas e toques). */
function ItemDoHistorico({ item, aoExcluir, aoReusar }: { item: Notificacao; aoExcluir: () => void; aoReusar: () => void }) {
  const taxa = item.pessoas ? Math.round((item.toques / item.pessoas) * 100) : 0;
  const selo =
    item.status === "agendada"
      ? { texto: `Agendada para ${quando(item.scheduledAt)}`, classe: "bg-primary/10 text-primary" }
      : item.status === "falhou"
        ? { texto: "Falhou", classe: "bg-destructive/10 text-destructive" }
        : item.status === "enviando"
          ? { texto: "Enviando", classe: "bg-amber-400/15 text-amber-600" }
          : item.isTest
            ? { texto: `Teste · ${quando(item.sentAt ?? item.createdAt)}`, classe: "bg-muted text-muted-foreground" }
            : { texto: `Enviada ${quando(item.sentAt ?? item.createdAt)}`, classe: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" };

  return (
    <article className="animate-fade-in-up rounded-2xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <span className={cn("rounded-full px-2.5 py-1 text-[0.7rem] font-black", selo.classe)}>{selo.texto}</span>
        <span className="flex shrink-0 items-center gap-1">
          <button type="button" onClick={aoReusar} className="rounded-lg px-2 py-1.5 text-xs font-black text-muted-foreground hover:bg-muted hover:text-foreground">
            Usar de novo
          </button>
          <button
            type="button"
            onClick={aoExcluir}
            aria-label={item.status === "agendada" ? "Cancelar o envio" : "Excluir do histórico"}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            {item.status === "agendada" ? <XCircle className="size-4" /> : <Trash2 className="size-4" />}
          </button>
        </span>
      </div>
      <b className="mt-2 block break-words">{item.title}</b>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">{item.body}</p>
      <p className="mt-2.5 text-xs font-bold text-muted-foreground">{descreverPublico(item.audience)}{item.autor ? ` · por ${item.autor}` : ""}</p>
      {item.status !== "agendada" && (
        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-black text-muted-foreground">
          <span className="flex items-center gap-1.5"><Users className="size-3.5" />{item.pessoas} {item.pessoas === 1 ? "pessoa" : "pessoas"}</span>
          <span className="flex items-center gap-1.5"><Smartphone className="size-3.5" />{item.delivered} {item.delivered === 1 ? "aparelho recebeu" : "aparelhos receberam"}</span>
          {!!item.failed && <span className="text-destructive">{item.failed} {item.failed === 1 ? "falha" : "falhas"}</span>}
          <span className="flex items-center gap-1.5"><Hand className="size-3.5" />{item.toques} {item.toques === 1 ? "toque" : "toques"} ({taxa}%)</span>
        </p>
      )}
    </article>
  );
}
