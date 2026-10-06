"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { ChamaDupla } from "@/components/shared/chama-dupla";
import { GasOfensiva } from "@/components/shared/gas-ofensiva";
import { UserAvatar } from "@/components/shared/user-avatar";
import { SeloVerificado } from "@/components/shared/selo-verificado";
import { usePerfil } from "@/hooks/use-perfil";
import { PessoaSocial, listarSeguindo } from "@/lib/social";
import { cn } from "@/lib/utils";

const DIAS_DA_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function chaveDoDia(data: Date) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
}

interface OfensivaProps {
  streakAtual: number | null;
  streakRecorde: number | null;
  protecoes: number;
  diasProtegidos: string[];
  onNavegar?: () => void;
}

/**
 * A tela da ofensiva, em duas abas.
 *
 * Pessoal é a sua sequência: o número, o gás guardado e o calendário. Amigos é
 * a sequência de quem você segue — a mesma relação construída no perfil, que
 * aqui ganha uso em vez de existir só como contador.
 *
 * O azul é o da chama. O ícone da sequência já é azul em toda a barra, e um
 * cabeçalho laranja no meio disso faria a tela parecer de outro app.
 */
export function PainelOfensiva({ streakAtual, streakRecorde, protecoes, diasProtegidos, onNavegar }: OfensivaProps) {
  const [aba, setAba] = useState<"pessoal" | "amigos">("pessoal");

  return (
    <div className="mx-auto w-full max-w-md pb-2">
      <div className="mb-4 flex">
        {(["pessoal", "amigos"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setAba(item)}
            className={cn(
              "flex-1 border-b-2 pb-3 text-[0.8rem] font-black uppercase tracking-[0.08em] transition-colors duration-150",
              aba === item ? "border-blue-600 text-blue-600" : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {item === "pessoal" ? "Pessoal" : "Amigos"}
          </button>
        ))}
      </div>

      {aba === "pessoal" ? (
        <AbaPessoal
          streakAtual={streakAtual}
          streakRecorde={streakRecorde}
          protecoes={protecoes}
          diasProtegidos={diasProtegidos}
          onNavegar={onNavegar}
        />
      ) : (
        <AbaAmigos onNavegar={onNavegar} />
      )}
    </div>
  );
}

/**
 * O backend informa os dias que foram protegidos; eles aparecem em azul claro.
 * Os demais dias da sequência continuam sendo inferidos a partir do total.
 */
function AbaPessoal({ streakAtual, streakRecorde, protecoes, diasProtegidos, onNavegar }: OfensivaProps) {
  const sequencia = streakAtual ?? 0;
  const hoje = useMemo(() => {
    const data = new Date();
    data.setHours(0, 0, 0, 0);
    return data;
  }, []);
  const [mesVisivel, setMesVisivel] = useState(() => new Date(hoje.getFullYear(), hoje.getMonth(), 1));

  const diasAcesos = useMemo(() => {
    const dias = new Set<string>();
    for (let voltar = 0; voltar < sequencia; voltar += 1) {
      const data = new Date(hoje);
      data.setDate(hoje.getDate() - voltar);
      dias.add(chaveDoDia(data));
    }
    return dias;
  }, [sequencia, hoje]);
  const diasComProtecao = useMemo(() => new Set(diasProtegidos), [diasProtegidos]);

  const ano = mesVisivel.getFullYear();
  const mes = mesVisivel.getMonth();
  const primeiraColuna = new Date(ano, mes, 1).getDay();
  const totalDeDias = new Date(ano, mes + 1, 0).getDate();
  const celulas = [...Array(primeiraColuna).fill(null), ...Array.from({ length: totalDeDias }, (_, i) => i + 1)];

  const mudarMes = (passo: number) => setMesVisivel(new Date(ano, mes + passo, 1));
  const aceso = (dia: number) => diasAcesos.has(chaveDoDia(new Date(ano, mes, dia)));

  return (
    <>
      {/* Cabeçalho: o número grande com a chama atrás, no azul da sequência. */}
      <div
        className="relative overflow-hidden rounded-[20px] px-5 py-6"
        style={{ background: "linear-gradient(120deg, #1d4ed8 0%, #2563eb 55%, #38bdf8 100%)" }}
      >
        <ChamaDupla
          className="pointer-events-none absolute -right-3 top-1/2 size-36 -translate-y-1/2 opacity-25"
          aceso={sequencia > 0}
          protegido={protecoes > 0}
        />
        <p className="relative text-6xl font-black leading-none text-white">{sequencia}</p>
        <p className="relative mt-1 text-lg font-black text-white">
          {sequencia === 1 ? "dia de ofensiva!" : "dias de ofensiva!"}
        </p>
        {(streakRecorde ?? 0) > 0 && (
          <p className="relative mt-1 text-[0.8rem] font-bold text-white/75">
            Seu recorde é de {streakRecorde} {streakRecorde === 1 ? "dia" : "dias"}.
          </p>
        )}
      </div>

      {/* Gás de ofensiva: o item existe na loja, então o card leva pra lá em
          vez de prometer algo que não dá pra fazer aqui. */}
      <div className="mt-3 flex items-center gap-3 rounded-[20px] border border-border bg-card px-4 py-4">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-2xl",
            protecoes > 0 ? "bg-violet-500/15" : "bg-muted"
          )}
        >
          <GasOfensiva className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.9rem] font-black leading-snug">
            {protecoes > 0
              ? `Você tem ${protecoes} ${protecoes === 1 ? "gás" : "gases"} de ofensiva`
              : "Você está sem gás de ofensiva!"}
          </p>
          <Link
            href="/loja"
            onClick={onNavegar}
            className="mt-0.5 inline-block text-[0.78rem] font-black uppercase tracking-[0.06em] text-primary"
          >
            Obter mais
          </Link>
        </div>
      </div>

      {/* Calendário */}
      <div className="mt-3 rounded-[20px] border border-border bg-card px-3 py-4">
        <div className="mb-3 flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => mudarMes(-1)}
            aria-label="Mês anterior"
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-muted"
          >
            <ChevronLeft className="size-5" strokeWidth={2.6} />
          </button>
          <p className="text-[0.9rem] font-black">
            {MESES[mes]} de {ano}
          </p>
          <button
            type="button"
            onClick={() => mudarMes(1)}
            aria-label="Próximo mês"
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-muted"
          >
            <ChevronRight className="size-5" strokeWidth={2.6} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {DIAS_DA_SEMANA.map((dia) => (
            <span key={dia} className="pb-1 text-center text-[0.68rem] font-black uppercase tracking-[0.04em] text-muted-foreground">
              {dia}
            </span>
          ))}

          {celulas.map((dia, indice) => {
            if (dia === null) return <span key={`vazio-${indice}`} />;

            const coluna = indice % 7;
            const marcado = aceso(dia);
            const chave = chaveDoDia(new Date(ano, mes, dia));
            const protegido = diasComProtecao.has(chave);
            const ehHoje = chave === chaveDoDia(hoje);
            // A trilha contínua liga dias acesos seguidos dentro da mesma
            // semana, do jeito que a referência mostra.
            const ligaAntes = marcado && coluna > 0 && aceso(dia - 1);
            const ligaDepois = marcado && coluna < 6 && dia < totalDeDias && aceso(dia + 1);

            return (
              <span key={dia} className="relative flex h-10 items-center justify-center">
                {marcado && (ligaAntes || ligaDepois) && (
                  <span
                    className={cn(
                      "absolute inset-y-1.5 bg-blue-600/15",
                      ligaAntes ? "left-0" : "left-1/2",
                      ligaDepois ? "right-0" : "right-1/2"
                    )}
                    aria-hidden
                  />
                )}
                <span
                  className={cn(
                    "relative flex size-8 items-center justify-center rounded-full text-[0.82rem] font-black",
                    protegido ? "bg-sky-500 text-white" : marcado ? "bg-blue-600 text-white" : "text-muted-foreground",
                    ehHoje && !marcado && "ring-2 ring-inset ring-primary text-primary",
                    ehHoje && marcado && "ring-2 ring-offset-2 ring-blue-600 ring-offset-card"
                  )}
                >
                  {dia}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </>
  );
}

/**
 * As sequências de quem eu sigo, da maior pra menor.
 *
 * A fonte é a mesma lista de "segue" do perfil, e a sequência vem junto dela —
 * uma consulta só. Ordenar por sequência, e não por nome, é o que faz a aba
 * valer: quem está na frente aparece primeiro.
 */
function AbaAmigos({ onNavegar }: { onNavegar?: () => void }) {
  const { perfil } = usePerfil();
  const [amigos, setAmigos] = useState<PessoaSocial[] | null>(null);

  useEffect(() => {
    if (!perfil?.id) return;
    let valeu = true;
    listarSeguindo(perfil.id)
      .then((lista) => {
        if (valeu) setAmigos(lista);
      })
      .catch(() => {
        if (valeu) setAmigos([]);
      });
    return () => {
      valeu = false;
    };
  }, [perfil?.id]);

  if (amigos === null) {
    return (
      <div className="flex flex-col gap-2.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[60px] animate-pulse rounded-[18px] bg-muted" />
        ))}
      </div>
    );
  }

  if (!amigos.length) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-[20px] border border-border bg-card px-5 py-10 text-center">
        <Users className="size-8 text-muted-foreground/60" />
        <p className="text-sm font-black text-foreground">Você ainda não segue ninguém</p>
        <p className="text-xs text-muted-foreground">Seguindo alguém, a ofensiva dessa pessoa aparece aqui.</p>
        <Link
          href="/perfil"
          onClick={onNavegar}
          className="zc-press zc-press-shadow mt-3 rounded-xl bg-primary px-4 py-2.5 text-[0.72rem] font-black uppercase tracking-[0.06em] text-primary-foreground"
          style={{ ["--zc-press-color" as string]: "rgba(0,0,0,0.32)" }}
        >
          Ver sugestões
        </Link>
      </div>
    );
  }

  const ordenados = [...amigos].sort((a, b) => b.currentStreak - a.currentStreak);

  return (
    <div className="overflow-hidden rounded-[20px] border border-border bg-card">
      {ordenados.map((amigo, posicao) => (
        <Link
          key={amigo.id}
          href={`/perfil/${amigo.id}`}
          onClick={onNavegar}
          className={cn(
            "flex items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-muted/60",
            posicao > 0 && "border-t border-border"
          )}
        >
          <UserAvatar
            iniciais={amigo.name.slice(0, 2).toUpperCase()}
            avatarId={amigo.avatarId}
            bannerColor={amigo.bannerColor}
            size="sm"
            className="[&>div]:rounded-full [&>div]:ring-0"
          />
          <span className="min-w-0 flex-1">
            <b className="block truncate text-[0.88rem]">
              {amigo.name}
              {amigo.isVerified && <SeloVerificado className="ml-1 text-[0.8rem]" />}
            </b>
            <span className="text-[0.72rem] text-muted-foreground">Nível {amigo.nivel}</span>
          </span>
          <span
            className={cn(
              "flex shrink-0 items-center gap-1 text-[0.95rem] font-black",
              amigo.currentStreak > 0 ? "text-blue-600" : "text-muted-foreground"
            )}
          >
            <ChamaDupla className="size-6" aceso={amigo.currentStreak > 0} />
            {amigo.currentStreak}
          </span>
        </Link>
      ))}
    </div>
  );
}
