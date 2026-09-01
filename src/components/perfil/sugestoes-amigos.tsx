"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { usePerfil } from "@/hooks/use-perfil";
import { UserAvatar } from "@/components/shared/user-avatar";
import { SeloVerificado } from "@/components/shared/selo-verificado";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";
import { useArrastarFaixa } from "@/hooks/use-arrastar-faixa";

interface Sugestao {
  id: string;
  name: string;
  avatarId?: string;
  bannerColor?: string | null;
  xp: number;
  level: number;
  levelLabel: string;
  isVerified?: boolean;
}

/** Teto de cards no carrossel. Passa longe do que costuma vir do
 * leaderboard, e existe só pra faixa não crescer sem limite. */
const QUANTIDADE = 15;
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

  const { ref: faixa, manipuladores } = useArrastarFaixa<HTMLDivElement>();
  const [podeVoltar, setPodeVoltar] = useState(false);
  const [podeAvancar, setPodeAvancar] = useState(false);

  // As setas só existem pro mouse, e só aparecem no lado pra onde ainda dá pra
  // ir. No toque quem manda é o arrasto.
  const atualizarSetas = useCallback(() => {
    const elemento = faixa.current;
    if (!elemento) return;
    setPodeVoltar(elemento.scrollLeft > 4);
    setPodeAvancar(elemento.scrollLeft + elemento.clientWidth < elemento.scrollWidth - 4);
  }, [faixa]);

  useEffect(() => {
    atualizarSetas();
    window.addEventListener("resize", atualizarSetas);
    return () => window.removeEventListener("resize", atualizarSetas);
  }, [atualizarSetas, visiveis.length]);

  const rolar = (direcao: 1 | -1) => {
    const elemento = faixa.current;
    if (!elemento) return;
    elemento.scrollBy({ left: direcao * elemento.clientWidth * 0.8, behavior: "smooth" });
  };

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

      <div className="relative mt-4">
        {/* A faixa sangra até a borda da tela no celular, então o card que vem
            depois aparece cortado e mostra que dá pra arrastar. */}
        <div
          ref={faixa}
          onScroll={atualizarSetas}
          {...manipuladores}
          className="zc-scroll-hidden -mx-4 flex touch-pan-x snap-x snap-mandatory select-none gap-3 overflow-x-auto overscroll-x-contain px-4 pb-1 sm:-mx-1 sm:px-1"
        >
          {visiveis.map((pessoa) => (
            <div
              key={pessoa.id}
              className="animate-fade-in-up relative flex w-[45%] min-w-[148px] shrink-0 snap-start flex-col items-center rounded-[18px] border border-border bg-card px-4 py-5 text-center sm:w-[186px]"
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
              <p className="mt-3 w-full truncate font-black text-foreground">{pessoa.name}{pessoa.isVerified && <SeloVerificado className="ml-1 text-[0.9rem]" />}</p>
              <p className="mt-0.5 w-full truncate text-[0.8rem] text-muted-foreground">
                Nível {pessoa.level} · {pessoa.xp.toLocaleString("pt-BR")} XP
              </p>

              {/* "Seguir" não existe no backend; o que dá pra fazer de verdade é
                  abrir o perfil da pessoa. */}
              <Link
                href={`/perfil/${pessoa.id}`}
                draggable={false}
                className="zc-press zc-press-shadow mt-4 w-full rounded-[14px] bg-primary py-3 text-[0.78rem] font-black uppercase tracking-[0.06em] text-primary-foreground"
                style={{ ["--zc-press-color" as string]: "rgba(0,0,0,0.32)" }}
              >
                Ver perfil
              </Link>
            </div>
          ))}
        </div>

        {podeVoltar && (
          <button
            type="button"
            onClick={() => rolar(-1)}
            aria-label="Ver sugestões anteriores"
            className="absolute -left-3 top-1/2 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md transition-colors duration-150 hover:bg-muted sm:flex"
          >
            <ChevronLeft className="size-5" />
          </button>
        )}

        {podeAvancar && (
          <button
            type="button"
            onClick={() => rolar(1)}
            aria-label="Ver mais sugestões"
            className="absolute -right-3 top-1/2 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md transition-colors duration-150 hover:bg-muted sm:flex"
          >
            <ChevronRight className="size-5" />
          </button>
        )}
      </div>
    </section>
  );
}
