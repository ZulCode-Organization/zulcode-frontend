"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Hand, Loader2, Plus, UserPlus, X } from "lucide-react";
import { ChamaDupla } from "@/components/shared/chama-dupla";
import { UserAvatar } from "@/components/shared/user-avatar";
import { usePerfil } from "@/hooks/use-perfil";
import {
  convidarParaDupla, cutucar, encerrarDupla, listarAmigosNaOfensiva, listarDuplas, responderDupla,
  type AmigoNaOfensiva, type Dupla,
} from "@/lib/ofensiva-amigos";
import { cn } from "@/lib/utils";

const primeiroNome = (nome: string) => nome.trim().split(/\s+/)[0] ?? nome;
const iniciais = (nome: string) => nome.slice(0, 2).toUpperCase();

/**
 * A ofensiva com os amigos, no perfil: a de quem você segue (com o botão de
 * cutucar quem ainda não estudou hoje) e as ofensivas em dupla, que só
 * crescem nos dias em que as duas pessoas estudam.
 */
export function OfensivaComAmigos() {
  const { perfil } = usePerfil();
  const [amigos, setAmigos] = useState<AmigoNaOfensiva[] | null>(null);
  const [duplas, setDuplas] = useState<Dupla[] | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ texto: string; erro: boolean } | null>(null);
  const [escolhendo, setEscolhendo] = useState(false);

  const carregar = useCallback(async () => {
    const [lista, pares] = await Promise.all([listarAmigosNaOfensiva().catch(() => []), listarDuplas().catch(() => [])]);
    setAmigos(lista);
    setDuplas(pares);
  }, []);

  // Todo setState do `carregar` vem depois do await.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void carregar(); }, [carregar]);

  const agir = async (chave: string, acao: () => Promise<unknown>, sucesso: string) => {
    if (ocupado) return;
    setOcupado(chave);
    setAviso(null);
    try {
      await acao();
      setAviso({ texto: sucesso, erro: false });
      await carregar();
    } catch (e) {
      setAviso({ texto: e instanceof Error ? e.message : "Não deu certo agora.", erro: true });
    } finally {
      setOcupado(null);
    }
  };

  if (amigos === null || duplas === null) {
    return <div className="h-40 animate-pulse rounded-[22px] bg-muted" />;
  }

  const emDupla = new Set(duplas.map((d) => d.amigo.id));
  const convidaveis = amigos.filter((a) => !emDupla.has(a.id));

  return (
    <section className="flex flex-col gap-6">
      {aviso && (
        <p role="status" className={cn("rounded-xl px-3 py-2.5 text-center text-[0.85rem] font-black", aviso.erro ? "bg-rose-500/15 text-rose-500" : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400")}>
          {aviso.texto}
        </p>
      )}

      <div>
        <h2 className="text-[0.78rem] font-black uppercase tracking-[0.1em] text-muted-foreground">Ofensivas dos amigos</h2>
        <div className="mt-3 flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none]">
          {amigos.map((amigo) => (
            <div key={amigo.id} className="flex w-[68px] shrink-0 flex-col items-center gap-1.5">
              <Link href={`/perfil/${amigo.id}`} className={cn("rounded-full", amigo.emRisco && "ring-2 ring-orange-400 ring-offset-2 ring-offset-background")}>
                <UserAvatar iniciais={iniciais(amigo.nome)} avatarId={amigo.avatarId} bannerColor={amigo.bannerColor} size="md" className="[&>div]:rounded-full [&>div]:ring-0" />
              </Link>
              <span className={cn("flex items-center gap-0.5 text-[0.85rem] font-black", amigo.ofensiva > 0 ? "text-foreground" : "text-muted-foreground")}>
                <ChamaDupla className="size-4.5" aceso={amigo.estudouHoje} dias={amigo.ofensiva} />
                {amigo.ofensiva}
              </span>
              {amigo.emRisco && (
                <button
                  type="button"
                  disabled={amigo.cutucadoHoje || !!ocupado}
                  onClick={() => void agir(`cutucar-${amigo.id}`, () => cutucar(amigo.id), `${primeiroNome(amigo.nome)} vai receber seu lembrete.`)}
                  className="flex items-center gap-1 rounded-lg bg-orange-500/15 px-2 py-1 text-[0.62rem] font-black uppercase text-orange-500 disabled:bg-muted disabled:text-muted-foreground"
                >
                  {ocupado === `cutucar-${amigo.id}` ? <Loader2 className="size-3 animate-spin" /> : <Hand className="size-3" />}
                  {amigo.cutucadoHoje ? "Feito" : "Cutucar"}
                </button>
              )}
            </div>
          ))}
          <Link href="/tabela-lideres" className="flex w-[68px] shrink-0 flex-col items-center gap-1.5" aria-label="Encontrar pessoas para seguir">
            <span className="grid size-12 place-items-center rounded-full border-2 border-dashed border-border text-muted-foreground">
              <Plus className="size-5" />
            </span>
          </Link>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-[0.78rem] font-black uppercase tracking-[0.1em] text-muted-foreground">Ofensiva em dupla</h2>
          {!!convidaveis.length && (
            <button type="button" onClick={() => setEscolhendo((v) => !v)} className="flex items-center gap-1 text-[0.72rem] font-black uppercase tracking-[0.06em] text-primary">
              <UserPlus className="size-4" />
              Convidar
            </button>
          )}
        </div>

        {escolhendo && (
          <div className="mt-3 overflow-hidden rounded-[18px] border border-border bg-card">
            {convidaveis.map((amigo, i) => (
              <div key={amigo.id} className={cn("flex items-center gap-3 px-4 py-3", i > 0 && "border-t border-border")}>
                <UserAvatar iniciais={iniciais(amigo.nome)} avatarId={amigo.avatarId} bannerColor={amigo.bannerColor} size="sm" className="[&>div]:rounded-full [&>div]:ring-0" />
                <b className="min-w-0 flex-1 truncate text-[0.9rem]">{amigo.nome}</b>
                <button
                  type="button"
                  disabled={!!ocupado}
                  onClick={() => void agir(`convidar-${amigo.id}`, () => convidarParaDupla(amigo.id), `Convite enviado para ${primeiroNome(amigo.nome)}.`).then(() => setEscolhendo(false))}
                  className="zc-press rounded-xl bg-primary px-3 py-2 text-[0.7rem] font-black uppercase text-primary-foreground disabled:opacity-60"
                >
                  {ocupado === `convidar-${amigo.id}` ? <Loader2 className="size-4 animate-spin" /> : "Convidar"}
                </button>
              </div>
            ))}
          </div>
        )}

        {!duplas.length && !escolhendo && (
          <p className="mt-3 rounded-[18px] border border-dashed border-border px-4 py-5 text-center text-[0.85rem] text-muted-foreground">
            Uma ofensiva só de vocês dois: ela cresce nos dias em que os dois estudam.
            {!amigos.length && " Siga alguém para convidar."}
          </p>
        )}

        <div className="mt-3 flex flex-col gap-2.5">
          {duplas.map((dupla) => (
            <div key={dupla.id} className="rounded-[20px] border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <span className="flex -space-x-3">
                  <UserAvatar iniciais={perfil ? iniciais(perfil.nome) : "?"} avatarId={perfil?.avatarId} bannerColor={perfil?.bannerColor} size="sm" className="[&>div]:rounded-full [&>div]:ring-2 [&>div]:ring-card" />
                  <UserAvatar iniciais={iniciais(dupla.amigo.nome)} avatarId={dupla.amigo.avatarId} bannerColor={dupla.amigo.bannerColor} size="sm" className="[&>div]:rounded-full [&>div]:ring-2 [&>div]:ring-card" />
                </span>
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-[0.92rem]">Você e {primeiroNome(dupla.amigo.nome)}</b>
                  {dupla.status === "ativa" ? (
                    <span className="text-[0.75rem] font-bold text-muted-foreground">
                      {dupla.euHoje ? "Você estudou hoje" : "Falta você hoje"} · {dupla.amigo.estudouHoje ? `${primeiroNome(dupla.amigo.nome)} estudou` : `falta ${primeiroNome(dupla.amigo.nome)}`}
                    </span>
                  ) : (
                    <span className="text-[0.75rem] font-bold text-muted-foreground">
                      {dupla.conviteRecebido ? "Convidou você" : "Esperando aceitar"}
                    </span>
                  )}
                </span>
                {dupla.status === "ativa" && (
                  <span className="flex items-center gap-1 text-[1.2rem] font-black">
                    <ChamaDupla className="size-6" aceso={dupla.euHoje && dupla.amigo.estudouHoje} dias={dupla.dias} />
                    {dupla.dias}
                  </span>
                )}
              </div>
              {dupla.conviteRecebido ? (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={!!ocupado}
                    onClick={() => void agir(`aceitar-${dupla.id}`, () => responderDupla(dupla.id, true), "Ofensiva em dupla começou!")}
                    className="zc-press flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-[0.75rem] font-black uppercase text-primary-foreground"
                  >
                    <Check className="size-4" /> Aceitar
                  </button>
                  <button
                    type="button"
                    disabled={!!ocupado}
                    onClick={() => void agir(`recusar-${dupla.id}`, () => responderDupla(dupla.id, false), "Convite recusado.")}
                    className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-border py-2.5 text-[0.75rem] font-black uppercase"
                  >
                    <X className="size-4" /> Recusar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={!!ocupado}
                  onClick={() => {
                    if (window.confirm(dupla.status === "ativa" ? "Encerrar esta ofensiva em dupla? Os dias se perdem." : "Cancelar o convite?")) {
                      void agir(`encerrar-${dupla.id}`, () => encerrarDupla(dupla.id), dupla.status === "ativa" ? "Ofensiva em dupla encerrada." : "Convite cancelado.");
                    }
                  }}
                  className="mt-2 text-[0.7rem] font-black uppercase tracking-[0.06em] text-muted-foreground hover:text-rose-500"
                >
                  {dupla.status === "ativa" ? "Encerrar" : "Cancelar convite"}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
