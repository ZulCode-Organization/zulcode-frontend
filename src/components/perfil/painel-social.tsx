"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, Search, UserPlus, Users } from "lucide-react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";
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
 * A estrutura existe, mas as duas listas vêm vazias: não há sistema de
 * amizade no backend — nenhum model, nenhuma rota. Preencher isso exigiria
 * inventar relações entre contas reais, então o card mostra o estado vazio
 * com o selo de "em breve" em vez de números fabricados.
 */
export function AbasSeguidores() {
  const [aba, setAba] = useState<"segue" | "seguidores">("segue");

  return (
    <section className="overflow-hidden rounded-[20px] border border-border bg-card">
      <div className="flex">
        {(["segue", "seguidores"] as const).map((item) => (
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
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
        <Users className="size-7 text-muted-foreground/60" />
        <p className="text-sm font-black text-foreground">
          {aba === "segue" ? "Você ainda não segue ninguém" : "Ninguém segue você ainda"}
        </p>
        <span className={SELO_EM_BREVE}>Em breve</span>
      </div>
    </section>
  );
}

/** Busca de usuários, ligada no GET /leaderboard/search — a mesma da tabela de
 * líderes. Esta parte funciona de verdade. */
function EncontrarAmigos() {
  const [aberto, setAberto] = useState(false);
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState<Encontrado[]>([]);

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
                <Link key={user.id} href={`/perfil/${user.id}`} className="flex items-center gap-3 py-2.5">
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
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Card "Adicionar amigos": a busca funciona, o convite ainda não existe. */
export function AdicionarAmigos() {
  return (
    <section className="rounded-[20px] border border-border bg-card p-4">
      <h2 className="px-2 pb-2 pt-1 font-black">Adicionar amigos</h2>

      <EncontrarAmigos />

      {/* Convite exigiria link de indicação, que o backend não tem. */}
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
