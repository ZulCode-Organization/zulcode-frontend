"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Hand, Users } from "lucide-react";
import { ChamaDupla, faixaDaChama, type FaixaDaChama } from "@/components/shared/chama-dupla";
import { sequenciaAtivaHoje } from "@/lib/sequencia";
import { BotaoCompartilharOfensiva } from "@/components/shared/botao-compartilhar-ofensiva";
import { GasOfensiva } from "@/components/shared/gas-ofensiva";
import { UserAvatar } from "@/components/shared/user-avatar";
import { usePerfil } from "@/hooks/use-perfil";
import { cutucar, listarAmigosNaOfensiva, type AmigoNaOfensiva } from "@/lib/ofensiva-amigos";
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
 * A cor da tela é a da chama, que muda com o tempo de sequência: laranja até
 * 29 dias, violeta a partir de 30, verde-água a partir de 100.
 */
export function PainelOfensiva({ streakAtual, streakRecorde, protecoes, diasProtegidos, onNavegar }: OfensivaProps) {
  const [aba, setAba] = useState<"pessoal" | "amigos">("pessoal");
  const cor = coresDaOfensiva(streakAtual ?? 0).cor;

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
              aba === item ? "" : "border-border text-muted-foreground hover:text-foreground"
            )}
            style={aba === item ? { borderColor: cor, color: cor } : undefined}
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

/** As cores da tela em cada faixa da chama: o número, a aba e a faixa do
 *  calendário (que vai da cor da chama a um tom mais claro, como no Duolingo).
 *  Sem ofensiva, tudo fica cinza. */
const CORES_DA_TELA: Record<FaixaDaChama["id"] | "apagada", { cor: string; faixa: string }> = {
  quente: { cor: "#ff6a2b", faixa: "linear-gradient(90deg, #ff4b2b, #ffa41f)" },
  violeta: { cor: "#a855f7", faixa: "linear-gradient(90deg, #7c3aed, #c084fc)" },
  agua: { cor: "#06b6d4", faixa: "linear-gradient(90deg, #0891b2, #5eead4)" },
  apagada: { cor: "#9ca3af", faixa: "linear-gradient(90deg, #6b7280, #9ca3af)" },
};

export function coresDaOfensiva(dias: number) {
  return CORES_DA_TELA[dias > 0 ? faixaDaChama(dias).id : "apagada"];
}

/**
 * A sua ofensiva: o número grande e a chama na cor da faixa (quente até 29
 * dias, violeta a partir de 30, verde-água a partir de 100), o gás e o
 * calendário.
 *
 * O calendário acende os dias da sequência atual numa faixa contínua por
 * semana. Os dias que o gás (ou o PRO, ou o fim de semana) segurou levam o
 * botijão em cima, no lugar do gelo do Duolingo: foi o gás que manteve o fogo
 * aceso naquele dia.
 */
function AbaPessoal({ streakAtual, streakRecorde, protecoes, diasProtegidos, onNavegar }: OfensivaProps) {
  const { perfil } = usePerfil();
  const sequencia = streakAtual ?? 0;
  const cores = coresDaOfensiva(sequencia);
  const feitaHoje = sequenciaAtivaHoje(sequencia, perfil?.ultimaAtividade);
  const hoje = useMemo(() => {
    const data = new Date();
    data.setHours(0, 0, 0, 0);
    return data;
  }, []);
  const [mesVisivel, setMesVisivel] = useState(() => new Date(hoje.getFullYear(), hoje.getMonth(), 1));

  // A sequência termina hoje se já estudou; senão, ontem (hoje ainda está em aberto).
  const diasAcesos = useMemo(() => {
    const dias = new Set<string>();
    const fim = new Date(hoje);
    if (!feitaHoje) fim.setDate(fim.getDate() - 1);
    for (let voltar = 0; voltar < sequencia; voltar += 1) {
      const data = new Date(fim);
      data.setDate(fim.getDate() - voltar);
      dias.add(chaveDoDia(data));
    }
    return dias;
  }, [sequencia, hoje, feitaHoje]);
  const diasComProtecao = useMemo(() => new Set(diasProtegidos), [diasProtegidos]);

  // O gás segurou ontem (ou hoje)? Vira o aviso do topo, como o "você ganhou
  // um bloqueio" do Duolingo.
  const ontem = new Date(hoje);
  ontem.setDate(ontem.getDate() - 1);
  const gasSalvouOntem = diasComProtecao.has(chaveDoDia(ontem)) || diasComProtecao.has(chaveDoDia(hoje));

  const ano = mesVisivel.getFullYear();
  const mes = mesVisivel.getMonth();
  const primeiraColuna = new Date(ano, mes, 1).getDay();
  const totalDeDias = new Date(ano, mes + 1, 0).getDate();
  const celulas: (number | null)[] = [...Array(primeiraColuna).fill(null), ...Array.from({ length: totalDeDias }, (_, i) => i + 1)];
  while (celulas.length % 7) celulas.push(null);
  const semanas = Array.from({ length: celulas.length / 7 }, (_, i) => celulas.slice(i * 7, i * 7 + 7));

  const mudarMes = (passo: number) => setMesVisivel(new Date(ano, mes + passo, 1));
  const aceso = (dia: number | null) => dia !== null && diasAcesos.has(chaveDoDia(new Date(ano, mes, dia)));

  return (
    <>
      {/* Cabeçalho: o número e a chama na cor da faixa. */}
      <div className="relative flex items-center justify-between gap-4 px-1 pb-2 pt-1">
        <div className="min-w-0">
          <p className="text-[4.2rem] font-black leading-none tabular-nums" style={{ color: cores.cor }}>{sequencia}</p>
          <p className="mt-1 text-xl font-black" style={{ color: cores.cor }}>
            {sequencia === 1 ? "dia de ofensiva!" : "dias de ofensiva!"}
          </p>
          {(streakRecorde ?? 0) > 0 && (
            <p className="mt-1 text-[0.8rem] font-bold text-muted-foreground">
              Seu recorde é de {streakRecorde} {streakRecorde === 1 ? "dia" : "dias"}.
            </p>
          )}
          {sequencia > 0 && !feitaHoje && (
            <p className="mt-1 text-[0.8rem] font-black text-orange-500">Estude hoje para manter a chama acesa!</p>
          )}
        </div>
        <div className="relative shrink-0">
          <ChamaDupla className="size-28" aceso={sequencia > 0} dias={sequencia} protegido={protecoes > 0} />
          <BotaoCompartilharOfensiva dias={sequencia} className="absolute -right-1 -top-1" />
        </div>
      </div>
      <OfensivaPerfeita />

      {/* O gás: o aviso de quando ele salvou o dia, ou quantos você tem guardados. */}
      <div className="mt-3 flex items-center gap-3 rounded-[20px] border border-border bg-card px-4 py-4">
        <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-2xl", protecoes > 0 || gasSalvouOntem ? "bg-violet-500/15" : "bg-muted")}>
          <GasOfensiva className="size-7" />
        </span>
        <div className="min-w-0 flex-1">
          {gasSalvouOntem ? (
            <p className="text-[0.92rem] font-black leading-snug">
              O <span className="text-violet-500">gás de ofensiva</span> manteve a sua chama acesa ontem!
            </p>
          ) : (
            <p className="text-[0.92rem] font-black leading-snug">
              {protecoes > 0
                ? `Você tem ${protecoes} ${protecoes === 1 ? "gás" : "gases"} de ofensiva`
                : "Você está sem gás de ofensiva!"}
            </p>
          )}
          <p className="mt-0.5 text-[0.75rem] text-muted-foreground">
            Se você não estudar num dia, um gás é usado sozinho e a chama não apaga.
          </p>
          <Link
            href="/loja"
            onClick={onNavegar}
            className="mt-1 inline-block text-[0.78rem] font-black uppercase tracking-[0.06em] text-primary"
          >
            {protecoes > 0 ? "Ver na loja" : "Obter gás"}
          </Link>
        </div>
      </div>

      {/* Calendário */}
      <h3 className="mb-2 mt-5 px-1 text-[1.05rem] font-black">Calendário da ofensiva</h3>
      <div className="rounded-[20px] border border-border bg-card px-2.5 py-4">
        <div className="mb-3 flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => mudarMes(-1)}
            aria-label="Mês anterior"
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-muted"
          >
            <ChevronLeft className="size-5" strokeWidth={2.6} />
          </button>
          <p className="text-[0.92rem] font-black">
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

        <div className="grid grid-cols-7">
          {DIAS_DA_SEMANA.map((dia) => (
            <span key={dia} className="pb-2 text-center text-[0.7rem] font-black text-muted-foreground">
              {dia}
            </span>
          ))}
        </div>

        <div className="flex flex-col gap-2.5 pt-2">
          {semanas.map((semana, linha) => {
            // As faixas da semana: cada trecho de dias acesos seguidos vira uma pílula.
            const trechos: { inicio: number; fim: number }[] = [];
            semana.forEach((dia, coluna) => {
              if (!aceso(dia)) return;
              const ultimo = trechos[trechos.length - 1];
              if (ultimo && ultimo.fim === coluna - 1) ultimo.fim = coluna;
              else trechos.push({ inicio: coluna, fim: coluna });
            });
            return (
              <div key={linha} className="relative grid h-10 grid-cols-7">
                {trechos.map((trecho) => (
                  <span
                    key={trecho.inicio}
                    aria-hidden
                    className="absolute inset-y-0.5 rounded-full shadow-[inset_0_-3px_0_rgba(0,0,0,0.12)]"
                    style={{
                      left: `calc(${(trecho.inicio / 7) * 100}% + 2px)`,
                      width: `calc(${((trecho.fim - trecho.inicio + 1) / 7) * 100}% - 4px)`,
                      background: cores.faixa,
                    }}
                  />
                ))}
                {semana.map((dia, coluna) => {
                  if (dia === null) return <span key={`vazio-${coluna}`} />;
                  const chave = chaveDoDia(new Date(ano, mes, dia));
                  const marcado = aceso(dia);
                  const protegido = diasComProtecao.has(chave);
                  const ehHoje = chave === chaveDoDia(hoje);
                  const futuro = new Date(ano, mes, dia) > hoje;
                  return (
                    <span key={dia} className="relative flex items-center justify-center">
                      {protegido && (
                        <span
                          className="absolute -top-3 left-1/2 z-10 flex size-7 -translate-x-1/2 items-center justify-center rounded-full border-2 border-violet-500 bg-card shadow-sm"
                          title="O gás manteve a chama acesa neste dia"
                        >
                          <GasOfensiva className="size-4" />
                        </span>
                      )}
                      <span
                        className={cn(
                          "relative flex size-8 items-center justify-center rounded-full text-[0.85rem] font-black tabular-nums",
                          marcado ? "text-white" : futuro ? "text-muted-foreground/45" : "text-muted-foreground",
                          ehHoje && !marcado && "ring-2 ring-inset"
                        )}
                        style={ehHoje && !marcado ? ({ ["--tw-ring-color" as string]: cores.cor, color: cores.cor }) : undefined}
                      >
                        {dia}
                      </span>
                    </span>
                  );
                })}
              </div>
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
/** Dias seguidos com a meta diária cumprida: a partir de 7, a chama ganha o contorno dourado. */
function OfensivaPerfeita() {
  const { perfil } = usePerfil();
  const dias = perfil?.ofensivaPerfeita ?? 0;
  if (dias < 1) return null;
  return (
    <p className="relative mt-1 inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1 text-[0.75rem] font-black text-amber-600 dark:text-amber-300">
      <ChamaDupla className="size-4" dias={perfil?.streakAtual} perfeita={dias >= 7} />
      {dias >= 7 ? `Ofensiva perfeita: ${dias} dias com a meta cumprida` : `Meta cumprida ${dias} ${dias === 1 ? "dia" : "dias"} seguidos (7 dá a chama dourada)`}
    </p>
  );
}

function AbaAmigos({ onNavegar }: { onNavegar?: () => void }) {
  const [amigos, setAmigos] = useState<AmigoNaOfensiva[] | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    let valeu = true;
    listarAmigosNaOfensiva()
      .then((lista) => valeu && setAmigos(lista))
      .catch(() => valeu && setAmigos([]));
    return () => {
      valeu = false;
    };
  }, []);

  const lembrar = async (amigo: AmigoNaOfensiva) => {
    setOcupado(amigo.id);
    setAviso(null);
    try {
      await cutucar(amigo.id);
      setAmigos((atual) => atual?.map((a) => (a.id === amigo.id ? { ...a, cutucadoHoje: true } : a)) ?? null);
      setAviso(`${amigo.nome.split(" ")[0]} vai receber seu lembrete.`);
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "Não deu certo agora.");
    } finally {
      setOcupado(null);
    }
  };

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

  return (
    <div className="flex flex-col gap-2.5">
      {aviso && <p role="status" className="rounded-xl bg-muted px-3 py-2 text-center text-[0.8rem] font-black">{aviso}</p>}
      <div className="overflow-hidden rounded-[20px] border border-border bg-card">
        {amigos.map((amigo, posicao) => (
          <div key={amigo.id} className={cn("flex items-center gap-3 px-4 py-3", posicao > 0 && "border-t border-border")}>
            <Link href={`/perfil/${amigo.id}`} onClick={onNavegar} className="flex min-w-0 flex-1 items-center gap-3">
              <UserAvatar
                iniciais={amigo.nome.slice(0, 2).toUpperCase()}
                avatarId={amigo.avatarId}
                bannerColor={amigo.bannerColor}
                size="sm"
                className="[&>div]:rounded-full [&>div]:ring-0"
              />
              <span className="min-w-0 flex-1">
                <b className="block truncate text-[0.88rem]">{amigo.nome}</b>
                <span className={cn("text-[0.72rem]", amigo.emRisco ? "font-bold text-orange-500" : "text-muted-foreground")}>
                  {amigo.estudouHoje ? "Já estudou hoje" : amigo.emRisco ? "Ainda não estudou hoje" : "Sem ofensiva"}
                </span>
              </span>
            </Link>
            {amigo.emRisco && (
              <button
                type="button"
                disabled={amigo.cutucadoHoje || ocupado === amigo.id}
                onClick={() => void lembrar(amigo)}
                className="flex shrink-0 items-center gap-1 rounded-lg bg-orange-500/15 px-2.5 py-1.5 text-[0.65rem] font-black uppercase text-orange-500 disabled:bg-muted disabled:text-muted-foreground"
              >
                <Hand className="size-3.5" />
                {amigo.cutucadoHoje ? "Feito" : "Cutucar"}
              </button>
            )}
            <span className={cn("flex shrink-0 items-center gap-1 text-[0.95rem] font-black", amigo.ofensiva > 0 ? faixaDaChama(amigo.ofensiva).texto : "text-muted-foreground")}>
              <ChamaDupla className="size-6" aceso={amigo.estudouHoje} dias={amigo.ofensiva} />
              {amigo.ofensiva}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
