"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Megaphone, Users } from "lucide-react";
import { API_BASE_URL } from "@/lib/api-config";
import { BotaoAcao } from "./botao-acao";
import { chamarAdmin, useAcao } from "./use-acao";

type Notificacao = { id: string; title: string; body: string; createdAt?: string; _count?: { recipients: number } };

/**
 * Notificações da plataforma.
 *
 * O envio é irreversível e vai para todo mundo de uma vez, então a tela mostra
 * a mensagem exatamente como ela vai chegar antes de disparar. Sem isso o
 * admin só descobria o erro de digitação depois que a notificação já estava na
 * caixa de milhares de pessoas.
 */
export function AdminNotifications() {
  const [titulo, setTitulo] = useState("");
  const [corpo, setCorpo] = useState("");
  const [itens, setItens] = useState<Notificacao[]>([]);
  const [carregado, setCarregado] = useState(false);
  const [erroLista, setErroLista] = useState("");

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

  const publicar = useAcao(async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    await chamarAdmin(
      `${API_BASE_URL}/admin/notifications`,
      { method: "POST", body: JSON.stringify({ title: titulo.trim(), body: corpo.trim() }) },
      "Não foi possível publicar a notificação."
    );
    setTitulo("");
    setCorpo("");
    await carregar();
  });

  const temPreview = Boolean(titulo.trim() || corpo.trim());

  return (
    <section className="py-7">
      <p className="text-sm font-black uppercase tracking-wider text-primary">Comunicação</p>
      <h1 className="mt-1.5 text-3xl font-black sm:text-4xl">Notificações</h1>
      <p className="mt-2 text-muted-foreground">Chega para todas as contas ativas de uma vez, e não dá para voltar atrás.</p>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <form onSubmit={(e) => void publicar.rodar(e)} className="rounded-2xl border bg-card p-5">
          <label className="block text-sm font-black">
            Título
            <input
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: Novo curso de Rust no ar"
              className="mt-1.5 w-full rounded-xl border bg-background p-3 font-medium outline-none focus:border-primary"
            />
          </label>
          <label className="mt-3 block text-sm font-black">
            Mensagem
            <textarea
              required
              value={corpo}
              onChange={(e) => setCorpo(e.target.value)}
              placeholder="O que a comunidade precisa saber"
              className="mt-1.5 min-h-32 w-full rounded-xl border bg-background p-3 font-medium outline-none focus:border-primary"
            />
          </label>

          {publicar.erro && <p className="mt-3 rounded-xl bg-destructive/10 p-3 text-sm font-bold text-destructive">{publicar.erro}</p>}

          <BotaoAcao
            estado={publicar.estado}
            type="submit"
            rotuloEnviando="Publicando…"
            rotuloConcluido="Publicada"
            className="mt-4 w-full"
          >
            Publicar para todos
          </BotaoAcao>
        </form>

        <div className="rounded-2xl border border-dashed bg-muted/30 p-5">
          <p className="text-sm font-black uppercase tracking-wide text-muted-foreground">Como vai chegar</p>
          {temPreview ? (
            <article className="mt-3 rounded-2xl border bg-card p-4">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Megaphone className="size-4" />
              </span>
              <b className="mt-3 block break-words">{titulo.trim() || "Sem título"}</b>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">{corpo.trim() || "Sem mensagem"}</p>
            </article>
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
              <p className="mt-2.5 flex items-center gap-1.5 text-xs font-black text-muted-foreground">
                <Users className="size-3.5" />
                {item._count?.recipients ?? 0} destinatários
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
