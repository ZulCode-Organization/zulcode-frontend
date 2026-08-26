"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Feather, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Atividade } from "@/data/atividades";
import { LicaoTrilha } from "@/lib/types/trilha";
import { ResultadoExecucao } from "@/hooks/use-executar-js";
import { CodeBlock } from "./code-block";
import { SeloPerguntaBadge } from "./selo-pergunta";
import { ExercicioAlternativa } from "./exercicio-alternativa";
import { ExercicioCompletar } from "./exercicio-completar";
import { ExercicioCodigo } from "./exercicio-codigo";
import { TelaConclusao } from "./tela-conclusao";

interface ActivityPlayerProps {
  atividade: Atividade;
  licao: LicaoTrilha;
  /** Quando presente, é chamado uma única vez ao concluir a lição — quem
   * fornece decide se isso é uma lição real (chama POST
   * /lessons/:id/complete de verdade) ou não (undefined, mantém o XP só
   * como celebração visual, sem nada persistido). */
  aoConcluir?: (acertos: number, total: number) => Promise<{ xpEarned: number } | null>;
  /** Chamado uma única vez ao concluir, independente de aoConcluir — é o
   * gancho pra marcar progresso local (localStorage) nas lições que não
   * existem no backend, sem misturar isso com XP/rede. */
  onConcluirLocal?: () => void;
  /** Consome uma pena ao errar. Se a última pena acabar, a aula é encerrada. */
  aoErrar?: () => Promise<{ lives: number; isUnlimited?: boolean } | null>;
  vidas: number;
  vidasIlimitadas?: boolean;
}

type Fase = "introducao" | "quiz" | "concluida" | "sem-penas";

interface MoldeAtividadeProps {
  progresso: number;
  vidas: number;
  vidasIlimitadas?: boolean;
  onSair: () => void;
  children: ReactNode;
  rodape: ReactNode;
}

/**
 * Layout compartilhado da introdução e das perguntas: cabeçalho (sair +
 * progresso) fixo, conteúdo central e o bloco de código de verdade grudado
 * na lateral direita em telas grandes — o mesmo painel o tempo todo (não
 * remonta ao trocar de pergunta), então o código digitado não se perde
 * enquanto a pessoa avança na lição.
 */
function MoldeAtividade({ progresso, vidas, vidasIlimitadas, onSair, children, rodape }: MoldeAtividadeProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="flex items-center gap-4 px-4 py-4 lg:px-8">
        <button
          type="button"
          onClick={onSair}
          aria-label="Sair da lição"
          className="flex size-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
        >
          <X className="size-5" />
        </button>
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${progresso}%` }}
          />
        </div>
        <span className="flex shrink-0 items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm font-black text-rose-500" title={vidasIlimitadas ? "Penas ilimitadas" : `${vidas} penas restantes`}><Feather className="size-4" />{vidasIlimitadas ? "∞" : vidas}</span>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-8 px-4 pb-4 lg:px-8">
        <div className="flex flex-1 flex-col">
          <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center">{children}</div>
          {rodape}
        </div>

        {/* Some em telas estreitas — não tem espaço sobrando lá, e a tela
            de fazer a lição continua funcionando normal sem o playground. */}
        <aside className="hidden w-[380px] shrink-0 py-6 lg:block">
          <div className="sticky top-6">
            <CodeBlock titulo="Playground" />
            <p className="mt-3 text-center text-[0.78rem] text-muted-foreground">
              Testa aqui à vontade enquanto aprende — roda JavaScript de verdade.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

/**
 * Tela de fazer a lição: primeiro ensina o conteúdo (telas de introdução),
 * só depois pergunta — cada pergunta dá pra responder com o que apareceu na
 * introdução, então vira aprendizado de verdade em vez de chute. Quatro
 * formatos de pergunta (alternativa, lógica com código, completar com
 * blocos, escrever código de verdade), até acabar — aí mostra a tela de
 * "lição concluída". Quando `aoConcluir` é passado (lição real, conectada
 * ao backend), o XP exibido ali é o de verdade, devolvido por POST
 * /lessons/:id/complete — nas outras, continua sendo só uma celebração
 * visual com o xp mockado da lição.
 */
export function ActivityPlayer({ atividade, licao, aoConcluir, onConcluirLocal, aoErrar, vidas: vidasIniciais, vidasIlimitadas = false }: ActivityPlayerProps) {
  const router = useRouter();
  const { introducao, perguntas } = atividade;
  const totalPassos = introducao.length + perguntas.length;

  const [fase, setFase] = useState<Fase>(introducao.length > 0 ? "introducao" : "quiz");
  const [indiceIntro, setIndiceIntro] = useState(0);
  // Fila das perguntas que ainda faltam: quem erra volta pro fim dela, e a
  // lição só termina quando a fila esvazia — ou seja, tem que acertar todas.
  const [fila, setFila] = useState<number[]>(() => perguntas.map((_, indice) => indice));
  // Perguntas erradas pelo menos uma vez. Acertar na repescagem destrava a
  // lição, mas a porcentagem do fim continua contando como erro.
  const [errouAlguma, setErrouAlguma] = useState<number[]>([]);
  const [resposta, setResposta] = useState<string | null>(null);
  const [verificado, setVerificado] = useState(false);
  const [correto, setCorreto] = useState(false);
  const [xpConfirmado, setXpConfirmado] = useState(licao.xp);
  const [salvandoXp, setSalvandoXp] = useState(false);
  const [erroSalvarXp, setErroSalvarXp] = useState(false);
  const [vidas, setVidas] = useState(vidasIniciais);
  const acertos = perguntas.length - errouAlguma.length;
  const jaEnviouRef = useRef(false);
  const jaMarcouLocalRef = useRef(false);
  const penalizouQuestaoRef = useRef(false);

  const sair = () => router.push("/home");

  // Dispara uma única vez por visita à tela, no instante em que a lição
  // termina — mesmo se der "Revisar lição" e concluir de novo, não reenvia
  // (o backend soma XP a cada chamada, sem checar se já tinha sido feita).
  useEffect(() => {
    if (fase !== "concluida" || !aoConcluir || jaEnviouRef.current) return;
    jaEnviouRef.current = true;
    setSalvandoXp(true);
    setErroSalvarXp(false);

    aoConcluir(acertos, perguntas.length)
      .then((resultado) => {
        if (resultado) {
          setXpConfirmado(resultado.xpEarned);
        } else {
          setErroSalvarXp(true);
        }
      })
      .finally(() => setSalvandoXp(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase]);

  // Efeito separado (e independente de aoConcluir) só pra marcar progresso
  // local — dispara mesmo em lições sem XP real, é o que libera a próxima
  // lição mockada na trilha.
  useEffect(() => {
    if (fase !== "concluida" || !onConcluirLocal || jaMarcouLocalRef.current) return;
    jaMarcouLocalRef.current = true;
    onConcluirLocal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase]);

  const reiniciar = () => {
    setFase(introducao.length > 0 ? "introducao" : "quiz");
    setIndiceIntro(0);
    setFila(perguntas.map((_, indice) => indice));
    setErrouAlguma([]);
    setResposta(null);
    setVerificado(false);
    setCorreto(false);
    penalizouQuestaoRef.current = false;
  };

  if (fase === "sem-penas") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center">
        <span className="flex size-20 items-center justify-center rounded-[28px] bg-rose-500/10 text-rose-500"><Feather className="size-10" /></span>
        <h1 className="mt-6 text-3xl font-black">Suas penas acabaram</h1>
        <p className="mt-3 max-w-md text-muted-foreground">Infelizmente não foi dessa vez. Recupere suas penas e tente novamente mais tarde — cada uma volta em uma hora.</p>
        <button type="button" onClick={sair} className="mt-7 rounded-2xl bg-primary px-7 py-3.5 text-sm font-black text-primary-foreground">Voltar para a jornada</button>
      </div>
    );
  }

  if (fase === "concluida") {
    return (
      <TelaConclusao
        xp={xpConfirmado}
        xpBase={licao.xp}
        acertos={acertos}
        total={perguntas.length}
        onRevisar={reiniciar}
        onContinuar={sair}
        salvando={salvandoXp}
        erroSalvar={erroSalvarXp}
      />
    );
  }

  // A barra mede pergunta resolvida (que saiu da fila), não posição — assim
  // ela não avança quando a pessoa erra e a pergunta volta pro fim.
  const passoGlobal =
    fase === "introducao" ? indiceIntro : introducao.length + (perguntas.length - fila.length);
  const progresso = Math.round((passoGlobal / totalPassos) * 100);

  const avancarIntro = () => {
    if (indiceIntro + 1 >= introducao.length) {
      setFase("quiz");
      return;
    }
    setIndiceIntro((atual) => atual + 1);
  };

  if (fase === "introducao") {
    const slide = introducao[indiceIntro];
    return (
      <MoldeAtividade
        progresso={progresso}
        vidas={vidas}
        vidasIlimitadas={vidasIlimitadas}
        onSair={sair}
        rodape={
          <div className="py-5">
            <button
              type="button"
              onClick={avancarIntro}
              className="zc-press zc-press-shadow w-full rounded-2xl bg-primary py-3.5 text-[0.8rem] font-black uppercase tracking-[0.06em] text-primary-foreground"
              style={{ ["--zc-press-color" as string]: "color-mix(in srgb, var(--primary) 70%, black)" }}
            >
              Continuar
            </button>
          </div>
        }
      >
        <p className="text-xs font-black uppercase tracking-[0.08em] text-primary">Aprenda antes de responder</p>
        <h1 className="mt-2 text-xl font-black text-foreground sm:text-2xl">{slide.titulo}</h1>
        <p className="mt-4 text-[1rem] leading-relaxed text-muted-foreground">{slide.texto}</p>

        {slide.codigo && (
          <pre className="mt-5 overflow-x-auto rounded-xl border border-border bg-muted/50 px-4 py-3.5 font-mono text-[0.85rem] text-foreground">
            {slide.codigo}
          </pre>
        )}
      </MoldeAtividade>
    );
  }

  const pergunta = perguntas[fila[0]];

  const aplicarResultado = (ok: boolean) => {
    setVerificado(true);
    setCorreto(ok);
    if (!ok && !penalizouQuestaoRef.current) {
      penalizouQuestaoRef.current = true;
      aoErrar?.().then((estado) => {
        if (!estado || estado.lives <= 0) setFase("sem-penas");
        else if (!estado.isUnlimited) setVidas(estado.lives);
      });
    }
  };

  const verificarSelecao = () => {
    if (!resposta) return;
    if (pergunta.tipo === "alternativa" || pergunta.tipo === "logica") {
      aplicarResultado(resposta === pergunta.respostaCorretaId);
    } else if (pergunta.tipo === "completar") {
      aplicarResultado(resposta === pergunta.respostaCorreta);
    }
  };

  // O tipo "codigo" deixa rodar de novo depois de errar (ajusta e roda de
  // novo), então quem conta o acerto é sempre o "continuar" — baseado no
  // resultado mais recente — pra não contar em dobro se rodar certo 2x.
  const aoRodarCodigo = (_resultadoExecucao: ResultadoExecucao, ok: boolean) => {
    aplicarResultado(ok);
  };

  const continuar = () => {
    const atual = fila[0];
    // Acertou, sai da fila; errou, vai pro fim dela e aparece de novo depois.
    const restante = correto ? fila.slice(1) : [...fila.slice(1), atual];

    if (!correto && !errouAlguma.includes(atual)) {
      setErrouAlguma((anteriores) => [...anteriores, atual]);
    }

    setFila(restante);

    if (restante.length === 0) {
      setFase("concluida");
      return;
    }

    setResposta(null);
    setVerificado(false);
    setCorreto(false);
    penalizouQuestaoRef.current = false;
  };

  const podeVerificar = pergunta.tipo !== "codigo" && !!resposta;

  return (
    <MoldeAtividade
      progresso={progresso}
      vidas={vidas}
      vidasIlimitadas={vidasIlimitadas}
      onSair={sair}
      rodape={
        verificado ? (
          <div
            className={cn(
              "-mx-4 border-t-2 px-4 py-5 lg:-mx-8 lg:px-8",
              correto ? "border-emerald-500 bg-emerald-500/10" : "border-red-500 bg-red-500/10"
            )}
          >
            <div className="mx-auto flex w-full max-w-xl flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full text-white",
                    correto ? "bg-emerald-500" : "bg-red-500"
                  )}
                >
                  {correto ? <Check className="size-5" /> : <X className="size-5" />}
                </span>
                <div>
                  <p className={cn("font-black", correto ? "text-emerald-600" : "text-red-600")}>
                    {correto ? "Boa!" : "Não foi dessa vez"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={continuar}
                className={cn(
                  "zc-press zc-press-shadow rounded-2xl px-8 py-3.5 text-[0.8rem] font-black uppercase tracking-[0.06em] text-white",
                  correto ? "bg-emerald-500" : "bg-red-500"
                )}
                style={{
                  ["--zc-press-color" as string]: correto
                    ? "color-mix(in srgb, #10b981 70%, black)"
                    : "color-mix(in srgb, #ef4444 70%, black)",
                }}
              >
                Continuar
              </button>
            </div>
          </div>
        ) : pergunta.tipo === "codigo" ? null : (
          <div className="py-5">
            <button
              type="button"
              disabled={!podeVerificar}
              onClick={verificarSelecao}
              className="zc-press zc-press-shadow w-full rounded-2xl bg-primary py-3.5 text-[0.8rem] font-black uppercase tracking-[0.06em] text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
              style={{ ["--zc-press-color" as string]: "color-mix(in srgb, var(--primary) 70%, black)" }}
            >
              Verificar
            </button>
          </div>
        )
      }
    >
      {pergunta.selo && <SeloPerguntaBadge selo={pergunta.selo} />}

      {(pergunta.tipo === "alternativa" || pergunta.tipo === "logica") && (
        <ExercicioAlternativa
          pergunta={pergunta}
          selecionada={resposta}
          onSelecionar={setResposta}
          verificado={verificado}
        />
      )}

      {pergunta.tipo === "completar" && (
        <ExercicioCompletar
          pergunta={pergunta}
          resposta={resposta}
          onEscolherBloco={setResposta}
          verificado={verificado}
        />
      )}

      {pergunta.tipo === "codigo" && (
        <ExercicioCodigo pergunta={pergunta} onRodar={aoRodarCodigo} />
      )}
    </MoldeAtividade>
  );
}
