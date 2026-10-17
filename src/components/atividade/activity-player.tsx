"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { Atividade, Pergunta, TipoDeAula } from "@/data/atividades";
import { LicaoTrilha } from "@/lib/types/trilha";
import { ResultadoExecucao } from "@/hooks/use-executar-js";
import { prepararPython, rodaNoAparelho } from "@/hooks/use-executar-codigo";
import { CodeBlock } from "./code-block";
import { SeloPerguntaBadge } from "./selo-pergunta";
import { ExercicioAlternativa } from "./exercicio-alternativa";
import { ExercicioCompletar } from "./exercicio-completar";
import { ExercicioCodigo } from "./exercicio-codigo";
import { TelaConclusao } from "./tela-conclusao";
import { prepararReacoes, reagir } from "@/lib/reacoes";
import { FilaDeComemoracoes } from "@/components/comemoracoes/fila";
import { comemoracoesDaLicao, type Comemoracao, type ResultadoDaLicao } from "@/lib/types/comemoracao";
import { PenaPorAnuncio } from "@/components/anuncios/pena-por-anuncio";
import { licaoConcluidaParaAnuncio, mostrarIntersticialSePronto } from "@/lib/anuncios";
import { BarraDaAula } from "./barra-da-aula";
import { FalaDoZul, PoseDoZul, ZulDaAula } from "./zul-da-aula";
import { ExercicioTestes } from "./exercicio-testes";
import { ExercicioBug } from "./exercicio-bug";
import { ExercicioDigitar, respostaDigitadaConfere } from "./exercicio-digitar";
import { AberturaDaAula } from "./abertura-da-aula";
import { GabaritoDaProva, RespostaDaProva } from "./gabarito-da-prova";
import "./aula.css";

/** O Zul de cada tipo de pergunta e o que ele diz quando a pergunta não traz fala própria. */
const ZUL_DA_PERGUNTA: Record<Pergunta["tipo"], { pose: PoseDoZul; fala: string }> = {
  alternativa: { pose: "coco", fala: "Pense com calma e escolha a certa." },
  logica: { pose: "lupa", fala: "Leia o código linha por linha: o que ele faz?" },
  completar: { pose: "equilibrio", fala: "Qual peça encaixa no espaço vazio?" },
  codigo: { pose: "escrevendo", fala: "Escreva e rode. Pode errar à vontade." },
  testes: { pose: "escrevendo", fala: "Os testes conferem sua função. Pode errar à vontade." },
  bug: { pose: "lagarta", fala: "Tem um bug escondido aqui. Em qual linha?" },
  digitar: { pose: "lupa", fala: "Rode o código na cabeça: o que aparece?" },
};

/** Na prova, nada de resposta na hora: tudo vai para o gabarito do fim. */
const TIPOS_DE_PROVA: TipoDeAula[] = ["prova", "prova-da-unidade"];
const NOTA_MINIMA_DA_PROVA_DA_UNIDADE = 70;

/** A resposta dada confere com a certa? (As perguntas de código conferem rodando.) */
function respostaConfere(pergunta: Pergunta, resposta: string | null): boolean {
  if (resposta === null) return false;
  if (pergunta.tipo === "alternativa" || pergunta.tipo === "logica") return resposta === pergunta.respostaCorretaId;
  if (pergunta.tipo === "completar") return resposta === pergunta.respostaCorreta;
  if (pergunta.tipo === "bug") return resposta === String(pergunta.linhaDoErro);
  if (pergunta.tipo === "digitar") return respostaDigitadaConfere(pergunta, resposta);
  return false;
}

/** O porquê que aparece na faixa depois de verificar. Sem explicação escrita,
 * quem errou ao menos vê qual era a resposta certa. */
function porqueDaResposta(pergunta: Pergunta, resposta: string | null, correto: boolean): string | null {
  const escrito = resposta ? pergunta.explicacoes?.[resposta] : undefined;
  if (escrito) return escrito;
  // Bug, digitar e testes têm uma explicação só, a da resposta certa.
  if (pergunta.explicacoes?.certo) return pergunta.explicacoes.certo;
  if (correto) return null;
  if (pergunta.tipo === "alternativa" || pergunta.tipo === "logica") {
    const certa = pergunta.alternativas.find((alt) => alt.id === pergunta.respostaCorretaId);
    return certa ? `A resposta certa é: ${certa.texto}` : null;
  }
  if (pergunta.tipo === "completar") return `O que encaixa aqui é: ${pergunta.respostaCorreta}`;
  if (pergunta.tipo === "codigo") return `A saída esperada era: ${pergunta.resultadoEsperado}`;
  if (pergunta.tipo === "bug") return `O erro está na linha ${pergunta.linhaDoErro}.`;
  if (pergunta.tipo === "digitar") return `O console mostra: ${pergunta.respostaCorreta}`;
  return null;
}

/** Para o gabarito: a resposta dada e a certa em texto. */
function descreverResposta(pergunta: Pergunta, resposta: string | null) {
  const porque = porqueDaResposta(pergunta, resposta, true);
  if (pergunta.tipo === "alternativa" || pergunta.tipo === "logica") {
    const texto = (id: string | null) => pergunta.alternativas.find((alt) => alt.id === id)?.texto ?? "";
    return { dada: texto(resposta), certa: texto(pergunta.respostaCorretaId), porque };
  }
  if (pergunta.tipo === "completar") return { dada: resposta ?? "", certa: pergunta.respostaCorreta, porque };
  if (pergunta.tipo === "bug") return { dada: resposta ? `linha ${resposta}` : "", certa: `linha ${pergunta.linhaDoErro}`, porque };
  if (pergunta.tipo === "digitar") return { dada: resposta ?? "", certa: pergunta.respostaCorreta, porque };
  return { dada: "", certa: "", porque };
}

interface ActivityPlayerProps {
  atividade: Atividade;
  licao: LicaoTrilha;
  /** Quando presente, é chamado uma única vez ao concluir a lição — quem
   * fornece decide se isso é uma lição real (chama POST
   * /lessons/:id/complete de verdade) ou não (undefined, mantém o XP só
   * como celebração visual, sem nada persistido). */
  aoConcluir?: (acertos: number, total: number) => Promise<ResultadoDaLicao | null>;
  /** Chamado uma única vez ao concluir, independente de aoConcluir — é o
   * gancho pra marcar progresso local (localStorage) nas lições que não
   * existem no backend, sem misturar isso com XP/rede. */
  onConcluirLocal?: () => void;
  /** Consome uma pena ao errar. Se a última pena acabar, a aula é encerrada. */
  aoErrar?: () => Promise<{ lives: number; isUnlimited?: boolean } | null>;
  vidas: number;
  vidasIlimitadas?: boolean;
  /** Quem não é PRO vê anúncio: o de tela cheia ao sair da lição concluída e o
   * que devolve uma pena quando elas acabam. A prévia do administrativo não. */
  comAnuncios?: boolean;
  /** Avisado na primeira resposta de cada pergunta (certa ou errada). É o
   * histórico que mostra no administrativo quais questões derrubam as
   * pessoas; a repescagem não conta, senão toda questão errada pareceria
   * acertada na segunda. */
  aoResponder?: (perguntaId: string, correto: boolean) => void;
  /** O que "Sair" faz. Sem ele, volta para a trilha; a prévia do editor fecha. */
  aoSair?: () => void;
}

type Fase = "abertura" | "introducao" | "quiz" | "gabarito" | "concluida" | "comemorando" | "sem-penas";

interface MoldeAtividadeProps {
  progresso: number;
  seguidas: number;
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
function MoldeAtividade({ progresso, seguidas, vidas, vidasIlimitadas, onSair, children, rodape }: MoldeAtividadeProps) {
  return (
    <div className="zc-aula flex min-h-dvh flex-col bg-background">
      <BarraDaAula progresso={progresso} seguidas={seguidas} vidas={vidas} vidasIlimitadas={vidasIlimitadas} onSair={onSair} />

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-8 px-4 pb-[env(safe-area-inset-bottom)] lg:px-8">
        <div className="flex flex-1 flex-col">
          <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-4">{children}</div>
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
export function ActivityPlayer({ atividade, licao, aoConcluir, onConcluirLocal, aoErrar, vidas: vidasIniciais, vidasIlimitadas = false, comAnuncios = false, aoResponder, aoSair }: ActivityPlayerProps) {
  const router = useRouter();
  const { introducao, perguntas, tipoDeAula } = atividade;
  const totalPassos = introducao.length + perguntas.length;
  const emProva = !!tipoDeAula && TIPOS_DE_PROVA.includes(tipoDeAula);
  // Os exemplos e os testes rodam no aparelho em JavaScript, TypeScript e Python.
  const podeRodar = rodaNoAparelho(atividade.linguagem);
  // O Python demora a subir na primeira vez: começa a baixar já na abertura.
  useEffect(() => {
    if (atividade.linguagem === "python" && tipoDeAula) prepararPython();
  }, [atividade.linguagem, tipoDeAula]);
  const faseInicial: Fase = tipoDeAula ? "abertura" : introducao.length > 0 ? "introducao" : "quiz";

  const [fase, setFase] = useState<Fase>(faseInicial);
  // Na prova, cada resposta fica guardada para o gabarito do fim.
  const [respostasDaProva, setRespostasDaProva] = useState<Record<string, RespostaDaProva>>({});
  // No projeto guiado, o código de um passo é o começo do próximo: o que está
  // sendo escrito fica na ref e vira o estado quando a pessoa segue.
  const codigoEscritoRef = useRef<string | undefined>(undefined);
  const [codigoDoProjeto, setCodigoDoProjeto] = useState<string | undefined>(undefined);
  const guardarCodigo = useCallback((codigo: string) => {
    codigoEscritoRef.current = codigo;
  }, []);
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
  // Acertos em sequência: a barra mostra "N seguidas!" e fica roxa a partir de 3.
  const [seguidas, setSeguidas] = useState(0);
  // Cada pergunta conta uma vez na sequência, mesmo que o código rode certo duas vezes.
  const contouNaSequenciaRef = useRef(false);
  // O que o servidor mandou comemorar (ofensiva, divisão, conquistas): as
  // telas cheias entre o fim da lição e a volta para a trilha.
  const [comemoracoes, setComemoracoes] = useState<Comemoracao[]>([]);
  const acertos = perguntas.length - errouAlguma.length;
  const jaEnviouRef = useRef(false);

  // Os sons da lição baixam assim que ela abre: o primeiro acerto não pode
  // chegar atrasado.
  useEffect(() => prepararReacoes("toque", "acerto", "erro", "licaoConcluida"), []);
  const jaMarcouLocalRef = useRef(false);
  const penalizouQuestaoRef = useRef(false);

  const sair = () => (aoSair ? aoSair() : router.push("/home"));
  // Ao sair de uma lição concluída — nunca no meio dela — pode vir o anúncio
  // de tela cheia, se ele já carregou; a volta para a trilha espera ele fechar.
  const sairDaLicaoConcluida = async () => {
    if (comAnuncios) await mostrarIntersticialSePronto();
    sair();
  };
  const respondidasRef = useRef<Set<string>>(new Set());

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
          setComemoracoes(comemoracoesDaLicao(resultado));
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
    if (fase !== "concluida" || jaMarcouLocalRef.current) return;
    jaMarcouLocalRef.current = true;
    onConcluirLocal?.();
    // Conta a lição e, se for a vez do anúncio, já o carrega enquanto a pessoa vê o resultado.
    if (comAnuncios) void licaoConcluidaParaAnuncio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase]);

  const reiniciar = () => {
    setFase(faseInicial);
    setRespostasDaProva({});
    codigoEscritoRef.current = undefined;
    setCodigoDoProjeto(undefined);
    setIndiceIntro(0);
    setFila(perguntas.map((_, indice) => indice));
    setErrouAlguma([]);
    setResposta(null);
    setVerificado(false);
    setCorreto(false);
    setSeguidas(0);
    penalizouQuestaoRef.current = false;
    contouNaSequenciaRef.current = false;
  };

  if (fase === "sem-penas") {
    return (
      <div className="zc-aula flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center">
        <ZulDaAula pose="muletas" caiu className="size-44" />
        <h1 className="mt-4 text-3xl font-black">Suas penas acabaram</h1>
        <p className="mt-3 max-w-md text-muted-foreground">Infelizmente não foi dessa vez. Recupere suas penas e tente novamente mais tarde — cada uma volta em uma hora.</p>
        <button type="button" onClick={sair} className="mt-7 rounded-2xl bg-primary px-7 py-3.5 text-sm font-black text-primary-foreground">Voltar para a jornada</button>
        {/* Com a pena do anúncio, a lição continua de onde parou. */}
        {comAnuncios && (
          <PenaPorAnuncio
            visual="botao"
            aoGanhar={(novas) => {
              setVidas(novas);
              setFase("quiz");
            }}
          />
        )}
      </div>
    );
  }

  if (fase === "comemorando") {
    return <FilaDeComemoracoes itens={comemoracoes} aoTerminar={() => void sairDaLicaoConcluida()} />;
  }

  if (fase === "gabarito") {
    const minimo = tipoDeAula === "prova-da-unidade" ? NOTA_MINIMA_DA_PROVA_DA_UNIDADE : undefined;
    const nota = perguntas.length ? Math.round((acertos / perguntas.length) * 100) : 0;
    return (
      <GabaritoDaProva
        perguntas={perguntas}
        respostas={respostasDaProva}
        minimo={minimo}
        descrever={descreverResposta}
        // Abaixo do mínimo a aula não conta: sai sem concluir, ou tenta de novo.
        onContinuar={() => (minimo !== undefined && nota < minimo ? sair() : setFase("concluida"))}
        onTentarDeNovo={reiniciar}
      />
    );
  }

  if (fase === "concluida") {
    return (
      <TelaConclusao
        xp={xpConfirmado}
        xpBase={licao.xp}
        acertos={acertos}
        total={perguntas.length}
        resumo={atividade.resumo}
        onRevisar={reiniciar}
        onContinuar={() => (comemoracoes.length ? setFase("comemorando") : void sairDaLicaoConcluida())}
        salvando={salvandoXp}
        erroSalvar={erroSalvarXp}
      />
    );
  }

  // A barra mede pergunta resolvida (que saiu da fila), não posição — assim
  // ela não avança quando a pessoa erra e a pergunta volta pro fim.
  const passoGlobal =
    fase === "abertura" ? 0 : fase === "introducao" ? indiceIntro : introducao.length + (perguntas.length - fila.length);
  const progresso = Math.round((passoGlobal / totalPassos) * 100);

  if (fase === "abertura" && tipoDeAula) {
    return (
      <MoldeAtividade
        progresso={0}
        seguidas={0}
        vidas={vidas}
        vidasIlimitadas={vidasIlimitadas}
        onSair={sair}
        rodape={
          <div className="py-5">
            <button type="button" onClick={() => setFase(introducao.length > 0 ? "introducao" : "quiz")} className="zc-aula-botao">
              Começar
            </button>
          </div>
        }
      >
        <AberturaDaAula atividade={{ ...atividade, tipoDeAula, titulo: atividade.titulo ?? licao.titulo }} />
      </MoldeAtividade>
    );
  }

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
        seguidas={0}
        vidas={vidas}
        vidasIlimitadas={vidasIlimitadas}
        onSair={sair}
        rodape={
          <div className="py-5">
            <button type="button" onClick={avancarIntro} className="zc-aula-botao">
              {indiceIntro + 1 >= introducao.length ? "Entendi" : "Continuar"}
            </button>
          </div>
        }
      >
        {/* A chave refaz a entrada em cascata a cada tela. */}
        <div key={indiceIntro} className="zc-aula-entra flex flex-col gap-4">
          {/* Na aula nova, quem apresenta é a abertura; aqui o Zul só aparece nas antigas. */}
          {indiceIntro === 0 && !tipoDeAula && (
            <div className="flex items-end gap-3">
              <ZulDaAula pose="lendo" className="size-28" />
              <div className="zc-aula-balao mb-6 text-[0.95rem] text-foreground">Primeiro o conceito. Depois, você pratica.</div>
            </div>
          )}
          <h1 className="text-2xl font-black leading-tight text-foreground">{slide.titulo}</h1>
          <p className="text-[1.02rem] font-medium leading-relaxed text-foreground/80">{slide.texto}</p>
          {/* Exemplo vivo: na aula nova de JavaScript dá para mudar e rodar. */}
          {slide.codigo && tipoDeAula && podeRodar ? (
            <CodeBlock key={`exemplo-${indiceIntro}`} valorInicial={slide.codigo} titulo="Mude e rode" linguagem={atividade.linguagem} />
          ) : (
            slide.codigo && (
              <pre className="overflow-x-auto rounded-2xl border-2 border-border bg-muted/50 px-4 py-3.5 font-mono text-[0.85rem] leading-relaxed text-foreground">
                {slide.codigo}
              </pre>
            )
          )}
        </div>
      </MoldeAtividade>
    );
  }

  const pergunta = perguntas[fila[0]];

  const aplicarResultado = (ok: boolean) => {
    reagir(ok ? "acerto" : "erro");
    setVerificado(true);
    setCorreto(ok);
    if (!contouNaSequenciaRef.current) {
      contouNaSequenciaRef.current = true;
      setSeguidas((atual) => (ok ? atual + 1 : 0));
    }
    if (aoResponder && !respondidasRef.current.has(pergunta.id)) {
      respondidasRef.current.add(pergunta.id);
      aoResponder(pergunta.id, ok);
    }
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
    if (emProva) {
      responderNaProva();
      return;
    }
    aplicarResultado(respostaConfere(pergunta, resposta));
  };

  /** Prova: guarda a resposta e segue, sem mostrar se acertou, sem repescagem e sem gastar pena. */
  const responderNaProva = () => {
    const ok = respostaConfere(pergunta, resposta);
    reagir("toque");
    if (aoResponder && !respondidasRef.current.has(pergunta.id)) {
      respondidasRef.current.add(pergunta.id);
      aoResponder(pergunta.id, ok);
    }
    setRespostasDaProva((atual) => ({ ...atual, [pergunta.id]: { resposta, correto: ok } }));
    if (!ok) setErrouAlguma((anteriores) => [...anteriores, fila[0]]);
    const restante = fila.slice(1);
    setFila(restante);
    setResposta(null);
    if (restante.length === 0) setFase("gabarito");
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
    if (pergunta.tipo === "testes") setCodigoDoProjeto(codigoEscritoRef.current);

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
    contouNaSequenciaRef.current = false;
  };

  // Código e testes se conferem rodando: não têm botão de verificar.
  const seConfereRodando = pergunta.tipo === "codigo" || pergunta.tipo === "testes";
  const podeVerificar = !seConfereRodando && !!resposta?.trim();

  /** Escolher uma opção responde ao toque; tocar de novo na mesma não. */
  const escolher = (valor: string | null) => {
    if (valor !== resposta) reagir("toque");
    setResposta(valor);
  };

  const zul = ZUL_DA_PERGUNTA[pergunta.tipo];
  const porque = verificado ? porqueDaResposta(pergunta, resposta, correto) : null;

  return (
    <MoldeAtividade
      progresso={progresso}
      seguidas={seguidas}
      vidas={vidas}
      vidasIlimitadas={vidasIlimitadas}
      onSair={sair}
      rodape={
        verificado ? (
          // A faixa sobe de baixo com o resultado e o porquê da resposta.
          <div
            className="zc-aula-faixa -mx-4 px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5 lg:-mx-8 lg:px-8"
            data-certo={correto}
            role="status"
          >
            <div className="mx-auto w-full max-w-xl">
              <p className="zc-aula-faixa-titulo flex items-center gap-2.5 text-xl font-black">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--faixa-cor)] text-white">
                  {correto ? <Check className="size-5" strokeWidth={3.5} /> : <X className="size-5" strokeWidth={3.5} />}
                </span>
                {correto ? "Mandou bem!" : "Quase!"}
              </p>
              {porque && (
                <p className="zc-aula-faixa-porque mt-2 text-[0.95rem] font-bold leading-relaxed">{porque}</p>
              )}
              <button
                type="button"
                onClick={continuar}
                data-cor={correto ? "verde" : "vermelho"}
                className="zc-aula-botao mt-4"
              >
                Continuar
              </button>
            </div>
          </div>
        ) : seConfereRodando ? null : (
          <div className="py-5">
            <button type="button" disabled={!podeVerificar} onClick={verificarSelecao} className="zc-aula-botao">
              {!emProva ? "Verificar" : fila.length > 1 ? "Próxima" : "Ver resultado"}
            </button>
          </div>
        )
      }
    >
      {/* A chave refaz a entrada em cascata a cada pergunta, inclusive na repescagem. */}
      <div key={`${fila[0]}-${fila.length}`} className="zc-aula-entra flex flex-col">
      {/* Errou: o Zul derrete. Na prova ele só mostra a contagem. */}
      <FalaDoZul pose={verificado && !correto ? "derretido" : emProva ? "oculos" : zul.pose} className="mb-4">
        {emProva ? `Questão ${perguntas.length - fila.length + 1} de ${perguntas.length}. ${pergunta.fala ?? "Sem pressa."}` : pergunta.fala ?? zul.fala}
      </FalaDoZul>

      {pergunta.selo && <SeloPerguntaBadge selo={pergunta.selo} />}

      {(pergunta.tipo === "alternativa" || pergunta.tipo === "logica") && (
        <ExercicioAlternativa
          pergunta={pergunta}
          selecionada={resposta}
          onSelecionar={escolher}
          verificado={verificado}
        />
      )}

      {pergunta.tipo === "completar" && (
        <ExercicioCompletar
          pergunta={pergunta}
          resposta={resposta}
          onEscolherBloco={escolher}
          verificado={verificado}
        />
      )}

      {pergunta.tipo === "codigo" && (
        <ExercicioCodigo pergunta={pergunta} onRodar={aoRodarCodigo} />
      )}

      {pergunta.tipo === "testes" && (
        <ExercicioTestes
          pergunta={pergunta}
          codigoDeInicio={pergunta.continuaDoAnterior ? codigoDoProjeto : undefined}
          onCodigo={guardarCodigo}
          onPassou={() => aplicarResultado(true)}
          podeRodar={podeRodar}
          linguagem={atividade.linguagem}
        />
      )}

      {pergunta.tipo === "bug" && (
        <ExercicioBug pergunta={pergunta} selecionada={resposta} onSelecionar={escolher} verificado={verificado} />
      )}

      {pergunta.tipo === "digitar" && (
        <ExercicioDigitar
          pergunta={pergunta}
          resposta={resposta}
          onDigitar={setResposta}
          onEnviar={verificarSelecao}
          verificado={verificado}
          correto={correto}
        />
      )}
      </div>
    </MoldeAtividade>
  );
}
