"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { usePerfil } from "@/hooks/use-perfil";
import { UserAvatar } from "@/components/shared/user-avatar";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";

interface Sugestao {
  id: string;
  name: string;
  avatarId?: string;
  bannerColor?: string | null;
  xp: number;
  level: number;
  levelLabel: string;
}

/** Quantos cards a seção mostra de uma vez. */
const QUANTIDADE = 2;
/** Ligas varridas em busca de gente, da mais cheia pra menos. Sem isso, quem
 * está sozinho na própria divisão não veria sugestão nenhuma. */
const LIGAS = ["BRONZE", "SILVER", "GOLD"];

function chaveDispensados(perfilId?: string | null) {
  return `zulcode:sugestoes-dispensadas:${perfilId ?? "anonimo"}`;
}

/**
 * Sugestões de pessoas pra seguir.
 *
 * São usuários **reais** da plataforma, tirados do GET /leaderboard — não é
 * grafo social: o backend não guarda quem segue quem, então não dá pra dizer
 * "fulano segue". Por isso o card mostra o nível e o XP da pessoa, que é
 * informação de verdade, e o botão leva ao perfil dela em vez de "seguir",
 * que não existe do outro lado.
 */
export function SugestoesAmigos() {
  const { perfil } = usePerfil();
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [dispensados, setDispensados] = useState<string[]>([]);
  const chave = chaveDispensados(perfil?.id);

  useEffect(() => {
    try {
      const salvo = JSON.parse(localStorage.getItem(chave) ?? "[]");
      setDispensados(Array.isArray(salvo) ? salvo : []);
    } catch {
      setDispensados([]);
    }
  }, [chave]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all(
      LIGAS.map((liga) =>
        fetchComTimeout(`${API_BASE_URL}/leaderboard?league=${liga}`, { headers })
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null)
      )
    ).then((respostas) => {
      const vistos = new Set<string>();
      const pessoas: Sugestao[] = [];
      for (const resposta of respostas) {
        for (const entrada of resposta?.entries ?? []) {
          if (vistos.has(entrada.id)) continue;
          vistos.add(entrada.id);
          pessoas.push(entrada);
        }
      }
      setSugestoes(pessoas);
    });
  }, []);

  const dispensar = (id: string) => {
    const nova = [...dispensados, id];
    setDispensados(nova);
    try {
      localStorage.setItem(chave, JSON.stringify(nova));
    } catch {
      // navegação privada: a dispensa vale só nesta sessão
    }
  };

  const visiveis = sugestoes
    .filter((pessoa) => pessoa.id !== perfil?.id && !dispensados.includes(pessoa.id))
    .slice(0, QUANTIDADE);

  if (!visiveis.length) return null;

  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-foreground">Sugestões de amigos</h2>
        <Link
          href="/tabela-lideres"
          className="shrink-0 text-[0.78rem] font-black uppercase tracking-[0.06em] text-primary transition-opacity duration-150 hover:opacity-70"
        >
          Ver todos
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {visiveis.map((pessoa) => (
          <div
            key={pessoa.id}
            className="animate-fade-in-up relative flex flex-col items-center rounded-[18px] border border-border bg-card px-4 py-5 text-center"
          >
            <button
              type="button"
              onClick={() => dispensar(pessoa.id)}
              aria-label={`Dispensar ${pessoa.name}`}
              className="absolute right-2.5 top-2.5 flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-muted"
            >
              <X className="size-4" />
            </button>

            <UserAvatar
              iniciais={pessoa.name.slice(0, 2).toUpperCase()}
              avatarId={pessoa.avatarId}
              bannerColor={pessoa.bannerColor}
              size="md"
              className="[&>div]:rounded-full [&>div]:ring-0"
            />
            <p className="mt-3 w-full truncate font-black text-foreground">{pessoa.name}</p>
            <p className="mt-0.5 text-[0.8rem] text-muted-foreground">
              Nível {pessoa.level} · {pessoa.xp.toLocaleString("pt-BR")} XP
            </p>

            {/* "Seguir" não existe no backend; o que dá pra fazer de verdade é
                abrir o perfil da pessoa. */}
            <Link
              href={`/perfil/${pessoa.id}`}
              className="zc-press zc-press-shadow mt-4 w-full rounded-[14px] bg-primary py-3 text-[0.78rem] font-black uppercase tracking-[0.06em] text-primary-foreground"
              style={{ ["--zc-press-color" as string]: "rgba(0,0,0,0.32)" }}
            >
              Ver perfil
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
