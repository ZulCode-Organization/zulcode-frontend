import { Atividade, Pergunta } from "@/data/atividades";

interface ApiExercise {
  id: string;
  type: "MULTIPLE_CHOICE" | "FILL_BLANK" | "CODE_ORDER" | "TRUE_FALSE";
  prompt: string;
  content: Record<string, unknown>;
}

interface ApiLesson {
  id: string;
  title: string;
  xpReward: number;
  exercises: ApiExercise[];
}

const asStrings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

/** Converte o formato persistido pelo CMS para os componentes do player. */
export function atividadeDaApi(lesson: ApiLesson): Atividade {
  const perguntas: Pergunta[] = lesson.exercises.map((exercise) => {
    const content = exercise.content ?? {};
    const correctAnswer = String(content.correctAnswer ?? "");

    if (exercise.type === "FILL_BLANK") {
      return {
        id: exercise.id,
        tipo: "completar",
        enunciado: exercise.prompt,
        codigoAntes: String(content.codeBefore ?? ""),
        codigoDepois: String(content.codeAfter ?? ""),
        blocos: asStrings(content.options),
        respostaCorreta: correctAnswer,
      };
    }

    if (exercise.type === "CODE_ORDER") {
      return {
        id: exercise.id,
        tipo: "codigo",
        enunciado: exercise.prompt,
        codigoInicial: String(content.initialCode ?? ""),
        resultadoEsperado: correctAnswer,
        dica: String(content.hint ?? "Use o playground para testar sua resposta."),
      };
    }

    const options = asStrings(content.options);
    return {
      id: exercise.id,
      tipo: "alternativa",
      enunciado: exercise.prompt,
      alternativas: options.map((texto, index) => ({ id: String(index), texto })),
      respostaCorretaId: options.includes(correctAnswer) ? String(options.indexOf(correctAnswer)) : correctAnswer,
    };
  });

  return { licaoId: lesson.id, introducao: [], perguntas };
}

export type { ApiLesson };
