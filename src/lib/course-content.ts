import { Atividade, Pergunta, TesteDaFuncao, TipoDeAula } from "@/data/atividades";

interface ApiExercise {
  id: string;
  type: "MULTIPLE_CHOICE" | "FILL_BLANK" | "CODE_ORDER" | "TRUE_FALSE" | "CODE_TESTS" | "FIND_BUG" | "TYPE_ANSWER";
  prompt: string;
  content: Record<string, unknown>;
}

type ApiLessonKind = "CONCEPT" | "CODE" | "DEBUG" | "EXAM" | "PROJECT" | "UNIT_EXAM";

interface ApiLesson {
  id: string;
  title: string;
  xpReward: number;
  exercises: ApiExercise[];
  introduction: { title: string; text: string; codigo?: string }[];
  theoryCompleted: boolean;
  stageCount?: number;
  completedStages?: number;
  completed: boolean;
  /** Formato novo: uma aula só, sem etapas. Nulo nas aulas antigas. */
  kind?: ApiLessonKind | null;
  minutes?: number | null;
  goals?: unknown;
  source?: string | null;
  summary?: unknown;
  language?: string;
}

const TIPO_DE_AULA: Record<ApiLessonKind, TipoDeAula> = {
  CONCEPT: "conceito",
  CODE: "codigo",
  DEBUG: "depuracao",
  EXAM: "prova",
  PROJECT: "projeto",
  UNIT_EXAM: "prova-da-unidade",
};

const asStrings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const textoOuNada = (value: unknown) => (typeof value === "string" && value.trim() ? value : undefined);

/** Aula no formato novo: tem tipo e não tem etapas. */
export const aulaDoFormatoNovo = (lesson: Pick<ApiLesson, "kind">) => !!lesson.kind;

function perguntaDaApi(exercise: ApiExercise): Pergunta {
  const content = exercise.content ?? {};
  const correctAnswer = String(content.correctAnswer ?? "");
  // Opcionais das aulas novas: o que o Zul diz e o porquê de cada resposta
  // (na mesma ordem das opções).
  const fala = textoOuNada(content.fala);
  const porques = asStrings(content.explanations);
  const explicacoesPor = (chaves: string[]) =>
    porques.length ? Object.fromEntries(chaves.map((chave, i) => [chave, porques[i]]).filter(([, texto]) => texto)) : undefined;
  const base = { id: exercise.id, enunciado: exercise.prompt, fala };

  if (exercise.type === "FILL_BLANK") {
    const blocos = asStrings(content.options);
    return {
      ...base,
      tipo: "completar",
      explicacoes: explicacoesPor(blocos),
      codigoAntes: String(content.codeBefore ?? ""),
      codigoDepois: String(content.codeAfter ?? ""),
      blocos,
      respostaCorreta: correctAnswer,
    };
  }

  if (exercise.type === "CODE_ORDER") {
    return {
      ...base,
      tipo: "codigo",
      codigoInicial: String(content.initialCode ?? ""),
      resultadoEsperado: correctAnswer,
      dica: String(content.hint ?? "Use o playground para testar sua resposta."),
    };
  }

  if (exercise.type === "CODE_TESTS") {
    const testes = (Array.isArray(content.tests) ? content.tests : [])
      .filter((t): t is { args?: unknown; expected?: unknown } => !!t && typeof t === "object")
      .map((t): TesteDaFuncao => ({ args: Array.isArray(t.args) ? t.args : [], esperado: t.expected }));
    return {
      ...base,
      tipo: "testes",
      nomeDaFuncao: String(content.functionName ?? ""),
      codigoInicial: String(content.initialCode ?? ""),
      testes,
      dicas: asStrings(content.hints).slice(0, 3),
      solucao: textoOuNada(content.solution),
      continuaDoAnterior: content.carryOver === true,
      explicacoes: textoOuNada(content.explanation) ? { certo: String(content.explanation) } : undefined,
    };
  }

  if (exercise.type === "FIND_BUG") {
    const codigo = String(content.code ?? "");
    return {
      ...base,
      tipo: "bug",
      codigo,
      linhaDoErro: Math.max(1, Math.trunc(Number(content.bugLine)) || 1),
      explicacoes: textoOuNada(content.explanation) ? { certo: String(content.explanation) } : undefined,
    };
  }

  if (exercise.type === "TYPE_ANSWER") {
    return {
      ...base,
      tipo: "digitar",
      codigo: textoOuNada(content.code),
      respostaCorreta: correctAnswer,
      aceitas: asStrings(content.accepted),
      explicacoes: textoOuNada(content.explanation) ? { certo: String(content.explanation) } : undefined,
    };
  }

  const options = asStrings(content.options);
  const codigo = textoOuNada(content.code);
  return {
    ...base,
    // Com um trecho de código, a pergunta vira "o que este código faz?": o
    // jogador mostra o código acima das alternativas.
    tipo: codigo ? "logica" : "alternativa",
    ...(codigo && { codigo }),
    explicacoes: explicacoesPor(options.map((_, index) => String(index))),
    alternativas: options.map((texto, index) => ({ id: String(index), texto })),
    respostaCorretaId: options.includes(correctAnswer) ? String(options.indexOf(correctAnswer)) : correctAnswer,
  };
}

/** Converte o formato persistido pelo CMS para os componentes do player.
 *  Nas aulas antigas, `stage` escolhe a etapa; nas novas não há etapa. */
export function atividadeDaApi(lesson: ApiLesson, stage: string): Atividade {
  const nova = aulaDoFormatoNovo(lesson);
  const perguntas = lesson.exercises
    .filter((exercise) => nova || exercise.content?.stage === stage)
    .map(perguntaDaApi);
  const comIntroducao = nova || stage === "THEORY" || stage === "STAGE_1";
  const introducao = comIntroducao
    ? (lesson.introduction ?? []).map((slide) => ({ titulo: slide.title, texto: slide.text, codigo: slide.codigo }))
    : [];

  if (!nova || !lesson.kind) return { licaoId: lesson.id, introducao, perguntas, linguagem: lesson.language };

  const resumo = lesson.summary && typeof lesson.summary === "object" ? (lesson.summary as Record<string, unknown>) : null;
  return {
    licaoId: lesson.id,
    introducao,
    perguntas,
    tipoDeAula: TIPO_DE_AULA[lesson.kind],
    titulo: lesson.title,
    minutos: lesson.minutes ?? undefined,
    metas: asStrings(lesson.goals),
    fonte: lesson.source ?? undefined,
    resumo: resumo && textoOuNada(resumo.texto) ? { texto: String(resumo.texto), codigo: textoOuNada(resumo.codigo) } : undefined,
    linguagem: lesson.language,
  };
}

export type { ApiLesson };
