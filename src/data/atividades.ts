export interface Alternativa {
  id: string;
  texto: string;
}

/** Selo pequeno acima da pergunta — "sintaxe nova" grifa o termo em
 * destaque no enunciado/código, "mais difícil" só sinaliza a dificuldade. */
export interface SeloPergunta {
  tipo: "novo" | "dificil";
  texto: string;
}

interface PerguntaBase {
  id: string;
  enunciado: string;
  selo?: SeloPergunta;
  /** Só combina com selo tipo "novo": a palavra/símbolo que aparece grifado
   * onde surgir dentro do enunciado ou do código. */
  termoDestacado?: string;
}

export interface PerguntaAlternativa extends PerguntaBase {
  tipo: "alternativa" | "logica";
  /** Só a "logica" mostra um trecho de código acima das alternativas —
   * a pergunta pede pra prever o que ele faz. */
  codigo?: string;
  alternativas: Alternativa[];
  respostaCorretaId: string;
}

export interface PerguntaCompletar extends PerguntaBase {
  tipo: "completar";
  /** Código partido em volta do espaço em branco. */
  codigoAntes: string;
  codigoDepois: string;
  /** Blocos pra tocar/arrastar — inclui a resposta certa e distratores. */
  blocos: string[];
  respostaCorreta: string;
}

export interface PerguntaCodigo extends PerguntaBase {
  tipo: "codigo";
  /** Código já escrito no editor quando a pergunta abre. */
  codigoInicial: string;
  /** Texto que precisa aparecer num console.log pra considerar certo —
   * verificado rodando o código de verdade, não comparando texto puro. */
  resultadoEsperado: string;
  dica: string;
}

export type Pergunta = PerguntaAlternativa | PerguntaCompletar | PerguntaCodigo;

export interface SlideIntroducao {
  titulo: string;
  texto: string;
  /** Trecho de código opcional, mostrado num bloco de código. */
  codigo?: string;
}

export interface Atividade {
  /** Mesmo id da lição em data/trilha.ts — é assim que a tela de atividade
   * sabe qual conteúdo mostrar quando o botão da trilha é clicado. */
  licaoId: string;
  /** Ensina o conteúdo antes das perguntas — cada pergunta tem que dar pra
   * responder só com o que apareceu aqui, senão vira "decoreba" sem
   * aprender nada. */
  introducao: SlideIntroducao[];
  perguntas: Pergunta[];
}

/**
 * Só a primeira lição (u1_licao_1, "Intro ao JS") tem conteúdo de verdade
 * por enquanto — as outras 79 ainda não têm atividade escrita, então a rota
 * /atividade/[id] cai num "em construção" pra elas.
 */
export const atividades: Record<string, Atividade> = {
  u1_licao_1: {
    licaoId: "u1_licao_1",
    introducao: [
      {
        titulo: "O que é JavaScript?",
        texto:
          "JavaScript é uma linguagem de programação: um jeito de dar instruções pro computador executar. Diferente do HTML (que estrutura o conteúdo) ou do CSS (que cuida do visual), é o JavaScript que faz uma página reagir, calcular e tomar decisões.",
      },
      {
        titulo: "Onde o JavaScript roda?",
        texto:
          "Ele nasceu rodando só dentro do navegador, pra dar interatividade às páginas. Hoje, com uma ferramenta chamada Node.js, o mesmo JavaScript também roda em servidores — ou seja, dá pra usar essa linguagem tanto no navegador quanto no servidor.",
      },
      {
        titulo: "Comentários no código",
        texto:
          "Comentários são anotações que o computador ignora ao executar — servem só pra explicar o código pra quem lê. Em JavaScript, uma linha de comentário começa com duas barras.",
        codigo: "// Isso é um comentário e não é executado",
      },
      {
        titulo: "console.log()",
        texto:
          "console.log(...) é o jeito mais comum de mostrar um valor na tela enquanto o código roda — tudo que estiver dentro dos parênteses aparece no console.",
        codigo: 'console.log("Olá, mundo!")',
      },
      {
        titulo: "Linguagem interpretada",
        texto:
          "JavaScript é interpretado: o código roda direto, linha por linha, sem precisar ser compilado (convertido pra outro formato) antes. Isso deixa o ciclo de escrever e testar bem mais rápido.",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "O que é JavaScript?",
        alternativas: [
          { id: "a", texto: "Uma linguagem de marcação para estruturar páginas" },
          { id: "b", texto: "Uma linguagem de programação que roda no navegador (e fora dele)" },
          { id: "c", texto: "Um banco de dados" },
          { id: "d", texto: "Um framework de CSS" },
        ],
        respostaCorretaId: "b",
      },
      {
        id: "p2",
        tipo: "alternativa",
        enunciado: "Onde o código JavaScript pode rodar?",
        alternativas: [
          { id: "a", texto: "Só dentro do navegador" },
          { id: "b", texto: "Só em servidores" },
          { id: "c", texto: "No navegador e também no servidor, com o Node.js" },
          { id: "d", texto: "Só em aplicativos mobile" },
        ],
        respostaCorretaId: "c",
      },
      {
        id: "p3",
        tipo: "logica",
        selo: { tipo: "novo", texto: "Sintaxe nova" },
        termoDestacado: "//",
        enunciado: "O que aparece no console quando esse código roda?",
        codigo: 'console.log("A")\n// console.log("B")\nconsole.log("C")',
        alternativas: [
          { id: "a", texto: "A, B e C" },
          { id: "b", texto: "Só A e C — a linha com // é ignorada" },
          { id: "c", texto: "Só B" },
          { id: "d", texto: "Dá erro" },
        ],
        respostaCorretaId: "b",
      },
      {
        id: "p4",
        tipo: "completar",
        selo: { tipo: "novo", texto: "Sintaxe nova" },
        termoDestacado: "//",
        enunciado: "Complete pra transformar essa linha num comentário:",
        codigoAntes: "",
        codigoDepois: ' console.log("Isso não deveria rodar")',
        blocos: ["//", "/*", "##", "<!--"],
        respostaCorreta: "//",
      },
      {
        id: "p5",
        tipo: "codigo",
        selo: { tipo: "dificil", texto: "Escreva o código" },
        enunciado: 'Escreva um código que imprima exatamente "JS é show" no console.',
        codigoInicial: "",
        resultadoEsperado: "JS é show",
        dica: 'Use console.log("...") com o texto entre aspas.',
      },
    ],
  },
};
