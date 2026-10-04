"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, Search, UserPlus, Users } from "lucide-react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { SeloVerificado } from "@/components/shared/selo-verificado";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";
import { usePerfil } from "@/hooks/use-perfil";
import { useSeguir } from "@/hooks/use-seguir";
import { PessoaSocial, listarSeguidores, listarSeguindo } from "@/lib/social";
import { BotaoSeguir } from "./botao-seguir";
import { cn } from "@/lib/utils";

type Encontrado = {
  id: string;
  name: string;
  publicCode: string;
  avatarId?: string;
  bannerColor?: string | null;
  level: number;
};

const SELO_EM_BREVE = "rounded-md bg-muted px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-[0.08em] text-muted-foreground";

/**
 * Abas Segue / Seguidores.
 *
 * Mostra as relações de quem o painel acompanha: no próprio perfil, as minhas;
 * no perfil de outra pessoa, as dela. Por isso o id entra por fora — o painel
 * aparece nas duas telas e não teria como adivinhar de quem falar.
 *
 * As listas são buscadas de novo sempre que eu sigo ou deixo de seguir alguém,
 * e não só na montagem: seguir pelo carrossel ao lado muda exatamente esta
 * lista, e um número que só corrige ao recarregar a página parece quebrado.
 */
export function AbasSeguidores({ usuarioId }: { usuarioId?: string }) {
  const [aba, setAba] = useState<"segue" | "seguidores">("segue");
  const { perfil } = usePerfil();
  const { carregado } = useSeguir();
  const id = usuarioId ?? perfil?.id ?? null;

  const [segue, setSegue] = useState<PessoaSocial[] | null>(null);
  const [seguidores, setSeguidores] = useState<PessoaSocial[] | null>(null);

  useEffect(() => {
    if (!id) return;
    let valeu = true;
    Promise.all([listarSeguindo(id), listarSeguidores(id)])
      .then(([aSeguir, meus]) => {
        if (!valeu) return;
        setSegue(aSeguir);
        setSeguidores(meus);
      })
      .catch(() => {
        if (!valeu) return;
        setSegue([]);
        setSeguidores([]);
      });
    // Descarta a resposta de um id antigo que chegue depois da troca de perfil.
    return () => {
      valeu = false;
    };
  }, [id, carregado]);

  const lista = aba === "segue" ? segue : seguidores;
  const souEu = !usuarioId || usuarioId === perfil?.id;

  return (
    <section className="overflow-hidden rounded-[20px] border border-border bg-card">
      <div className="flex">
        {(["segue", "seguidores"] as const).map((item) => {
          const total = item === "segue" ? segue?.length : seguidores?.length;
          return (
            <button
              key={item}
              type="button"
              onClick={() => setAba(item)}
              className={cn(
                "flex-1 border-b-2 py-3.5 text-[0.8rem] font-black uppercase tracking-[0.06em] transition-colors duration-150",
                aba === item ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {item === "segue" ? "Segue" : "Seguidores"}
              {typeof total === "number" && <span className="ml-1.5">{total}</span>}
            </button>
          );
        })}
      </div>

      {lista === null ? (
        <div className="flex flex-col gap-3 px-5 py-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="size-9 shrink-0 animate-pulse rounded-full bg-muted" />
              <span className="h-3 w-28 animate-pulse rounded-full bg-muted" />
            </div>
          ))}
        </div>
      ) : lista.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
          <Users className="size-7 text-muted-foreground/60" />
          <p className="text-sm font-black text-foreground">
            {aba === "segue"
              ? souEu
                ? "Você ainda não segue ninguém"
                : "Essa pessoa ainda não segue ninguém"
              : souEu
                ? "Ninguém segue você ainda"
                : "Ninguém segue essa pessoa ainda"}
          </p>
          {aba === "segue" && souEu && (
            <p className="text-xs text-muted-foreground">As sugestões no seu perfil são um bom começo.</p>
          )}
        </div>
      ) : (
        <div className="divide-y divide-border px-4">
          {lista.map((pessoa) => (
            <div key={pessoa.id} className="flex items-center gap-3 py-3">
              <Link href={`/perfil/${pessoa.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <UserAvatar
                  iniciais={pessoa.name.slice(0, 2).toUpperCase()}
                  avatarId={pessoa.avatarId}
                  bannerColor={pessoa.bannerColor}
                  size="sm"
                  className="[&>div]:rounded-full [&>div]:ring-0"
                />
                <span className="min-w-0">
                  <b className="block truncate text-sm">
                    {pessoa.name}
                    {pessoa.isVerified && <SeloVerificado className="ml-1 text-[0.8rem]" />}
                  </b>
                  <span className="text-xs text-muted-foreground">Nível {pessoa.nivel}</span>
                </span>
              </Link>
              {/* Sem botão no próprio cartão: ninguém segue a si mesmo. */}
              {pessoa.id !== perfil?.id && <BotaoSeguir id={pessoa.id} className="shrink-0 px-3 py-2 text-[0.68rem]" />}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/** Busca de usuários, ligada no GET /leaderboard/search — a mesma da tabela de
 * líderes. Esta parte funciona de verdade. */
function EncontrarAmigos() {
  const [aberto, setAberto] = useState(false);
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState<Encontrado[]>([]);
  const { perfil } = usePerfil();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token || q.trim().length < 2) {
      setResultados([]);
      return;
    }
    const timer = window.setTimeout(
      () =>
        fetchComTimeout(`${API_BASE_URL}/leaderboard/search?q=${encodeURIComponent(q)}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => (r.ok ? r.json() : []))
          .then(setResultados)
          .catch(() => setResultados([])),
      250
    );
    return () => clearTimeout(timer);
  }, [q]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        className="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition-colors duration-150 hover:bg-muted/60"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Search className="size-4.5" />
        </span>
        <span className="min-w-0 flex-1 font-black">Encontrar amigos</span>
        <ChevronRight className={cn("size-4.5 shrink-0 text-muted-foreground transition-transform duration-150", aberto && "rotate-90")} />
      </button>

      {aberto && (
        <div className="animate-fade-in-up mt-2 px-2">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nome ou #123456"
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          {q.trim().length >= 2 && !resultados.length && (
            <p className="mt-3 text-xs text-muted-foreground">Ninguém encontrado com esse nome ou código.</p>
          )}
          {resultados.length > 0 && (
            <div className="mt-2 divide-y divide-border">
              {resultados.map((user) => (
                <div key={user.id} className="flex items-center gap-3 py-2.5">
                  <Link href={`/perfil/${user.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <UserAvatar
                      iniciais={user.name.slice(0, 2).toUpperCase()}
                      avatarId={user.avatarId}
                      bannerColor={user.bannerColor}
                      size="sm"
                      className="[&>div]:rounded-full [&>div]:ring-0"
                    />
                    <span className="min-w-0">
                      <b className="block truncate text-sm">{user.name}</b>
                      <span className="text-xs text-muted-foreground">#{user.publicCode} · Nível {user.level}</span>
                    </span>
                  </Link>
                  {/* Achar alguém e já poder seguir, sem passar pelo perfil: era
                      o passo que faltava pra busca virar "adicionar". */}
                  {user.id !== perfil?.id && <BotaoSeguir id={user.id} className="shrink-0 px-3 py-2 text-[0.68rem]" />}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Card "Adicionar amigos": a busca e o seguir funcionam; o convite ainda não
 * existe, porque exigiria link de indicação, que o backend não tem. */
export function AdicionarAmigos() {
  return (
    <section className="rounded-[20px] border border-border bg-card p-4">
      <h2 className="px-2 pb-2 pt-1 font-black">Adicionar amigos</h2>

      <EncontrarAmigos />

      <div className="flex items-center gap-3 rounded-2xl px-2 py-2.5 opacity-60">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <UserPlus className="size-4.5" />
        </span>
        <span className="min-w-0 flex-1 font-black">Convidar amigos</span>
        <span className={SELO_EM_BREVE}>Em breve</span>
      </div>
    </section>
  );
}
