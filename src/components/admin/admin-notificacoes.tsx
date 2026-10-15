"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Search, Users, X } from "lucide-react";
import { API_BASE_URL } from "@/lib/api-config";
import { pedir, query } from "@/lib/admin/api";
import { personalizar } from "@/lib/notificacoes";
import { cn } from "@/lib/utils";
import { BotaoAcao } from "./botao-acao";
import { chamarAdmin, useAcao } from "./use-acao";

type Notificacao = { id: string; title: string; body: string; route?: string | null; createdAt?: string; _count?: { recipients: number } };
type Pessoa = { id: string; name: string; email: string; publicCode?: string | null };

/** As telas que uma notificação pode abrir. "Só mostrar" deixa na caixa de notificações. */
const TELAS: { rota: string; nome: string }[] = [
  { rota: "", nome: "Só mostrar" },
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
const nomeDaTela = (rota?: string | null) => TELAS.find((tela) => tela.rota === (rota ?? ""))?.nome ?? rota;

/**
 * Notificações da plataforma: para todas as contas ou para pessoas escolhidas.
 *
 * Elas chegam dentro do app (a caixa de Notificações e o aviso que desce do
 * topo quando a pessoa abre o app) e, com o Firebase configurado, também como
 * notificação do celular. {nome} vira o primeiro nome de cada pessoa.
 *
 * O envio não tem volta, então a tela mostra a mensagem como ela vai chegar
 * antes de disparar.
 */
export function AdminNotifications() {
  const [titulo, setTitulo] = useState("");
  const [corpo, setCorpo] = useState("");
  const [rota, setRota] = useState("");
  const [paraTodos, setParaTodos] = useState(true);
  const [escolhidas, setEscolhidas] = useState<Pessoa[]>([]);
  const [busca, setBusca] = useState("");
  const [achadas, setAchadas] = useState<Pessoa[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [itens, setItens] = useState<Notificacao[]>([]);
  const [carregado, setCarregado] = useState(false);
  const [erroLista, setErroLista] = useState("");
  const campoTexto = useRef<HTMLTextAreaElement>(null);

  const carregar = useCallback(async () => {
    try {
      const dados = await chamarAdmin(`${API_BASE_URL}/admin/notifications`, {}, "Não foi possível carregar as notificações.");
      setItens(Array.isArray(dados) ? dados : []);
      setErroLista("");
    } catch (e) {
      setErroLista(e instanceof Error ? e.message : "Não foi possível carregar as notificações.");
    } finally {
      setCarregado(true);
    }
  }, []);

  // Todo setState do `carregar` vem depois do await, então não há atualização
  // síncrona dentro do efeito — a regra só não enxerga isso pelo useCallback.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void carregar(); }, [carregar]);

  // A busca espera a pessoa parar de digitar para não disparar a cada letra.
  useEffect(() => {
    const termo = busca.trim();
    if (paraTodos || termo.length < 2) return;
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
  }, [busca, paraTodos]);

  const escolher = (pessoa: Pessoa) => {
    setEscolhidas((atual) => (atual.some((p) => p.id === pessoa.id) ? atual : [...atual, pessoa]));
    setBusca("");
    setAchadas([]);
  };

  const inserirNome = () => {
    const campo = campoTexto.current;
    const inicio = campo?.selectionStart ?? corpo.length;
    const fim = campo?.selectionEnd ?? corpo.length;
    setCorpo(corpo.slice(0, inicio) + "{nome}" + corpo.slice(fim));
    requestAnimationFrame(() => campo?.focus());
  };

  const publicar = useAcao(async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (!paraTodos && !escolhidas.length) throw new Error("Escolha pelo menos uma pessoa.");
    await chamarAdmin(
      `${API_BASE_URL}/admin/notifications`,
      {
        method: "POST",
        body: JSON.stringify({
          title: titulo.trim(),
          body: corpo.trim(),
          ...(rota ? { route: rota } : {}),
          ...(paraTodos ? {} : { userIds: escolhidas.map((p) => p.id) }),
        }),
      },
      "Não foi possível enviar a notificação.",
    );
    setTitulo("");
    setCorpo("");
    setRota("");
    setEscolhidas([]);
    await carregar();
  });

  // Na prévia, {nome} vira o nome da primeira pessoa escolhida (ou um exemplo).
  const nomeDeExemplo = !paraTodos && escolhidas[0] ? escolhidas[0].name : "Ana";
  const temPreview = Boolean(titulo.trim() || corpo.trim());

  return (
    <section className="py-7">
      <p className="text-sm font-black uppercase tracking-wider text-primary">Comunicação</p>
      <h1 className="mt-1.5 text-3xl font-black sm:text-4xl">Notificações</h1>
      <p className="mt-2 text-muted-foreground">
        Chegam dentro do app — na caixa de Notificações e num aviso que desce do topo ao abrir — e, com o Firebase
        configurado, também no celular. Não dá para voltar atrás.
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <form
          onSubmit={(e) => {
            // Para todo mundo não tem volta: pergunta antes, fora da ação, para o botão não dizer "Enviada" ao cancelar.
            if (paraTodos && !window.confirm("Enviar para todas as contas ativas? Não dá para desfazer.")) {
              e.preventDefault();
              return;
            }
            void publicar.rodar(e);
          }}
          className="rounded-2xl border bg-card p-5"
        >
          <p className="text-sm font-black">Para quem</p>
          <div className="mt-1.5 grid grid-cols-2 gap-2" role="radiogroup">
            {[true, false].map((todos) => (
              <button
                key={String(todos)}
                type="button"
                role="radio"
                aria-checked={paraTodos === todos}
                onClick={() => setParaTodos(todos)}
                className={cn(
                  "rounded-xl border-2 px-3 py-2.5 text-sm font-black",
                  paraTodos === todos ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground",
                )}
              >
                {todos ? "Todas as contas" : "Pessoas escolhidas"}
              </button>
            ))}
          </div>

          {!paraTodos && (
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
                        onClick={() => escolher(pessoa)}
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
              className="mt-1.5 min-h-32 w-full rounded-xl border bg-background p-3 font-medium outline-none focus:border-primary"
            />
          </label>
          <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <button type="button" onClick={inserirNome} className="rounded-md bg-muted px-1.5 py-0.5 font-mono font-bold text-foreground hover:bg-muted/70">
              {"{nome}"}
            </button>
            vira o primeiro nome de cada pessoa.
          </p>

          <label className="mt-4 block text-sm font-black">
            Ao tocar, abre
            <select
              value={rota}
              onChange={(e) => setRota(e.target.value)}
              className="mt-1.5 w-full rounded-xl border bg-background p-3 font-medium outline-none focus:border-primary"
            >
              {TELAS.map((tela) => (
                <option key={tela.rota} value={tela.rota}>{tela.nome}</option>
              ))}
            </select>
          </label>

          {publicar.erro && <p className="mt-3 rounded-xl bg-destructive/10 p-3 text-sm font-bold text-destructive">{publicar.erro}</p>}

          <BotaoAcao estado={publicar.estado} type="submit" rotuloEnviando="Enviando…" rotuloConcluido="Enviada" className="mt-4 w-full">
            {paraTodos ? "Enviar para todos" : `Enviar para ${escolhidas.length} ${escolhidas.length === 1 ? "pessoa" : "pessoas"}`}
          </BotaoAcao>
        </form>

        <div className="rounded-2xl border border-dashed bg-muted/30 p-5">
          <p className="text-sm font-black uppercase tracking-wide text-muted-foreground">Como vai chegar</p>
          {temPreview ? (
            <>
              <article className="mt-3 flex items-start gap-3 rounded-[20px] border bg-card p-3.5 shadow-lg">
                <Image src="/mascot.png" alt="" width={44} height={44} className="size-11 shrink-0 rounded-xl bg-primary/10 object-contain p-0.5" />
                <span className="min-w-0 flex-1">
                  <b className="block break-words text-[0.92rem]">{personalizar(titulo.trim(), nomeDeExemplo) || "Sem título"}</b>
                  <span className="mt-0.5 block whitespace-pre-wrap break-words text-[0.82rem] leading-snug text-muted-foreground">
                    {personalizar(corpo.trim(), nomeDeExemplo) || "Sem mensagem"}
                  </span>
                </span>
              </article>
              <p className="mt-3 text-xs text-muted-foreground">
                {rota ? `Ao tocar, abre ${nomeDaTela(rota)}.` : "Ao tocar, abre a caixa de Notificações."}
                {(titulo + corpo).includes("{nome}") && ` Na prévia, {nome} aparece como "${nomeDeExemplo.split(" ")[0]}".`}
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Comece a escrever para ver a prévia aqui.</p>
          )}
        </div>
      </div>

      <h2 className="mt-9 text-lg font-black">Já enviadas</h2>
      {erroLista && <p className="mt-3 rounded-xl bg-destructive/10 p-3 text-sm font-bold text-destructive">{erroLista}</p>}

      {!carregado ? (
        <div className="mt-3 space-y-2.5">
          {[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      ) : !itens.length ? (
        <p className="mt-3 rounded-2xl border bg-card p-8 text-center text-muted-foreground">Nenhuma notificação enviada ainda.</p>
      ) : (
        <div className="mt-3 space-y-2.5">
          {itens.map((item, indice) => (
            <article
              key={item.id}
              style={{ animationDelay: `${Math.min(indice, 10) * 30}ms` }}
              className="animate-fade-in-up rounded-2xl border bg-card p-4"
            >
              <b className="break-words">{item.title}</b>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">{item.body}</p>
              <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-black text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Users className="size-3.5" />
                  {item._count?.recipients ?? 0} {(item._count?.recipients ?? 0) === 1 ? "destinatário" : "destinatários"}
                </span>
                {item.route && <span>Abre {nomeDaTela(item.route)}</span>}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
