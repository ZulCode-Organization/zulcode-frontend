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
 * As 8 lições da unidade 1 (Fundamentos do JavaScript) têm conteúdo de
 * verdade — as outras 72 ainda não, então a rota /atividade/[id] cai num
 * "em construção" pra elas.
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

  u1_licao_2: {
    licaoId: "u1_licao_2",
    introducao: [
      {
        titulo: "O que é uma variável?",
        texto:
          "Uma variável é um espaço com nome pra guardar um valor — um número, um texto, o que for — e usar esse valor de novo mais tarde no código, sem precisar reescrever ele toda hora.",
      },
      {
        titulo: "let",
        texto:
          "let declara uma variável que pode mudar de valor depois. É a opção mais comum pra coisas que vão variar ao longo do código.",
        codigo: 'let idade = 25\nidade = 26 // pode mudar o valor depois',
      },
      {
        titulo: "const",
        texto:
          "const também declara uma variável, mas ela não pode ser reatribuída depois — tentar mudar o valor de uma const dá erro. Use quando o valor não deve mudar.",
        codigo: 'const nome = "Ana"\n// nome = "Bia"  →  dá erro',
      },
      {
        titulo: "var",
        texto:
          "var é a forma mais antiga de declarar variáveis em JavaScript. Ainda funciona, mas hoje em dia let e const são preferidos — var tem comportamentos mais confusos que os dois resolvem.",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "O que é uma variável em JavaScript?",
        alternativas: [
          { id: "a", texto: "Um espaço com nome pra guardar um valor e reaproveitar depois" },
          { id: "b", texto: "Um tipo de comentário" },
          { id: "c", texto: "Uma função pronta da linguagem" },
          { id: "d", texto: "Um erro de sintaxe" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "logica",
        selo: { tipo: "novo", texto: "Sintaxe nova" },
        termoDestacado: "const",
        enunciado: "O que acontece quando esse código roda?",
        codigo: 'const cor = "azul"\ncor = "verde"\nconsole.log(cor)',
        alternativas: [
          { id: "a", texto: "Imprime \"verde\"" },
          { id: "b", texto: "Imprime \"azul\"" },
          { id: "c", texto: "Dá erro — const não pode ser reatribuída" },
          { id: "d", texto: "Imprime undefined" },
        ],
        respostaCorretaId: "c",
      },
      {
        id: "p3",
        tipo: "completar",
        selo: { tipo: "novo", texto: "Sintaxe nova" },
        termoDestacado: "let",
        enunciado: "Complete pra declarar uma variável que vai poder mudar de valor depois:",
        codigoAntes: "",
        codigoDepois: " contador = 0",
        blocos: ["let", "const", "if", "function"],
        respostaCorreta: "let",
      },
      {
        id: "p4",
        tipo: "codigo",
        selo: { tipo: "dificil", texto: "Escreva o código" },
        enunciado: 'Declare uma variável chamada mensagem com o valor "Oi" e imprima ela no console.',
        codigoInicial: "",
        resultadoEsperado: "Oi",
        dica: 'let mensagem = "Oi"\nconsole.log(mensagem)',
      },
    ],
  },

  u1_licao_3: {
    licaoId: "u1_licao_3",
    introducao: [
      {
        titulo: "Números",
        texto:
          "JavaScript não separa número inteiro de número decimal — os dois são só \"number\". Dá pra somar, subtrair, multiplicar e dividir eles direto.",
        codigo: "42\n3.14",
      },
      {
        titulo: "Texto (strings)",
        texto:
          "Texto em JavaScript é chamado de string, e fica sempre entre aspas — simples ou duplas, tanto faz.",
        codigo: '"olá"\n\'oi\'',
      },
      {
        titulo: "Booleanos",
        texto: "Um booleano só tem dois valores possíveis: true (verdadeiro) ou false (falso). É o tipo usado pra tomar decisões no código.",
        codigo: "true\nfalse",
      },
      {
        titulo: "typeof",
        texto: "typeof é um operador que devolve o tipo de um valor, como texto. Serve pra descobrir com o que você está lidando.",
        codigo: 'console.log(typeof "oi") // "string"',
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "Qual desses valores é um número em JavaScript?",
        alternativas: [
          { id: "a", texto: "42" },
          { id: "b", texto: "\"42\"" },
          { id: "c", texto: "true" },
          { id: "d", texto: "typeof" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "logica",
        selo: { tipo: "novo", texto: "Sintaxe nova" },
        termoDestacado: "typeof",
        enunciado: "O que aparece no console quando esse código roda?",
        codigo: "console.log(typeof true)",
        alternativas: [
          { id: "a", texto: "\"boolean\"" },
          { id: "b", texto: "\"true\"" },
          { id: "c", texto: "true" },
          { id: "d", texto: "\"string\"" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "completar",
        enunciado: "Complete pra descobrir o tipo do valor guardado em idade:",
        codigoAntes: "console.log(",
        codigoDepois: "(idade))",
        blocos: ["typeof", "console.log", "let", "=="],
        respostaCorreta: "typeof",
      },
      {
        id: "p4",
        tipo: "alternativa",
        enunciado: "Qual desses valores é uma string?",
        alternativas: [
          { id: "a", texto: "10" },
          { id: "b", texto: "true" },
          { id: "c", texto: "\"10\"" },
          { id: "d", texto: "typeof 10" },
        ],
        respostaCorretaId: "c",
      },
      {
        id: "p5",
        tipo: "codigo",
        selo: { tipo: "dificil", texto: "Escreva o código" },
        enunciado: 'Escreva um código que imprima o tipo do valor 10 (deve mostrar "number").',
        codigoInicial: "",
        resultadoEsperado: "number",
        dica: "console.log(typeof 10)",
      },
    ],
  },

  u1_licao_4: {
    licaoId: "u1_licao_4",
    introducao: [
      {
        titulo: "Operadores aritméticos",
        texto: "Os operadores +, -, * e / fazem contas com números, exatamente como na matemática — inclusive respeitando a ordem: multiplicação e divisão vêm antes de soma e subtração.",
        codigo: "5 + 3\n10 / 2\n2 + 3 * 2 // 8, não 10",
      },
      {
        titulo: "Operadores de comparação",
        texto: "== e != comparam dois valores e devolvem true ou false — se são iguais ou diferentes.",
        codigo: "5 == 5   // true\n5 != 3   // true",
      },
      {
        titulo: "=== (comparação estrita)",
        texto: "=== compara o valor E o tipo ao mesmo tempo — é mais seguro que ==, que às vezes considera coisas de tipos diferentes como \"iguais\".",
        codigo: '5 === "5"  // false — tipos diferentes\n5 === 5    // true',
      },
      {
        titulo: "&& e ||",
        texto: "&& (\"e\") só é verdadeiro se as duas condições forem verdadeiras. || (\"ou\") é verdadeiro se pelo menos uma das duas for.",
        codigo: "true && false  // false\ntrue || false  // true",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "logica",
        enunciado: "O que aparece no console quando esse código roda?",
        codigo: "console.log(2 + 3 * 2)",
        alternativas: [
          { id: "a", texto: "10" },
          { id: "b", texto: "8" },
          { id: "c", texto: "12" },
          { id: "d", texto: "Dá erro" },
        ],
        respostaCorretaId: "b",
      },
      {
        id: "p2",
        tipo: "alternativa",
        enunciado: 'O que 5 === "5" retorna?',
        alternativas: [
          { id: "a", texto: "true" },
          { id: "b", texto: "false" },
          { id: "c", texto: "5" },
          { id: "d", texto: "Dá erro" },
        ],
        respostaCorretaId: "b",
      },
      {
        id: "p3",
        tipo: "completar",
        selo: { tipo: "novo", texto: "Sintaxe nova" },
        termoDestacado: "===",
        enunciado: "Complete pra comparar valor e tipo ao mesmo tempo (mais seguro que ==):",
        codigoAntes: "idade ",
        codigoDepois: " 18",
        blocos: ["===", "=", "+", "typeof"],
        respostaCorreta: "===",
      },
      {
        id: "p4",
        tipo: "alternativa",
        enunciado: "O que o operador && exige pra dar true?",
        alternativas: [
          { id: "a", texto: "Que pelo menos uma das condições seja verdadeira" },
          { id: "b", texto: "Que nenhuma das condições seja verdadeira" },
          { id: "c", texto: "Que as duas condições sejam verdadeiras" },
          { id: "d", texto: "Não tem relação com condições" },
        ],
        respostaCorretaId: "c",
      },
      {
        id: "p5",
        tipo: "codigo",
        selo: { tipo: "dificil", texto: "Escreva o código" },
        enunciado: "Escreva um código que imprima o resultado de 10 dividido por 2.",
        codigoInicial: "",
        resultadoEsperado: "5",
        dica: "console.log(10 / 2)",
      },
    ],
  },

  u1_licao_5: {
    licaoId: "u1_licao_5",
    introducao: [
      {
        titulo: "if",
        texto: "if executa um bloco de código só quando a condição dentro dos parênteses é verdadeira.",
        codigo: 'if (idade >= 18) {\n  console.log("Maior de idade")\n}',
      },
      {
        titulo: "else",
        texto: "else roda quando a condição do if é falsa — é o \"caso contrário\".",
        codigo: 'if (idade >= 18) {\n  console.log("Maior de idade")\n} else {\n  console.log("Menor de idade")\n}',
      },
      {
        titulo: "else if",
        texto: "else if encadeia mais de uma condição, testada em ordem até uma delas ser verdadeira.",
        codigo: 'if (nota >= 9) {\n  console.log("Excelente")\n} else if (nota >= 7) {\n  console.log("Bom")\n} else {\n  console.log("Precisa melhorar")\n}',
      },
      {
        titulo: "switch",
        texto: "switch compara um valor com várias opções — é uma alternativa mais organizada a um monte de else if seguidos.",
        codigo: 'switch (dia) {\n  case "seg":\n    console.log("Início da semana")\n    break\n  default:\n    console.log("Outro dia")\n}',
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "logica",
        enunciado: "O que aparece no console quando esse código roda?",
        codigo: 'let idade = 15\nif (idade >= 18) {\n  console.log("Maior de idade")\n} else {\n  console.log("Menor de idade")\n}',
        alternativas: [
          { id: "a", texto: "\"Maior de idade\"" },
          { id: "b", texto: "\"Menor de idade\"" },
          { id: "c", texto: "15" },
          { id: "d", texto: "Dá erro" },
        ],
        respostaCorretaId: "b",
      },
      {
        id: "p2",
        tipo: "alternativa",
        selo: { tipo: "novo", texto: "Sintaxe nova" },
        termoDestacado: "else",
        enunciado: "Quando o bloco do else roda?",
        alternativas: [
          { id: "a", texto: "Sempre, além do if" },
          { id: "b", texto: "Quando a condição do if é falsa" },
          { id: "c", texto: "Antes do if" },
          { id: "d", texto: "Nunca roda sozinho" },
        ],
        respostaCorretaId: "b",
      },
      {
        id: "p3",
        tipo: "completar",
        enunciado: "Complete pra rodar o bloco só quando a nota for maior ou igual a 7:",
        codigoAntes: "",
        codigoDepois: ' (nota >= 7) { console.log("Aprovado") }',
        blocos: ["if", "let", "typeof", "for"],
        respostaCorreta: "if",
      },
      {
        id: "p4",
        tipo: "codigo",
        selo: { tipo: "dificil", texto: "Escreva o código" },
        enunciado: 'Escreva um if que imprima "Ok" quando a condição for true.',
        codigoInicial: "",
        resultadoEsperado: "Ok",
        dica: 'if (true) {\n  console.log("Ok")\n}',
      },
    ],
  },

  u1_licao_6: {
    licaoId: "u1_licao_6",
    introducao: [
      {
        titulo: "for",
        texto: "for repete um bloco de código um número definido de vezes — muito usado quando você já sabe quantas voltas quer dar.",
        codigo: "for (let i = 0; i < 3; i++) {\n  console.log(i)\n}\n// imprime 0, 1 e 2",
      },
      {
        titulo: "while",
        texto: "while repete um bloco enquanto uma condição continuar verdadeira — usado quando você não sabe de antemão quantas voltas vai precisar.",
        codigo: "let x = 0\nwhile (x < 3) {\n  console.log(x)\n  x++\n}",
      },
      {
        titulo: "break",
        texto: "break interrompe o laço antes dele terminar naturalmente, assim que é executado.",
        codigo: "for (let i = 0; i < 10; i++) {\n  if (i === 3) break\n  console.log(i)\n}\n// imprime só 0, 1 e 2",
      },
      {
        titulo: "Cuidado com loop infinito",
        texto: "Se a condição de um laço nunca virar falsa, ele nunca para — trava o programa. É sempre bom garantir que algo dentro do laço vai levar a condição a ficar falsa em algum momento.",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "logica",
        enunciado: "O que aparece no console quando esse código roda?",
        codigo: "for (let i = 0; i < 3; i++) {\n  console.log(i)\n}",
        alternativas: [
          { id: "a", texto: "0, 1, 2" },
          { id: "b", texto: "1, 2, 3" },
          { id: "c", texto: "0, 1, 2, 3" },
          { id: "d", texto: "Só 3" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "alternativa",
        enunciado: "Quando faz mais sentido usar um while em vez de um for?",
        alternativas: [
          { id: "a", texto: "Quando você já sabe exatamente quantas voltas quer dar" },
          { id: "b", texto: "Quando você não sabe de antemão quantas voltas vai precisar" },
          { id: "c", texto: "Nunca — for substitui o while" },
          { id: "d", texto: "Só dentro de funções" },
        ],
        respostaCorretaId: "b",
      },
      {
        id: "p3",
        tipo: "completar",
        selo: { tipo: "novo", texto: "Sintaxe nova" },
        termoDestacado: "while",
        enunciado: "Complete pra repetir o bloco enquanto x for menor que 5:",
        codigoAntes: "",
        codigoDepois: " (x < 5) { x++ }",
        blocos: ["while", "if", "const", "typeof"],
        respostaCorreta: "while",
      },
      {
        id: "p4",
        tipo: "codigo",
        selo: { tipo: "dificil", texto: "Escreva o código" },
        enunciado: "Escreva um for que vá de 0 até 2 (i < 3) imprimindo i em cada volta — a última linha impressa deve ser 2.",
        codigoInicial: "",
        resultadoEsperado: "2",
        dica: "for (let i = 0; i < 3; i++) {\n  console.log(i)\n}",
      },
    ],
  },

  u1_licao_7: {
    licaoId: "u1_licao_7",
    introducao: [
      {
        titulo: "function",
        texto: "function declara um bloco de código com nome que pode ser reaproveitado, chamando esse nome sempre que precisar.",
        codigo: 'function saudacao() {\n  console.log("Oi!")\n}\nsaudacao() // "Oi!"',
      },
      {
        titulo: "Parâmetros",
        texto: "Parâmetros são valores que a função recebe entre parênteses, pra usar dentro dela — cada chamada pode passar valores diferentes.",
        codigo: "function somar(a, b) {\n  console.log(a + b)\n}\nsomar(2, 3) // 5",
      },
      {
        titulo: "return",
        texto: "return devolve um valor pra quem chamou a função, em vez de só imprimir algo — assim dá pra usar o resultado depois.",
        codigo: "function somar(a, b) {\n  return a + b\n}\nconst total = somar(2, 3) // total vale 5",
      },
      {
        titulo: "Arrow function",
        texto: "Arrow function é uma forma mais curta de escrever funções, usando =>.",
        codigo: "const somar = (a, b) => a + b\nsomar(2, 3) // 5",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "Pra que serve uma função em JavaScript?",
        alternativas: [
          { id: "a", texto: "Agrupar um bloco de código pra reaproveitar depois" },
          { id: "b", texto: "Guardar um único valor fixo" },
          { id: "c", texto: "Comentar uma linha de código" },
          { id: "d", texto: "Comparar dois valores" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "logica",
        selo: { tipo: "novo", texto: "Sintaxe nova" },
        termoDestacado: "return",
        enunciado: "O que aparece no console quando esse código roda?",
        codigo: "function somar(a, b) {\n  return a + b\n}\nconsole.log(somar(2, 3))",
        alternativas: [
          { id: "a", texto: "5" },
          { id: "b", texto: "\"a + b\"" },
          { id: "c", texto: "undefined" },
          { id: "d", texto: "Dá erro" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "completar",
        selo: { tipo: "novo", texto: "Sintaxe nova" },
        termoDestacado: "function",
        enunciado: "Complete pra declarar uma função chamada saudacao:",
        codigoAntes: "",
        codigoDepois: ' saudacao() {\n  console.log("Oi")\n}',
        blocos: ["function", "let", "if", "return"],
        respostaCorreta: "function",
      },
      {
        id: "p4",
        tipo: "codigo",
        selo: { tipo: "dificil", texto: "Escreva o código" },
        enunciado: "Escreva uma função chamada dobro que recebe um número e imprime o dobro dele. Depois chame dobro(4).",
        codigoInicial: "",
        resultadoEsperado: "8",
        dica: "function dobro(n) {\n  console.log(n * 2)\n}\ndobro(4)",
      },
    ],
  },

  u1_licao_8: {
    licaoId: "u1_licao_8",
    introducao: [
      {
        titulo: "Você chegou até aqui!",
        texto:
          "Nessa unidade você viu: o que é JavaScript, variáveis (let e const), tipos de dados, operadores, condicionais (if/else) e laços (for/while) e funções. Essa revisão junta um pouco de cada assunto.",
      },
      {
        titulo: "Tudo junto",
        texto:
          "Uma função pode usar variáveis, operadores e condicionais por dentro — é assim que os pedaços que você aprendeu se combinam num código de verdade.",
        codigo: 'function classificar(nota) {\n  if (nota >= 7) {\n    return "Aprovado"\n  }\n  return "Reprovado"\n}\nconsole.log(classificar(8))',
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "Qual palavra-chave você usa pra declarar uma variável que NÃO vai mudar de valor?",
        alternativas: [
          { id: "a", texto: "let" },
          { id: "b", texto: "const" },
          { id: "c", texto: "var" },
          { id: "d", texto: "function" },
        ],
        respostaCorretaId: "b",
      },
      {
        id: "p2",
        tipo: "logica",
        enunciado: "O que aparece no console quando esse código roda?",
        codigo: 'function classificar(nota) {\n  if (nota >= 7) {\n    return "Aprovado"\n  }\n  return "Reprovado"\n}\nconsole.log(classificar(5))',
        alternativas: [
          { id: "a", texto: "\"Aprovado\"" },
          { id: "b", texto: "\"Reprovado\"" },
          { id: "c", texto: "5" },
          { id: "d", texto: "undefined" },
        ],
        respostaCorretaId: "b",
      },
      {
        id: "p3",
        tipo: "completar",
        enunciado: "Complete pra repetir um bloco 3 vezes, com i indo de 0 a 2:",
        codigoAntes: "for (let i = 0; i < 3; i",
        codigoDepois: ") { console.log(i) }",
        blocos: ["++", "--", "+=", "=="],
        respostaCorreta: "++",
      },
      {
        id: "p4",
        tipo: "codigo",
        selo: { tipo: "dificil", texto: "Escreva o código" },
        enunciado:
          "Escreva uma função chamada ehPar que recebe um número, e usa % 2 === 0 num if pra imprimir \"Par\" quando o número for par. Chame ehPar(4).",
        codigoInicial: "",
        resultadoEsperado: "Par",
        dica: 'function ehPar(n) {\n  if (n % 2 === 0) {\n    console.log("Par")\n  }\n}\nehPar(4)',
      },
    ],
  },
};

/**
 * Id fixo da única lição semeada de verdade no backend (prisma/seed.ts, que
 * cria com `id: 'seed-lesson-js-1'` via upsert — não é uuid gerado, então dá
 * pra referenciar esse id direto no front). Ela se chama "Variáveis e
 * Tipos" e testa `const`, então reaproveita o conteúdo de u1_licao_2, que
 * ensina exatamente let/const/var antes de perguntar isso — assim a única
 * lição conectada de verdade ao backend já tem uma introdução e perguntas
 * de verdade, em vez de cair na tela "em construção".
 */
export const LICAO_REAL_VARIAVEIS_ID = "seed-lesson-js-1";
atividades[LICAO_REAL_VARIAVEIS_ID] = atividades.u1_licao_2;
