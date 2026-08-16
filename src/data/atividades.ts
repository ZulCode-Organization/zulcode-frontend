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

  // ---------- Unidade 2: Arrays e Objetos ----------

  u2_licao_1: {
    licaoId: "u2_licao_1",
    introducao: [
      {
        titulo: "O que é um array?",
        texto:
          "Um array é uma lista ordenada de valores, guardada numa única variável. Cada valor mora numa posição chamada índice — que começa em 0, não em 1.",
        codigo: 'const frutas = ["maçã", "banana", "uva"]',
      },
      {
        titulo: "Acessando um item",
        texto: "Pra pegar um valor específico, usa colchetes com o índice dele.",
        codigo: 'console.log(frutas[0])\n// "maçã"',
      },
      {
        titulo: "length",
        texto: "A propriedade .length diz quantos itens o array tem.",
        codigo: "console.log(frutas.length)\n// 3",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "O que é um array em JavaScript?",
        alternativas: [
          { id: "a", texto: "Uma lista ordenada de valores, guardada numa variável" },
          { id: "b", texto: "Um tipo de função" },
          { id: "c", texto: "Um comentário no código" },
          { id: "d", texto: "Um número decimal" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "logica",
        selo: { tipo: "novo", texto: "Sintaxe nova" },
        termoDestacado: "[1]",
        enunciado: "O que aparece no console quando esse código roda?",
        codigo: "const numeros = [10, 20, 30]\nconsole.log(numeros[1])",
        alternativas: [
          { id: "a", texto: "10" },
          { id: "b", texto: "20" },
          { id: "c", texto: "30" },
          { id: "d", texto: "undefined" },
        ],
        respostaCorretaId: "b",
      },
      {
        id: "p3",
        tipo: "completar",
        selo: { tipo: "novo", texto: "Sintaxe nova" },
        termoDestacado: "length",
        enunciado: "Complete pra descobrir quantos itens tem o array frutas:",
        codigoAntes: "console.log(frutas.",
        codigoDepois: ")",
        blocos: ["length", "size", "count", "total"],
        respostaCorreta: "length",
      },
    ],
  },

  u2_licao_2: {
    licaoId: "u2_licao_2",
    introducao: [
      {
        titulo: "Adicionando: push",
        texto: "O método .push(valor) adiciona um item no final do array.",
        codigo: "const numeros = [1, 2]\nnumeros.push(3)\nconsole.log(numeros)\n// [1, 2, 3]",
      },
      {
        titulo: "Transformando: map",
        texto:
          ".map() cria um NOVO array aplicando uma função em cada item — o array original não é alterado.",
        codigo: "const dobro = numeros.map(n => n * 2)\nconsole.log(dobro)\n// [2, 4, 6]",
      },
      {
        titulo: "Filtrando: filter",
        texto: ".filter() cria um novo array só com os itens que passam num teste (retornam true).",
        codigo: "const pares = numeros.filter(n => n % 2 === 0)\nconsole.log(pares)\n// [2]",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "O que o método .push() faz?",
        alternativas: [
          { id: "a", texto: "Adiciona um item no final do array" },
          { id: "b", texto: "Remove o primeiro item do array" },
          { id: "c", texto: "Ordena o array" },
          { id: "d", texto: "Conta quantos itens tem o array" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "logica",
        selo: { tipo: "novo", texto: "Sintaxe nova" },
        termoDestacado: "map",
        enunciado: "O que aparece no console quando esse código roda?",
        codigo: "const nums = [1, 2, 3]\nconst triplo = nums.map(n => n * 3)\nconsole.log(triplo.join(\", \"))",
        alternativas: [
          { id: "a", texto: "1, 2, 3" },
          { id: "b", texto: "3, 6, 9" },
          { id: "c", texto: "9" },
          { id: "d", texto: "undefined" },
        ],
        respostaCorretaId: "b",
      },
      {
        id: "p3",
        tipo: "codigo",
        selo: { tipo: "dificil", texto: "Escreva o código" },
        enunciado:
          "Use .filter() pra pegar só os números maiores que 5 de [2, 8, 3, 10], e imprima o resultado juntando com .join(\", \").",
        codigoInicial: "",
        resultadoEsperado: "8, 10",
        dica: 'const nums = [2, 8, 3, 10]\nconst maiores = nums.filter(n => n > 5)\nconsole.log(maiores.join(", "))',
      },
    ],
  },

  u2_licao_3: {
    licaoId: "u2_licao_3",
    introducao: [
      {
        titulo: "O que é um objeto?",
        texto:
          "Um objeto guarda valores em pares de chave e valor — diferente do array, aqui cada valor tem um nome em vez de uma posição numérica.",
        codigo: 'const pessoa = { nome: "Ana", idade: 25 }',
      },
      {
        titulo: "Acessando uma propriedade",
        texto: "Usa ponto seguido do nome da chave pra pegar o valor dela.",
        codigo: 'console.log(pessoa.nome)\n// "Ana"',
      },
      {
        titulo: "Alterando e adicionando",
        texto: "Dá pra mudar o valor de uma chave existente, ou criar uma chave nova, do mesmo jeito.",
        codigo: 'pessoa.idade = 26\npessoa.cidade = "Recife"',
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "Como um objeto guarda seus valores?",
        alternativas: [
          { id: "a", texto: "Em posições numeradas, começando em 0" },
          { id: "b", texto: "Em pares de chave e valor" },
          { id: "c", texto: "Só como texto" },
          { id: "d", texto: "Ele não guarda valores" },
        ],
        respostaCorretaId: "b",
      },
      {
        id: "p2",
        tipo: "logica",
        selo: { tipo: "novo", texto: "Sintaxe nova" },
        termoDestacado: ".",
        enunciado: "O que aparece no console quando esse código roda?",
        codigo: 'const carro = { marca: "Fiat", ano: 2020 }\nconsole.log(carro.marca)',
        alternativas: [
          { id: "a", texto: "\"Fiat\"" },
          { id: "b", texto: "2020" },
          { id: "c", texto: "\"marca\"" },
          { id: "d", texto: "undefined" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "completar",
        enunciado: "Complete pra acessar a idade da pessoa:",
        codigoAntes: "console.log(pessoa",
        codigoDepois: ")",
        blocos: [".idade", "[idade]", "->idade", ":idade"],
        respostaCorreta: ".idade",
      },
    ],
  },

  u2_licao_4: {
    licaoId: "u2_licao_4",
    introducao: [
      {
        titulo: "Desestruturando um objeto",
        texto:
          "Desestruturação é um jeito curto de tirar valores de um objeto e jogar direto em variáveis, usando chaves { }.",
        codigo: 'const pessoa = { nome: "Ana", idade: 25 }\nconst { nome, idade } = pessoa',
      },
      {
        titulo: "Mesmo nome, sem repetir",
        texto: "As variáveis criadas têm o mesmo nome das chaves do objeto — não precisa escrever pessoa.nome de novo.",
        codigo: 'console.log(nome)\n// "Ana"',
      },
      {
        titulo: "Também funciona com array",
        texto: "Em arrays, a desestruturação usa colchetes [ ] e pega os itens na ordem.",
        codigo: "const [primeiro, segundo] = [10, 20]",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "Pra que serve a desestruturação?",
        alternativas: [
          { id: "a", texto: "Pra apagar um objeto" },
          { id: "b", texto: "Pra tirar valores de um objeto/array e jogar em variáveis, de forma curta" },
          { id: "c", texto: "Pra transformar texto em número" },
          { id: "d", texto: "Pra criar um laço" },
        ],
        respostaCorretaId: "b",
      },
      {
        id: "p2",
        tipo: "logica",
        selo: { tipo: "novo", texto: "Sintaxe nova" },
        termoDestacado: "{ }",
        enunciado: "O que aparece no console quando esse código roda?",
        codigo: 'const produto = { nome: "Caneta", preco: 3 }\nconst { preco } = produto\nconsole.log(preco)',
        alternativas: [
          { id: "a", texto: "\"Caneta\"" },
          { id: "b", texto: "3" },
          { id: "c", texto: "\"preco\"" },
          { id: "d", texto: "undefined" },
        ],
        respostaCorretaId: "b",
      },
      {
        id: "p3",
        tipo: "completar",
        selo: { tipo: "novo", texto: "Sintaxe nova" },
        termoDestacado: "const { }",
        enunciado: "Complete pra desestruturar nome e idade de pessoa:",
        codigoAntes: "",
        codigoDepois: " = pessoa",
        blocos: ["const { nome, idade }", "let [nome, idade]", "const nome, idade", "var (nome, idade)"],
        respostaCorreta: "const { nome, idade }",
      },
    ],
  },

  u2_licao_5: {
    licaoId: "u2_licao_5",
    introducao: [
      {
        titulo: "Objetos dentro de objetos",
        texto:
          "Um valor de um objeto pode ser outro objeto — é assim que se representam estruturas mais complexas, como um usuário com um endereço.",
        codigo: 'const usuario = {\n  nome: "Ana",\n  endereco: { cidade: "Recife", cep: "50000-000" }\n}',
      },
      {
        titulo: "Acessando níveis mais fundo",
        texto: "Encadeia pontos pra descer nos níveis, um de cada vez.",
        codigo: 'console.log(usuario.endereco.cidade)\n// "Recife"',
      },
      {
        titulo: "Arrays de objetos",
        texto: "Também é comum ter um array cheio de objetos — cada posição do array é um objeto completo.",
        codigo: 'const alunos = [{ nome: "Bia" }, { nome: "Caio" }]\nconsole.log(alunos[0].nome)\n// "Bia"',
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "logica",
        enunciado: "O que aparece no console quando esse código roda?",
        codigo: 'const usuario = {\n  nome: "Ana",\n  endereco: { cidade: "Recife" }\n}\nconsole.log(usuario.endereco.cidade)',
        alternativas: [
          { id: "a", texto: "\"Ana\"" },
          { id: "b", texto: "\"Recife\"" },
          { id: "c", texto: "\"endereco\"" },
          { id: "d", texto: "undefined" },
        ],
        respostaCorretaId: "b",
      },
      {
        id: "p2",
        tipo: "alternativa",
        enunciado: "Num array de objetos como [{ nome: \"Bia\" }, { nome: \"Caio\" }], como acessa o nome do segundo item?",
        alternativas: [
          { id: "a", texto: "alunos[1].nome" },
          { id: "b", texto: "alunos.nome[1]" },
          { id: "c", texto: "alunos[2].nome" },
          { id: "d", texto: "alunos.nome" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "codigo",
        selo: { tipo: "dificil", texto: "Escreva o código" },
        enunciado:
          "Dado const time = { nome: \"Zul\", sede: { cidade: \"Recife\" } }, imprima a cidade da sede.",
        codigoInicial: "",
        resultadoEsperado: "Recife",
        dica: 'const time = { nome: "Zul", sede: { cidade: "Recife" } }\nconsole.log(time.sede.cidade)',
      },
    ],
  },

  u2_licao_6: {
    licaoId: "u2_licao_6",
    introducao: [
      {
        titulo: "for...of: percorrendo valores",
        texto: "for...of repete um bloco pra cada valor de um array, sem precisar controlar o índice manualmente.",
        codigo: 'const cores = ["azul", "verde", "rosa"]\nfor (const cor of cores) {\n  console.log(cor)\n}',
      },
      {
        titulo: "for...in: percorrendo chaves",
        texto: "for...in repete um bloco pra cada chave de um objeto.",
        codigo: 'const idades = { ana: 25, bia: 30 }\nfor (const chave in idades) {\n  console.log(chave)\n}',
      },
      {
        titulo: "Quando usar cada um",
        texto: "for...of é pra arrays (percorre valores); for...in é pra objetos (percorre chaves).",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "Qual laço é feito pra percorrer os valores de um array?",
        alternativas: [
          { id: "a", texto: "for...in" },
          { id: "b", texto: "for...of" },
          { id: "c", texto: "while...of" },
          { id: "d", texto: "switch" },
        ],
        respostaCorretaId: "b",
      },
      {
        id: "p2",
        tipo: "logica",
        selo: { tipo: "novo", texto: "Sintaxe nova" },
        termoDestacado: "for...in",
        enunciado: "O que aparece no console quando esse código roda?",
        codigo: 'const idades = { ana: 25, bia: 30 }\nfor (const chave in idades) {\n  console.log(chave)\n}',
        alternativas: [
          { id: "a", texto: "25 depois 30" },
          { id: "b", texto: "\"ana\" depois \"bia\"" },
          { id: "c", texto: "\"idades\"" },
          { id: "d", texto: "Dá erro" },
        ],
        respostaCorretaId: "b",
      },
      {
        id: "p3",
        tipo: "completar",
        enunciado: "Complete pra percorrer os valores do array numeros:",
        codigoAntes: "for (const n ",
        codigoDepois: " numeros) { console.log(n) }",
        blocos: ["of", "in", "each", "->"],
        respostaCorreta: "of",
      },
    ],
  },

  u2_licao_7: {
    licaoId: "u2_licao_7",
    introducao: [
      {
        titulo: "O que é JSON?",
        texto:
          "JSON é um formato de texto pra representar dados — muito usado pra trocar informação entre um site e um servidor. A sintaxe é bem parecida com a de um objeto JavaScript.",
        codigo: '{"nome": "Ana", "idade": 25}',
      },
      {
        titulo: "Objeto para texto: stringify",
        texto: "JSON.stringify(objeto) transforma um objeto JavaScript numa string no formato JSON.",
        codigo: 'const pessoa = { nome: "Ana" }\nconsole.log(JSON.stringify(pessoa))\n// \'{"nome":"Ana"}\'',
      },
      {
        titulo: "Texto para objeto: parse",
        texto: "JSON.parse(texto) faz o caminho inverso — transforma uma string JSON de volta num objeto.",
        codigo: 'const obj = JSON.parse(\'{"nome":"Ana"}\')\nconsole.log(obj.nome)\n// "Ana"',
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "O que JSON.stringify() faz?",
        alternativas: [
          { id: "a", texto: "Transforma um objeto JavaScript numa string no formato JSON" },
          { id: "b", texto: "Transforma uma string em número" },
          { id: "c", texto: "Apaga um objeto" },
          { id: "d", texto: "Cria um array vazio" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "logica",
        selo: { tipo: "novo", texto: "Sintaxe nova" },
        termoDestacado: "JSON.parse",
        enunciado: "O que aparece no console quando esse código roda?",
        codigo: 'const obj = JSON.parse(\'{"cidade":"Recife"}\')\nconsole.log(obj.cidade)',
        alternativas: [
          { id: "a", texto: "\"cidade\"" },
          { id: "b", texto: "\"Recife\"" },
          { id: "c", texto: "undefined" },
          { id: "d", texto: "Dá erro" },
        ],
        respostaCorretaId: "b",
      },
      {
        id: "p3",
        tipo: "completar",
        enunciado: "Complete pra transformar o objeto config numa string JSON:",
        codigoAntes: "console.log(JSON.",
        codigoDepois: "(config))",
        blocos: ["stringify", "parse", "toText", "convert"],
        respostaCorreta: "stringify",
      },
    ],
  },

  u2_licao_8: {
    licaoId: "u2_licao_8",
    introducao: [
      {
        titulo: "Você chegou até aqui!",
        texto:
          "Nessa unidade você viu: arrays, métodos de array (push, map, filter), objetos, desestruturação, objetos aninhados, os laços for...of e for...in, e JSON. Essa revisão junta um pouco de cada assunto.",
      },
      {
        titulo: "Tudo junto",
        texto:
          "É bem comum um array guardar vários objetos, e usar .map()/.filter() pra transformar essa lista inteira de uma vez.",
        codigo: 'const alunos = [{ nome: "Bia", nota: 8 }, { nome: "Caio", nota: 5 }]\nconst aprovados = alunos.filter(a => a.nota >= 7)\nconsole.log(aprovados.length)',
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "Qual método cria um novo array só com os itens que passam num teste?",
        alternativas: [
          { id: "a", texto: "map" },
          { id: "b", texto: "filter" },
          { id: "c", texto: "push" },
          { id: "d", texto: "length" },
        ],
        respostaCorretaId: "b",
      },
      {
        id: "p2",
        tipo: "logica",
        enunciado: "O que aparece no console quando esse código roda?",
        codigo: 'const alunos = [{ nome: "Bia", nota: 8 }, { nome: "Caio", nota: 5 }]\nconst aprovados = alunos.filter(a => a.nota >= 7)\nconsole.log(aprovados.length)',
        alternativas: [
          { id: "a", texto: "0" },
          { id: "b", texto: "1" },
          { id: "c", texto: "2" },
          { id: "d", texto: "undefined" },
        ],
        respostaCorretaId: "b",
      },
      {
        id: "p3",
        tipo: "completar",
        enunciado: "Complete pra tirar nome e nota do primeiro aluno do array:",
        codigoAntes: "const ",
        codigoDepois: " = alunos[0]",
        blocos: ["{ nome, nota }", "[nome, nota]", "(nome, nota)", "nome, nota"],
        respostaCorreta: "{ nome, nota }",
      },
      {
        id: "p4",
        tipo: "codigo",
        selo: { tipo: "dificil", texto: "Escreva o código" },
        enunciado:
          "Dado const numeros = [3, 7, 1, 9, 4], use .filter() pra pegar só os maiores que 4, depois .join(\", \") pra imprimir como texto.",
        codigoInicial: "",
        resultadoEsperado: "7, 9",
        dica: 'const numeros = [3, 7, 1, 9, 4]\nconst maiores = numeros.filter(n => n > 4)\nconsole.log(maiores.join(", "))',
      },
    ],
  },

  // ---------- Unidade 3: Funções Avançadas ----------

  u3_licao_1: {
    licaoId: "u3_licao_1",
    introducao: [
      {
        titulo: "Arrow function",
        texto:
          "Arrow function é uma forma mais curta de escrever uma função, usando =>. Faz a mesma coisa que function, com menos sintaxe.",
        codigo: "function dobro(n) {\n  return n * 2\n}\n\nconst dobroSeta = (n) => {\n  return n * 2\n}",
      },
      {
        titulo: "Corpo de uma linha",
        texto: "Quando o corpo é só um return, dá pra tirar as chaves e a palavra return — o valor volta sozinho.",
        codigo: "const dobroCurto = n => n * 2\nconsole.log(dobroCurto(4))\n// 8",
      },
      {
        titulo: "Vários parâmetros",
        texto: "Com mais de um parâmetro, precisa de parênteses em volta deles.",
        codigo: "const soma = (a, b) => a + b",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "O que é uma arrow function?",
        alternativas: [
          { id: "a", texto: "Uma forma mais curta de escrever uma função, com =>" },
          { id: "b", texto: "Um tipo de array" },
          { id: "c", texto: "Um jeito de declarar variáveis" },
          { id: "d", texto: "Um comentário" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "logica",
        selo: { tipo: "novo", texto: "Sintaxe nova" },
        termoDestacado: "=>",
        enunciado: "O que aparece no console quando esse código roda?",
        codigo: "const triplo = n => n * 3\nconsole.log(triplo(5))",
        alternativas: [
          { id: "a", texto: "5" },
          { id: "b", texto: "15" },
          { id: "c", texto: "35" },
          { id: "d", texto: "undefined" },
        ],
        respostaCorretaId: "b",
      },
      {
        id: "p3",
        tipo: "completar",
        selo: { tipo: "novo", texto: "Sintaxe nova" },
        termoDestacado: "=>",
        enunciado: "Complete pra criar uma arrow function que soma a e b:",
        codigoAntes: "const soma = (a, b) ",
        codigoDepois: " a + b",
        blocos: ["=>", "->", "::", "=="],
        respostaCorreta: "=>",
      },
    ],
  },

  u3_licao_2: {
    licaoId: "u3_licao_2",
    introducao: [
      {
        titulo: "O que é escopo?",
        texto:
          "Escopo é a região do código onde uma variável existe e pode ser usada. Fora dessa região, ela não é enxergada.",
        codigo: 'function saudacao() {\n  const mensagem = "Oi"\n  console.log(mensagem)\n}\nsaudacao()\n// console.log(mensagem) aqui fora daria erro',
      },
      {
        titulo: "Escopo de bloco: let e const",
        texto: "let e const só existem dentro do bloco { } onde foram criadas — inclusive dentro de um if ou for.",
        codigo: "if (true) {\n  let x = 10\n}\n// x não existe aqui fora",
      },
      {
        titulo: "var é diferente",
        texto: "var ignora o escopo de bloco — só respeita o escopo da função inteira. É um dos motivos de preferir let/const.",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "O que é escopo?",
        alternativas: [
          { id: "a", texto: "A região do código onde uma variável existe e pode ser usada" },
          { id: "b", texto: "O valor inicial de uma variável" },
          { id: "c", texto: "Um tipo de laço" },
          { id: "d", texto: "Um comentário especial" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "logica",
        enunciado: "O que acontece quando esse código roda?",
        codigo: "if (true) {\n  let x = 10\n}\nconsole.log(x)",
        alternativas: [
          { id: "a", texto: "Imprime 10" },
          { id: "b", texto: "Imprime undefined" },
          { id: "c", texto: "Dá erro — x não existe fora do bloco" },
          { id: "d", texto: "Imprime true" },
        ],
        respostaCorretaId: "c",
      },
      {
        id: "p3",
        tipo: "completar",
        enunciado: "Complete com a palavra-chave que respeita o escopo de bloco (diferente de var):",
        codigoAntes: "if (true) { ",
        codigoDepois: " x = 10 }",
        blocos: ["let", "var", "function", "return"],
        respostaCorreta: "let",
      },
    ],
  },

  u3_licao_3: {
    licaoId: "u3_licao_3",
    introducao: [
      {
        titulo: "O que é uma closure?",
        texto:
          "Closure é quando uma função criada dentro de outra continua lembrando das variáveis da função de fora, mesmo depois que a de fora já terminou de rodar.",
        codigo: "function criarContador() {\n  let contagem = 0\n  return function () {\n    contagem++\n    return contagem\n  }\n}",
      },
      {
        titulo: "Usando a closure",
        texto: "Cada vez que a função interna é chamada, ela lembra e atualiza a variável contagem de antes.",
        codigo: "const contador = criarContador()\nconsole.log(contador())\n// 1\nconsole.log(contador())\n// 2",
      },
      {
        titulo: "Pra que serve",
        texto: "Closures são úteis pra guardar um valor \"privado\" que só uma função específica sabe alterar.",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "O que é uma closure?",
        alternativas: [
          { id: "a", texto: "Uma função que lembra das variáveis da função onde foi criada" },
          { id: "b", texto: "Um jeito de fechar um array" },
          { id: "c", texto: "Um erro de sintaxe" },
          { id: "d", texto: "Um tipo de laço" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "logica",
        selo: { tipo: "novo", texto: "Sintaxe nova" },
        termoDestacado: "closure",
        enunciado: "O que aparece no console quando esse código roda?",
        codigo: "function criarContador() {\n  let contagem = 0\n  return function () {\n    contagem++\n    return contagem\n  }\n}\nconst contador = criarContador()\ncontador()\nconsole.log(contador())",
        alternativas: [
          { id: "a", texto: "1" },
          { id: "b", texto: "2" },
          { id: "c", texto: "0" },
          { id: "d", texto: "undefined" },
        ],
        respostaCorretaId: "b",
      },
      {
        id: "p3",
        tipo: "codigo",
        selo: { tipo: "dificil", texto: "Escreva o código" },
        enunciado:
          "Crie uma função criarContador que retorna uma função interna que soma 1 a cada chamada, chame o contador 3 vezes e imprima o resultado da terceira.",
        codigoInicial: "",
        resultadoEsperado: "3",
        dica: "function criarContador() {\n  let contagem = 0\n  return function () {\n    contagem++\n    return contagem\n  }\n}\nconst contador = criarContador()\ncontador()\ncontador()\nconsole.log(contador())",
      },
    ],
  },

  u3_licao_4: {
    licaoId: "u3_licao_4",
    introducao: [
      {
        titulo: "Parâmetro padrão",
        texto: "Dá pra definir um valor padrão pra um parâmetro, usado quando ninguém passa nada nesse lugar.",
        codigo: 'function saudacao(nome = "visitante") {\n  console.log(`Oi, ${nome}`)\n}\nsaudacao()\n// "Oi, visitante"',
      },
      {
        titulo: "Rest: juntando argumentos extras",
        texto: "O operador rest (...) junta vários argumentos soltos num único array, dentro da função.",
        codigo: "function somarTudo(...numeros) {\n  return numeros.reduce((total, n) => total + n, 0)\n}",
      },
      {
        titulo: "Usando o rest",
        texto: "Não importa quantos argumentos forem passados — todos caem dentro do array.",
        codigo: "console.log(somarTudo(1, 2, 3))\n// 6",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "logica",
        selo: { tipo: "novo", texto: "Sintaxe nova" },
        termoDestacado: "= \"visitante\"",
        enunciado: "O que aparece no console quando esse código roda?",
        codigo: 'function saudacao(nome = "visitante") {\n  console.log(`Oi, ${nome}`)\n}\nsaudacao()',
        alternativas: [
          { id: "a", texto: "\"Oi, visitante\"" },
          { id: "b", texto: "\"Oi, undefined\"" },
          { id: "c", texto: "Dá erro" },
          { id: "d", texto: "\"Oi, \"" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "alternativa",
        enunciado: "Pra que serve o operador rest (...) nos parâmetros de uma função?",
        alternativas: [
          { id: "a", texto: "Pra juntar vários argumentos soltos num único array" },
          { id: "b", texto: "Pra pausar a função" },
          { id: "c", texto: "Pra declarar uma constante" },
          { id: "d", texto: "Pra comentar o código" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "codigo",
        selo: { tipo: "dificil", texto: "Escreva o código" },
        enunciado:
          "Escreva uma função somarTudo que usa ...numeros (rest) e .reduce() pra somar todos os argumentos, e chame com (1, 2, 3, 4).",
        codigoInicial: "",
        resultadoEsperado: "10",
        dica: "function somarTudo(...numeros) {\n  return numeros.reduce((total, n) => total + n, 0)\n}\nconsole.log(somarTudo(1, 2, 3, 4))",
      },
    ],
  },

  u3_licao_5: {
    licaoId: "u3_licao_5",
    introducao: [
      {
        titulo: "Função como argumento",
        texto:
          "Em JavaScript, uma função pode ser passada como argumento pra outra função — essa função passada se chama callback.",
        codigo: "function processar(numero, callback) {\n  return callback(numero)\n}",
      },
      {
        titulo: "Chamando o callback",
        texto: "Quem recebe o callback decide quando (e se) vai chamá-lo.",
        codigo: "const resultado = processar(5, n => n * 10)\nconsole.log(resultado)\n// 50",
      },
      {
        titulo: "Onde isso aparece",
        texto: "map, filter e addEventListener são exemplos de funções que recebem um callback.",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "O que é um callback?",
        alternativas: [
          { id: "a", texto: "Uma função passada como argumento pra outra função" },
          { id: "b", texto: "Um tipo de variável" },
          { id: "c", texto: "Um erro de sintaxe" },
          { id: "d", texto: "Um valor booleano" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "logica",
        enunciado: "O que aparece no console quando esse código roda?",
        codigo: "function processar(numero, callback) {\n  return callback(numero)\n}\nconsole.log(processar(5, n => n * 10))",
        alternativas: [
          { id: "a", texto: "5" },
          { id: "b", texto: "50" },
          { id: "c", texto: "10" },
          { id: "d", texto: "undefined" },
        ],
        respostaCorretaId: "b",
      },
      {
        id: "p3",
        tipo: "completar",
        enunciado: "Complete pra chamar processar passando uma arrow function que soma 1:",
        codigoAntes: "processar(5, ",
        codigoDepois: ")",
        blocos: ["n => n + 1", "n + 1", "function n + 1", "callback(n + 1)"],
        respostaCorreta: "n => n + 1",
      },
    ],
  },

  u3_licao_6: {
    licaoId: "u3_licao_6",
    introducao: [
      {
        titulo: "O que é uma função pura?",
        texto:
          "Uma função pura sempre devolve o mesmo resultado pros mesmos argumentos, e não altera nada fora dela (sem efeitos colaterais).",
        codigo: "function somar(a, b) {\n  return a + b\n}\n// pura: mesmo a e b sempre dão o mesmo resultado",
      },
      {
        titulo: "Um exemplo impuro",
        texto: "Uma função que muda uma variável de fora, ou depende de algo que muda (como a hora atual), não é pura.",
        codigo: "let total = 0\nfunction somarAoTotal(n) {\n  total += n // altera algo de fora — efeito colateral\n}",
      },
      {
        titulo: "Por que isso importa",
        texto: "Funções puras são mais fáceis de testar e prever, porque não dependem de nada escondido.",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "O que caracteriza uma função pura?",
        alternativas: [
          { id: "a", texto: "Sempre devolve o mesmo resultado pros mesmos argumentos, sem efeitos colaterais" },
          { id: "b", texto: "Ela nunca tem parâmetros" },
          { id: "c", texto: "Ela sempre usa arrow function" },
          { id: "d", texto: "Ela nunca retorna nada" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "logica",
        enunciado: "Qual dessas funções é pura?",
        codigo: "function a(n) { return n * 2 }\nlet total = 0\nfunction b(n) { total += n }",
        alternativas: [
          { id: "a", texto: "a — só depende do argumento e não altera nada de fora" },
          { id: "b", texto: "b — porque usa +=" },
          { id: "c", texto: "As duas" },
          { id: "d", texto: "Nenhuma das duas" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "completar",
        enunciado: "Complete: uma função pura não deve alterar nenhuma variável de ___ dela.",
        codigoAntes: "",
        codigoDepois: "",
        blocos: ["fora", "dentro", "cima", "baixo"],
        respostaCorreta: "fora",
      },
    ],
  },

  u3_licao_7: {
    licaoId: "u3_licao_7",
    introducao: [
      {
        titulo: "O que é recursão?",
        texto: "Recursão é quando uma função chama ela mesma, dividindo um problema em versões cada vez menores dele.",
        codigo: "function fatorial(n) {\n  if (n <= 1) return 1\n  return n * fatorial(n - 1)\n}",
      },
      {
        titulo: "O caso base",
        texto: "Toda função recursiva precisa de um caso base — a condição que para as chamadas, senão ela chama a si mesma pra sempre.",
        codigo: "// if (n <= 1) return 1  → esse é o caso base do fatorial",
      },
      {
        titulo: "Rodando na prática",
        texto: "fatorial(3) chama fatorial(2), que chama fatorial(1), que já bate no caso base e retorna.",
        codigo: "console.log(fatorial(3))\n// 6",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "O que é recursão?",
        alternativas: [
          { id: "a", texto: "Uma função que chama ela mesma" },
          { id: "b", texto: "Um tipo de array" },
          { id: "c", texto: "Um laço que nunca termina de propósito" },
          { id: "d", texto: "Um comentário" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "alternativa",
        enunciado: "Por que toda função recursiva precisa de um caso base?",
        alternativas: [
          { id: "a", texto: "Pra parar as chamadas, senão ela chamaria a si mesma pra sempre" },
          { id: "b", texto: "Só por estilo de código" },
          { id: "c", texto: "Pra deixar o código mais lento" },
          { id: "d", texto: "Não precisa" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "codigo",
        selo: { tipo: "dificil", texto: "Escreva o código" },
        enunciado: "Escreva uma função recursiva fatorial(n) e imprima o resultado de fatorial(4).",
        codigoInicial: "",
        resultadoEsperado: "24",
        dica: "function fatorial(n) {\n  if (n <= 1) return 1\n  return n * fatorial(n - 1)\n}\nconsole.log(fatorial(4))",
      },
    ],
  },

  u3_licao_8: {
    licaoId: "u3_licao_8",
    introducao: [
      {
        titulo: "Você chegou até aqui!",
        texto:
          "Nessa unidade você viu: arrow functions, escopo, closures, parâmetros padrão e rest, callbacks, funções puras e recursão. Essa revisão junta um pouco de cada assunto.",
      },
      {
        titulo: "Tudo junto",
        texto: "Um callback costuma ser escrito como arrow function — é o padrão mais comum em código moderno.",
        codigo: "const numeros = [1, 2, 3]\nconst dobros = numeros.map(n => n * 2)",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "Qual sintaxe é uma arrow function?",
        alternativas: [
          { id: "a", texto: "n => n * 2" },
          { id: "b", texto: "function n * 2" },
          { id: "c", texto: "n -> n * 2" },
          { id: "d", texto: "n :: n * 2" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "logica",
        enunciado: "O que aparece no console quando esse código roda?",
        codigo: "function criarContador() {\n  let n = 0\n  return () => ++n\n}\nconst contar = criarContador()\ncontar()\nconsole.log(contar())",
        alternativas: [
          { id: "a", texto: "1" },
          { id: "b", texto: "2" },
          { id: "c", texto: "0" },
          { id: "d", texto: "undefined" },
        ],
        respostaCorretaId: "b",
      },
      {
        id: "p3",
        tipo: "completar",
        enunciado: "Complete pra somar todos os argumentos extras recebidos com rest:",
        codigoAntes: "function soma(",
        codigoDepois: "numeros) { return numeros.reduce((t, n) => t + n, 0) }",
        blocos: ["...", "..", "*", "&"],
        respostaCorreta: "...",
      },
      {
        id: "p4",
        tipo: "codigo",
        selo: { tipo: "dificil", texto: "Escreva o código" },
        enunciado: "Escreva uma função recursiva potencia(base, expoente) que calcula base elevado a expoente, e imprima potencia(2, 5).",
        codigoInicial: "",
        resultadoEsperado: "32",
        dica: "function potencia(base, expoente) {\n  if (expoente === 0) return 1\n  return base * potencia(base, expoente - 1)\n}\nconsole.log(potencia(2, 5))",
      },
    ],
  },

  // ---------- Unidade 4: DOM e Eventos ----------
  // Sem perguntas do tipo "codigo": o playground roda JS puro, sem um
  // documento HTML de verdade por trás — então aqui a prática é sempre
  // alternativa/lógica/completar, nunca rodar document.* de verdade.

  u4_licao_1: {
    licaoId: "u4_licao_1",
    introducao: [
      {
        titulo: "O que é o DOM?",
        texto:
          "DOM (Document Object Model) é como o navegador representa uma página HTML por dentro: uma árvore de elementos que o JavaScript pode ler e alterar.",
      },
      {
        titulo: "Da página pra árvore",
        texto:
          "Cada tag do HTML (<div>, <p>, <button>...) vira um \"nó\" nessa árvore. document é o objeto que representa a página inteira, o ponto de entrada pra tudo.",
        codigo: "<body>\n  <h1>Título</h1>\n  <p>Texto</p>\n</body>",
      },
      {
        titulo: "Por que isso importa",
        texto: "É o DOM que permite ao JavaScript mudar texto, estilo e estrutura da página depois que ela já carregou.",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "O que é o DOM?",
        alternativas: [
          { id: "a", texto: "Como o navegador representa a página HTML como uma árvore de elementos" },
          { id: "b", texto: "Uma linguagem de programação" },
          { id: "c", texto: "Um banco de dados" },
          { id: "d", texto: "Um framework de CSS" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "alternativa",
        enunciado: "Qual objeto representa a página inteira, sendo o ponto de entrada pro DOM?",
        alternativas: [
          { id: "a", texto: "window" },
          { id: "b", texto: "document" },
          { id: "c", texto: "html" },
          { id: "d", texto: "body" },
        ],
        respostaCorretaId: "b",
      },
      {
        id: "p3",
        tipo: "alternativa",
        enunciado: "Cada tag do HTML (como <p> ou <button>) vira o quê dentro do DOM?",
        alternativas: [
          { id: "a", texto: "Um nó (elemento) da árvore" },
          { id: "b", texto: "Uma variável global" },
          { id: "c", texto: "Um comentário" },
          { id: "d", texto: "Ela desaparece" },
        ],
        respostaCorretaId: "a",
      },
    ],
  },

  u4_licao_2: {
    licaoId: "u4_licao_2",
    introducao: [
      {
        titulo: "querySelector",
        texto: "document.querySelector(seletor) devolve o primeiro elemento da página que combina com um seletor CSS.",
        codigo: 'const titulo = document.querySelector("h1")',
      },
      {
        titulo: "querySelectorAll",
        texto: "document.querySelectorAll(seletor) devolve TODOS os elementos que combinam, numa lista.",
        codigo: 'const paragrafos = document.querySelectorAll("p")',
      },
      {
        titulo: "Seletores comuns",
        texto: "Os mesmos seletores do CSS funcionam aqui: tag (\"p\"), classe (\".destaque\") e id (\"#titulo\").",
        codigo: 'document.querySelector(".destaque")\ndocument.querySelector("#titulo")',
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "O que document.querySelector(\"h1\") devolve?",
        alternativas: [
          { id: "a", texto: "O primeiro elemento <h1> da página" },
          { id: "b", texto: "Todos os elementos <h1> da página" },
          { id: "c", texto: "Um número" },
          { id: "d", texto: "Nada, sempre dá erro" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "alternativa",
        enunciado: "Qual seletor pega um elemento pela classe \"destaque\"?",
        alternativas: [
          { id: "a", texto: "\"#destaque\"" },
          { id: "b", texto: "\".destaque\"" },
          { id: "c", texto: "\"destaque\"" },
          { id: "d", texto: "\"*destaque\"" },
        ],
        respostaCorretaId: "b",
      },
      {
        id: "p3",
        tipo: "completar",
        selo: { tipo: "novo", texto: "Sintaxe nova" },
        termoDestacado: "querySelectorAll",
        enunciado: "Complete pra pegar TODOS os elementos <p> da página:",
        codigoAntes: "document.",
        codigoDepois: '("p")',
        blocos: ["querySelectorAll", "querySelector", "getAll", "selectAll"],
        respostaCorreta: "querySelectorAll",
      },
    ],
  },

  u4_licao_3: {
    licaoId: "u4_licao_3",
    introducao: [
      {
        titulo: "Mudando o texto",
        texto: "A propriedade .textContent muda o texto de dentro de um elemento.",
        codigo: 'const titulo = document.querySelector("h1")\ntitulo.textContent = "Novo título"',
      },
      {
        titulo: "Mudando o estilo",
        texto: ".style dá acesso ao CSS do elemento direto pelo JavaScript.",
        codigo: 'titulo.style.color = "blue"',
      },
      {
        titulo: "Adicionando e removendo classes",
        texto: ".classList.add()/.remove() adicionam ou tiram uma classe CSS do elemento — o jeito mais comum de mudar visual dinamicamente.",
        codigo: 'titulo.classList.add("ativo")\ntitulo.classList.remove("ativo")',
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "Qual propriedade muda o texto de dentro de um elemento?",
        alternativas: [
          { id: "a", texto: ".textContent" },
          { id: "b", texto: ".style" },
          { id: "c", texto: ".classList" },
          { id: "d", texto: ".tagName" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "alternativa",
        enunciado: "Qual método adiciona uma classe CSS a um elemento?",
        alternativas: [
          { id: "a", texto: "elemento.classList.add(\"nome\")" },
          { id: "b", texto: "elemento.class = \"nome\"" },
          { id: "c", texto: "elemento.addClass(\"nome\")" },
          { id: "d", texto: "elemento.style.class(\"nome\")" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "completar",
        enunciado: "Complete pra deixar o texto do título azul:",
        codigoAntes: "titulo.style.",
        codigoDepois: ' = "blue"',
        blocos: ["color", "textColor", "fontColor", "background"],
        respostaCorreta: "color",
      },
    ],
  },

  u4_licao_4: {
    licaoId: "u4_licao_4",
    introducao: [
      {
        titulo: "O que é um evento",
        texto: "Evento é algo que acontece na página — um clique, uma tecla apertada, um formulário enviado.",
      },
      {
        titulo: "addEventListener",
        texto: ".addEventListener(evento, callback) escuta um evento num elemento e roda uma função quando ele acontece.",
        codigo: 'const botao = document.querySelector("button")\nbotao.addEventListener("click", () => {\n  console.log("Clicado!")\n})',
      },
      {
        titulo: "Eventos comuns",
        texto: "\"click\" (clique), \"input\" (digitação em tempo real) e \"submit\" (envio de formulário) estão entre os mais usados.",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "O que é um evento, no contexto do DOM?",
        alternativas: [
          { id: "a", texto: "Algo que acontece na página, como um clique ou uma tecla apertada" },
          { id: "b", texto: "Um tipo de variável" },
          { id: "c", texto: "Um erro de sintaxe" },
          { id: "d", texto: "Um seletor CSS" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "logica",
        selo: { tipo: "novo", texto: "Sintaxe nova" },
        termoDestacado: "addEventListener",
        enunciado: "O que essa linha faz?",
        codigo: 'botao.addEventListener("click", () => console.log("Clicado!"))',
        alternativas: [
          { id: "a", texto: "Imprime \"Clicado!\" imediatamente, ao rodar essa linha" },
          { id: "b", texto: "Escuta o clique no botão e imprime \"Clicado!\" quando ele acontecer" },
          { id: "c", texto: "Remove o botão da página" },
          { id: "d", texto: "Dá erro, porque falta o textContent" },
        ],
        respostaCorretaId: "b",
      },
      {
        id: "p3",
        tipo: "completar",
        enunciado: "Complete pra escutar quando o formulário for enviado:",
        codigoAntes: 'formulario.addEventListener("',
        codigoDepois: '", aoEnviar)',
        blocos: ["submit", "click", "input", "send"],
        respostaCorreta: "submit",
      },
    ],
  },

  u4_licao_5: {
    licaoId: "u4_licao_5",
    introducao: [
      {
        titulo: "Capturando o valor de um input",
        texto: "Todo campo de formulário tem uma propriedade .value com o que o usuário digitou.",
        codigo: 'const campo = document.querySelector("input")\nconsole.log(campo.value)',
      },
      {
        titulo: "Evitando o recarregamento",
        texto: "Por padrão, enviar um formulário recarrega a página. event.preventDefault() evita isso, pra tratar o envio com JavaScript.",
        codigo: 'formulario.addEventListener("submit", (event) => {\n  event.preventDefault()\n})',
      },
      {
        titulo: "Juntando tudo",
        texto: "É assim que se valida ou envia dados de um formulário sem recarregar a página inteira.",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "Qual propriedade tem o que o usuário digitou num campo de formulário?",
        alternativas: [
          { id: "a", texto: ".value" },
          { id: "b", texto: ".textContent" },
          { id: "c", texto: ".input" },
          { id: "d", texto: ".data" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "alternativa",
        enunciado: "Pra que serve event.preventDefault() no envio de um formulário?",
        alternativas: [
          { id: "a", texto: "Pra evitar que a página recarregue sozinha" },
          { id: "b", texto: "Pra apagar o formulário" },
          { id: "c", texto: "Pra desabilitar o botão de envio" },
          { id: "d", texto: "Pra validar os campos automaticamente" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "completar",
        enunciado: "Complete pra evitar o recarregamento padrão ao enviar o formulário:",
        codigoAntes: "formulario.addEventListener(\"submit\", (event) => { event.",
        codigoDepois: "() })",
        blocos: ["preventDefault", "stopDefault", "cancel", "prevent"],
        respostaCorreta: "preventDefault",
      },
    ],
  },

  u4_licao_6: {
    licaoId: "u4_licao_6",
    introducao: [
      {
        titulo: "Criando um elemento novo",
        texto: "document.createElement(tag) cria um elemento novo — mas ele só aparece na página depois de ser adicionado em algum lugar.",
        codigo: 'const item = document.createElement("li")\nitem.textContent = "Novo item"',
      },
      {
        titulo: "Adicionando na página",
        texto: ".appendChild(elemento) coloca o elemento criado dentro de outro, no fim dele.",
        codigo: 'const lista = document.querySelector("ul")\nlista.appendChild(item)',
      },
      {
        titulo: "Removendo um elemento",
        texto: ".remove() tira um elemento da página.",
        codigo: "item.remove()",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "O que document.createElement(\"li\") faz sozinho, sem mais nada?",
        alternativas: [
          { id: "a", texto: "Cria o elemento na memória, mas ele ainda não aparece na página" },
          { id: "b", texto: "Já adiciona o elemento visível na página" },
          { id: "c", texto: "Apaga todos os <li> existentes" },
          { id: "d", texto: "Dá erro, porque falta um seletor" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "alternativa",
        enunciado: "Qual método coloca um elemento criado dentro de outro, na página?",
        alternativas: [
          { id: "a", texto: ".appendChild()" },
          { id: "b", texto: ".createElement()" },
          { id: "c", texto: ".remove()" },
          { id: "d", texto: ".value" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "completar",
        enunciado: "Complete pra criar um novo parágrafo:",
        codigoAntes: "const paragrafo = document.",
        codigoDepois: '("p")',
        blocos: ["createElement", "querySelector", "newElement", "addElement"],
        respostaCorreta: "createElement",
      },
    ],
  },

  u4_licao_7: {
    licaoId: "u4_licao_7",
    introducao: [
      {
        titulo: "O problema de repetir listeners",
        texto:
          "Colocar addEventListener em cada item de uma lista longa (ou que muda) é caro e fácil de esquecer nos itens novos.",
      },
      {
        titulo: "Delegação de eventos",
        texto:
          "A solução: coloca UM listener no elemento pai, e usa event.target pra descobrir em qual filho o clique aconteceu de verdade.",
        codigo: 'lista.addEventListener("click", (event) => {\n  console.log(event.target.textContent)\n})',
      },
      {
        titulo: "Por que funciona",
        texto: "Um clique num filho \"borbulha\" até o pai — é esse comportamento que a delegação aproveita.",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "O que é delegação de eventos?",
        alternativas: [
          { id: "a", texto: "Colocar um único listener no elemento pai, em vez de um em cada filho" },
          { id: "b", texto: "Remover todos os listeners de uma vez" },
          { id: "c", texto: "Criar um evento customizado" },
          { id: "d", texto: "Desabilitar eventos de clique" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "alternativa",
        enunciado: "Num listener colocado no elemento pai, o que event.target representa?",
        alternativas: [
          { id: "a", texto: "O elemento exato onde o evento realmente aconteceu" },
          { id: "b", texto: "Sempre o elemento pai" },
          { id: "c", texto: "O texto do evento" },
          { id: "d", texto: "Nada, é sempre undefined" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "completar",
        enunciado: "Complete pra descobrir em qual elemento o clique aconteceu:",
        codigoAntes: "lista.addEventListener(\"click\", (event) => console.log(event.",
        codigoDepois: "))",
        blocos: ["target", "source", "element", "from"],
        respostaCorreta: "target",
      },
    ],
  },

  u4_licao_8: {
    licaoId: "u4_licao_8",
    introducao: [
      {
        titulo: "Você chegou até aqui!",
        texto:
          "Nessa unidade você viu: o DOM, querySelector, mudar texto/estilo/classes, eventos com addEventListener, formulários, criar elementos e delegação de eventos. Essa revisão junta um pouco de cada assunto.",
      },
      {
        titulo: "Tudo junto",
        texto: "Um fluxo comum: selecionar um elemento, escutar um evento nele, e alterar a página quando o evento acontece.",
        codigo: 'const botao = document.querySelector("button")\nbotao.addEventListener("click", () => {\n  botao.textContent = "Clicado!"\n})',
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "Qual método busca o primeiro elemento que combina com um seletor CSS?",
        alternativas: [
          { id: "a", texto: "document.querySelector()" },
          { id: "b", texto: "document.createElement()" },
          { id: "c", texto: "document.addEventListener()" },
          { id: "d", texto: "document.value()" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "logica",
        enunciado: "O que esse código faz quando o botão é clicado?",
        codigo: 'const botao = document.querySelector("button")\nbotao.addEventListener("click", () => {\n  botao.textContent = "Clicado!"\n})',
        alternativas: [
          { id: "a", texto: "Muda o texto do botão pra \"Clicado!\"" },
          { id: "b", texto: "Remove o botão da página" },
          { id: "c", texto: "Cria um novo botão" },
          { id: "d", texto: "Não faz nada" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "completar",
        enunciado: "Complete pra adicionar um item criado dentro da lista:",
        codigoAntes: "lista.",
        codigoDepois: "(item)",
        blocos: ["appendChild", "createElement", "querySelector", "value"],
        respostaCorreta: "appendChild",
      },
      {
        id: "p4",
        tipo: "alternativa",
        enunciado: "Por que usar delegação de eventos numa lista com muitos itens?",
        alternativas: [
          { id: "a", texto: "Evita colocar um listener repetido em cada item" },
          { id: "b", texto: "Deixa o CSS mais rápido" },
          { id: "c", texto: "É a única forma de usar querySelector" },
          { id: "d", texto: "Não tem nenhuma vantagem real" },
        ],
        respostaCorretaId: "a",
      },
    ],
  },

  // ---------- Unidade 5: Assincronia ----------
  // Sem perguntas do tipo "codigo": o worker do playground posta o
  // resultado assim que a parte síncrona termina, sem esperar callbacks de
  // setTimeout/Promise — então o que se pode validar rodando de verdade não
  // cobre assincronia. Aqui a prática é sempre prever a saída (lógica),
  // que é justamente a habilidade central desse assunto.

  u5_licao_1: {
    licaoId: "u5_licao_1",
    introducao: [
      {
        titulo: "Síncrono vs. assíncrono",
        texto:
          "JavaScript roda uma linha de cada vez (síncrono). Mas algumas operações demoram (buscar dados, esperar um tempo) e não podem travar tudo enquanto isso — essas rodam de forma assíncrona.",
      },
      {
        titulo: "setTimeout",
        texto: "A forma mais simples de agendar algo pro futuro: roda uma função depois de um tempo (em milissegundos), sem travar o resto do código.",
        codigo: 'console.log("A")\nsetTimeout(() => console.log("B"), 1000)\nconsole.log("C")',
      },
      {
        titulo: "A ordem que aparece",
        texto: "\"A\" e \"C\" aparecem primeiro (código síncrono) — só depois \"B\", porque o callback assíncrono espera o tempo passar.",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "O que significa dizer que um código é \"assíncrono\"?",
        alternativas: [
          { id: "a", texto: "Que não trava o resto do programa enquanto espera algo terminar" },
          { id: "b", texto: "Que roda sempre mais rápido" },
          { id: "c", texto: "Que tem erro de sintaxe" },
          { id: "d", texto: "Que só funciona em servidores" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "logica",
        selo: { tipo: "novo", texto: "Sintaxe nova" },
        termoDestacado: "setTimeout",
        enunciado: "Em que ordem os valores aparecem no console?",
        codigo: 'console.log("A")\nsetTimeout(() => console.log("B"), 1000)\nconsole.log("C")',
        alternativas: [
          { id: "a", texto: "A, B, C" },
          { id: "b", texto: "A, C, B" },
          { id: "c", texto: "B, A, C" },
          { id: "d", texto: "C, B, A" },
        ],
        respostaCorretaId: "b",
      },
      {
        id: "p3",
        tipo: "completar",
        enunciado: "Complete pra rodar uma função depois de 500ms:",
        codigoAntes: "",
        codigoDepois: '(() => console.log("Pronto"), 500)',
        blocos: ["setTimeout", "setInterval", "delay", "wait"],
        respostaCorreta: "setTimeout",
      },
    ],
  },

  u5_licao_2: {
    licaoId: "u5_licao_2",
    introducao: [
      {
        titulo: "O que é uma Promise",
        texto:
          "Uma Promise representa um valor que ainda não existe, mas vai existir (ou falhar) no futuro — o resultado de uma operação assíncrona.",
        codigo: 'const promessa = new Promise((resolve, reject) => {\n  resolve("Deu certo!")\n})',
      },
      {
        titulo: "resolve e reject",
        texto: "resolve(valor) marca a Promise como bem-sucedida. reject(erro) marca como falha.",
      },
      {
        titulo: "Os três estados",
        texto: "pending (esperando), fulfilled (resolvida com sucesso) ou rejected (falhou) — uma Promise só muda de estado uma vez.",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "O que uma Promise representa?",
        alternativas: [
          { id: "a", texto: "Um valor que ainda não existe, mas vai existir (ou falhar) no futuro" },
          { id: "b", texto: "Um array especial" },
          { id: "c", texto: "Uma função sempre síncrona" },
          { id: "d", texto: "Um tipo de erro" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "alternativa",
        enunciado: "Quais são os três estados possíveis de uma Promise?",
        alternativas: [
          { id: "a", texto: "pending, fulfilled, rejected" },
          { id: "b", texto: "start, middle, end" },
          { id: "c", texto: "true, false, null" },
          { id: "d", texto: "sync, async, wait" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "completar",
        selo: { tipo: "novo", texto: "Sintaxe nova" },
        termoDestacado: "resolve",
        enunciado: "Complete pra marcar a Promise como bem-sucedida com o valor \"Ok\":",
        codigoAntes: "new Promise((resolve, reject) => { ",
        codigoDepois: '("Ok") })',
        blocos: ["resolve", "reject", "return", "await"],
        respostaCorreta: "resolve",
      },
    ],
  },

  u5_licao_3: {
    licaoId: "u5_licao_3",
    introducao: [
      {
        titulo: ".then()",
        texto: "Roda uma função quando a Promise resolve com sucesso, recebendo o valor resolvido.",
        codigo: "promessa.then((valor) => console.log(valor))",
      },
      {
        titulo: ".catch()",
        texto: "Roda uma função quando a Promise é rejeitada (deu erro).",
        codigo: "promessa.catch((erro) => console.log(erro))",
      },
      {
        titulo: "Encadeando vários .then",
        texto: "Cada .then() pode devolver um novo valor (ou nova Promise) pro próximo .then() da cadeia.",
        codigo: "buscarUsuario()\n  .then((usuario) => buscarPosts(usuario))\n  .then((posts) => console.log(posts))",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "logica",
        enunciado: "O que aparece no console quando esse código roda?",
        codigo: "const promessa = new Promise((resolve) => resolve(10))\npromessa.then((valor) => console.log(valor * 2))",
        alternativas: [
          { id: "a", texto: "10" },
          { id: "b", texto: "20" },
          { id: "c", texto: "undefined" },
          { id: "d", texto: "Dá erro" },
        ],
        respostaCorretaId: "b",
      },
      {
        id: "p2",
        tipo: "alternativa",
        enunciado: "Quando o .catch() de uma Promise roda?",
        alternativas: [
          { id: "a", texto: "Quando a Promise é rejeitada" },
          { id: "b", texto: "Sempre, não importa o resultado" },
          { id: "c", texto: "Antes do .then()" },
          { id: "d", texto: "Nunca, é só decoração" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "completar",
        enunciado: "Complete pra tratar o erro de uma Promise:",
        codigoAntes: "buscarDados().then(mostrar).",
        codigoDepois: "(tratarErro)",
        blocos: ["catch", "then", "error", "fail"],
        respostaCorreta: "catch",
      },
    ],
  },

  u5_licao_4: {
    licaoId: "u5_licao_4",
    introducao: [
      {
        titulo: "async",
        texto: "Colocar async antes de uma função faz ela sempre devolver uma Promise, e permite usar await dentro dela.",
        codigo: 'async function buscar() {\n  return "dado"\n}',
      },
      {
        titulo: "await",
        texto: "await pausa a função até a Promise terminar, e devolve o valor resolvido direto — sem precisar de .then().",
        codigo: "async function mostrar() {\n  const valor = await promessa\n  console.log(valor)\n}",
      },
      {
        titulo: "Mesmo resultado, mais legível",
        texto: "async/await faz a mesma coisa que .then()/.catch(), só que parece código síncrono — mais fácil de ler.",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "O que await faz dentro de uma função async?",
        alternativas: [
          { id: "a", texto: "Pausa a função até a Promise terminar, e devolve o valor resolvido" },
          { id: "b", texto: "Cancela a Promise" },
          { id: "c", texto: "Transforma a Promise num array" },
          { id: "d", texto: "Trava a página inteira" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "alternativa",
        enunciado: "O que uma função marcada com async sempre devolve?",
        alternativas: [
          { id: "a", texto: "Uma Promise" },
          { id: "b", texto: "Um array" },
          { id: "c", texto: "undefined, sempre" },
          { id: "d", texto: "Um número" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "completar",
        selo: { tipo: "novo", texto: "Sintaxe nova" },
        termoDestacado: "async",
        enunciado: "Complete pra declarar uma função assíncrona:",
        codigoAntes: "",
        codigoDepois: " function buscar() { }",
        blocos: ["async", "await", "promise", "then"],
        respostaCorreta: "async",
      },
    ],
  },

  u5_licao_5: {
    licaoId: "u5_licao_5",
    introducao: [
      {
        titulo: "O que é fetch",
        texto: "fetch(url) faz uma requisição pra um endereço (como uma API) e devolve uma Promise com a resposta.",
        codigo: 'fetch("https://api.exemplo.com/dados")',
      },
      {
        titulo: "Lendo a resposta como JSON",
        texto: "A resposta chega \"crua\"; .json() converte ela pro formato de objeto JavaScript (também devolve uma Promise).",
        codigo: "fetch(url)\n  .then((resposta) => resposta.json())\n  .then((dados) => console.log(dados))",
      },
      {
        titulo: "Com async/await",
        texto: "O mesmo fetch, escrito de forma mais direta.",
        codigo: "async function buscar() {\n  const resposta = await fetch(url)\n  const dados = await resposta.json()\n  return dados\n}",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "Pra que serve fetch()?",
        alternativas: [
          { id: "a", texto: "Fazer uma requisição pra um endereço e devolver uma Promise com a resposta" },
          { id: "b", texto: "Declarar uma variável" },
          { id: "c", texto: "Criar um array" },
          { id: "d", texto: "Validar um formulário" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "alternativa",
        enunciado: "Por que resposta.json() também devolve uma Promise?",
        alternativas: [
          { id: "a", texto: "Porque ler e converter o corpo da resposta também é uma operação assíncrona" },
          { id: "b", texto: "Porque JSON é sempre lento por natureza" },
          { id: "c", texto: "Não devolve, é sempre um valor pronto na hora" },
          { id: "d", texto: "Só por um padrão sem motivo real" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "completar",
        enunciado: "Complete pra buscar dados esperando o fetch terminar:",
        codigoAntes: "const resposta = ",
        codigoDepois: " fetch(url)",
        blocos: ["await", "async", "then", "yield"],
        respostaCorreta: "await",
      },
    ],
  },

  u5_licao_6: {
    licaoId: "u5_licao_6",
    introducao: [
      {
        titulo: "try/catch com await",
        texto: "Quando se usa await, o jeito de capturar erro é com try/catch, igual código síncrono.",
        codigo: 'async function buscar() {\n  try {\n    const dados = await fetch(url)\n  } catch (erro) {\n    console.log("Deu erro:", erro.message)\n  }\n}',
      },
      {
        titulo: "Sem o try/catch",
        texto: "Se uma Promise dentro de um await for rejeitada e não tiver try/catch, o erro \"sobe\" e pode quebrar o programa.",
      },
      {
        titulo: "Padrão recomendado",
        texto: "Sempre envolver chamadas com await que podem falhar (como fetch) num try/catch.",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "Como capturar o erro de um await que falhou?",
        alternativas: [
          { id: "a", texto: "Com try/catch, igual código síncrono" },
          { id: "b", texto: "Com .error()" },
          { id: "c", texto: "Não dá pra capturar" },
          { id: "d", texto: "Com um if" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "logica",
        enunciado: "O que aparece no console quando esse código roda?",
        codigo: 'async function buscar() {\n  try {\n    throw new Error("Falhou")\n  } catch (erro) {\n    console.log(erro.message)\n  }\n}\nbuscar()',
        alternativas: [
          { id: "a", texto: "\"Falhou\"" },
          { id: "b", texto: "undefined" },
          { id: "c", texto: "\"Error\"" },
          { id: "d", texto: "Nada, o programa trava" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "completar",
        enunciado: "Complete pra capturar o erro dentro da função async:",
        codigoAntes: "async function buscar() { try { await fetch(url) } ",
        codigoDepois: " (erro) { console.log(erro) } }",
        blocos: ["catch", "except", "error", "fail"],
        respostaCorreta: "catch",
      },
    ],
  },

  u5_licao_7: {
    licaoId: "u5_licao_7",
    introducao: [
      {
        titulo: "O problema de esperar uma por vez",
        texto:
          "Se você tem 3 requisições independentes e usa await em cada uma separadamente, elas rodam uma depois da outra — mais lento do que precisa.",
      },
      {
        titulo: "Promise.all",
        texto:
          "Promise.all([p1, p2, p3]) roda todas ao mesmo tempo, e só resolve quando TODAS terminarem, devolvendo um array com os resultados na mesma ordem.",
        codigo: "const [a, b] = await Promise.all([buscarA(), buscarB()])",
      },
      {
        titulo: "Se uma falhar",
        texto: "Se qualquer Promise do array for rejeitada, o Promise.all inteiro é rejeitado.",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "Pra que serve Promise.all()?",
        alternativas: [
          { id: "a", texto: "Rodar várias Promises ao mesmo tempo e esperar todas terminarem" },
          { id: "b", texto: "Cancelar todas as Promises" },
          { id: "c", texto: "Rodar Promises uma de cada vez, em sequência" },
          { id: "d", texto: "Criar uma nova Promise vazia" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "alternativa",
        enunciado: "O que Promise.all([p1, p2]) devolve quando as duas terminam?",
        alternativas: [
          { id: "a", texto: "Um array com os dois resultados, na mesma ordem" },
          { id: "b", texto: "Só o resultado da mais rápida" },
          { id: "c", texto: "Um número" },
          { id: "d", texto: "Nada" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "completar",
        selo: { tipo: "novo", texto: "Sintaxe nova" },
        termoDestacado: "Promise.all",
        enunciado: "Complete pra rodar buscarA() e buscarB() ao mesmo tempo:",
        codigoAntes: "const resultados = await Promise.",
        codigoDepois: "([buscarA(), buscarB()])",
        blocos: ["all", "race", "then", "each"],
        respostaCorreta: "all",
      },
    ],
  },

  u5_licao_8: {
    licaoId: "u5_licao_8",
    introducao: [
      {
        titulo: "Você chegou até aqui!",
        texto:
          "Nessa unidade você viu: callbacks assíncronos, Promises, .then/.catch, async/await, fetch, try/catch com await e Promise.all. Essa revisão junta um pouco de cada assunto.",
      },
      {
        titulo: "Tudo junto",
        texto: "Hoje o padrão mais comum é async/await com try/catch, buscando dados com fetch.",
        codigo: 'async function carregar() {\n  try {\n    const resposta = await fetch(url)\n    const dados = await resposta.json()\n    console.log(dados)\n  } catch (erro) {\n    console.log("Erro:", erro.message)\n  }\n}',
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "O que await faz?",
        alternativas: [
          { id: "a", texto: "Pausa a função até a Promise terminar" },
          { id: "b", texto: "Cancela a Promise" },
          { id: "c", texto: "Roda o código mais rápido" },
          { id: "d", texto: "Cria uma nova variável" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "logica",
        enunciado: "Em que ordem os valores aparecem no console?",
        codigo: 'console.log("1")\nsetTimeout(() => console.log("2"), 0)\nconsole.log("3")',
        alternativas: [
          { id: "a", texto: "1, 2, 3" },
          { id: "b", texto: "1, 3, 2" },
          { id: "c", texto: "2, 1, 3" },
          { id: "d", texto: "3, 2, 1" },
        ],
        respostaCorretaId: "b",
      },
      {
        id: "p3",
        tipo: "completar",
        enunciado: "Complete pra rodar duas buscas ao mesmo tempo:",
        codigoAntes: "const [a, b] = await Promise.",
        codigoDepois: "([buscarA(), buscarB()])",
        blocos: ["all", "race", "then", "catch"],
        respostaCorreta: "all",
      },
      {
        id: "p4",
        tipo: "alternativa",
        enunciado: "Como capturar o erro de uma chamada com await?",
        alternativas: [
          { id: "a", texto: "try/catch" },
          { id: "b", texto: ".error()" },
          { id: "c", texto: "if/else" },
          { id: "d", texto: "Não dá pra capturar" },
        ],
        respostaCorretaId: "a",
      },
    ],
  },

  // ---------- Unidade 6: Manipulação de Strings ----------

  u6_licao_1: {
    licaoId: "u6_licao_1",
    introducao: [
      {
        titulo: "O que é uma string",
        texto: "Uma string é um texto, escrito entre aspas simples, duplas ou crase.",
        codigo: "const nome = \"Ana\"\nconst saudacao = 'Oi'",
      },
      {
        titulo: "Acessando um caractere",
        texto: "Usa colchetes com o índice, igual um array — o primeiro caractere está no índice 0.",
        codigo: 'console.log(nome[0])\n// "A"',
      },
      {
        titulo: "length",
        texto: ".length diz quantos caracteres a string tem.",
        codigo: "console.log(nome.length)\n// 3",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "O que é uma string?",
        alternativas: [
          { id: "a", texto: "Um texto, escrito entre aspas" },
          { id: "b", texto: "Um número decimal" },
          { id: "c", texto: "Um array de números" },
          { id: "d", texto: "Um comentário" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "logica",
        enunciado: "O que aparece no console quando esse código roda?",
        codigo: 'const palavra = "Zul"\nconsole.log(palavra[1])',
        alternativas: [
          { id: "a", texto: "\"Z\"" },
          { id: "b", texto: "\"u\"" },
          { id: "c", texto: "\"l\"" },
          { id: "d", texto: "undefined" },
        ],
        respostaCorretaId: "b",
      },
      {
        id: "p3",
        tipo: "completar",
        enunciado: "Complete pra saber quantos caracteres tem a palavra:",
        codigoAntes: "console.log(palavra.",
        codigoDepois: ")",
        blocos: ["length", "size", "count", "chars"],
        respostaCorreta: "length",
      },
    ],
  },

  u6_licao_2: {
    licaoId: "u6_licao_2",
    introducao: [
      {
        titulo: "slice",
        texto: ".slice(inicio, fim) recorta um pedaço da string, do índice início até (sem incluir) o fim.",
        codigo: 'const texto = "JavaScript"\nconsole.log(texto.slice(0, 4))\n// "Java"',
      },
      {
        titulo: "split",
        texto: ".split(separador) quebra a string num array, usando o separador como ponto de corte.",
        codigo: 'const csv = "a,b,c"\nconsole.log(csv.split(","))\n// ["a", "b", "c"]',
      },
      {
        titulo: "trim",
        texto: ".trim() remove espaços em branco do início e do fim da string.",
        codigo: 'console.log("  oi  ".trim())\n// "oi"',
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "O que .slice(0, 4) faz numa string?",
        alternativas: [
          { id: "a", texto: "Recorta um pedaço, do índice 0 até (sem incluir) o 4" },
          { id: "b", texto: "Apaga a string inteira" },
          { id: "c", texto: "Conta os caracteres" },
          { id: "d", texto: "Deixa tudo maiúsculo" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "logica",
        selo: { tipo: "novo", texto: "Sintaxe nova" },
        termoDestacado: "split",
        enunciado: "O que aparece no console quando esse código roda?",
        codigo: 'const csv = "a,b,c"\nconsole.log(csv.split(",").length)',
        alternativas: [
          { id: "a", texto: "1" },
          { id: "b", texto: "2" },
          { id: "c", texto: "3" },
          { id: "d", texto: "\"a,b,c\"" },
        ],
        respostaCorretaId: "c",
      },
      {
        id: "p3",
        tipo: "codigo",
        selo: { tipo: "dificil", texto: "Escreva o código" },
        enunciado: 'Use .trim() pra remover os espaços de "  Zul  " e imprima o resultado.',
        codigoInicial: "",
        resultadoEsperado: "Zul",
        dica: 'console.log("  Zul  ".trim())',
      },
    ],
  },

  u6_licao_3: {
    licaoId: "u6_licao_3",
    introducao: [
      {
        titulo: "Crase em vez de aspas",
        texto: "Template literals usam crase (`) em vez de aspas, e permitem inserir valores direto no meio do texto.",
        codigo: 'const nome = "Ana"\nconsole.log(`Oi, ${nome}!`)\n// "Oi, Ana!"',
      },
      {
        titulo: "${} interpola qualquer expressão",
        texto: "Dentro de ${ }, dá pra colocar variáveis, contas, ou chamadas de função.",
        codigo: 'console.log(`2 + 2 = ${2 + 2}`)\n// "2 + 2 = 4"',
      },
      {
        titulo: "Múltiplas linhas",
        texto: "Template literals também permitem texto em várias linhas, sem precisar de \\n.",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "O que diferencia um template literal de uma string comum?",
        alternativas: [
          { id: "a", texto: "Usa crase e permite interpolar valores com ${ }" },
          { id: "b", texto: "Só aceita números" },
          { id: "c", texto: "Não pode ser concatenado" },
          { id: "d", texto: "É sempre mais lento" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "logica",
        selo: { tipo: "novo", texto: "Sintaxe nova" },
        termoDestacado: "${ }",
        enunciado: "O que aparece no console quando esse código roda?",
        codigo: 'const idade = 20\nconsole.log(`Tenho ${idade} anos`)',
        alternativas: [
          { id: "a", texto: "\"Tenho ${idade} anos\"" },
          { id: "b", texto: "\"Tenho 20 anos\"" },
          { id: "c", texto: "\"Tenho idade anos\"" },
          { id: "d", texto: "Dá erro" },
        ],
        respostaCorretaId: "b",
      },
      {
        id: "p3",
        tipo: "completar",
        selo: { tipo: "novo", texto: "Sintaxe nova" },
        termoDestacado: "`",
        enunciado: "Complete pra criar um template literal com o nome interpolado:",
        codigoAntes: "",
        codigoDepois: "Oi, ${nome}!`",
        blocos: ["`", "\"", "'", "{{"],
        respostaCorreta: "`",
      },
    ],
  },

  u6_licao_4: {
    licaoId: "u6_licao_4",
    introducao: [
      {
        titulo: "O que é regex",
        texto: "Uma expressão regular (regex) é um padrão pra buscar ou testar um formato de texto, como um e-mail ou um número de telefone.",
        codigo: "const padrao = /^[0-9]+$/",
      },
      {
        titulo: ".test()",
        texto: "O método .test(texto) devolve true ou false, dizendo se o texto combina com o padrão.",
        codigo: 'console.log(/^[0-9]+$/.test("123"))\n// true',
      },
      {
        titulo: "Alguns símbolos comuns",
        texto: "^ (início), $ (fim), [0-9] (dígito), + (uma ou mais vezes).",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "Pra que serve uma expressão regular (regex)?",
        alternativas: [
          { id: "a", texto: "Buscar ou testar se um texto combina com um padrão" },
          { id: "b", texto: "Somar números" },
          { id: "c", texto: "Criar um array" },
          { id: "d", texto: "Declarar uma variável" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "logica",
        enunciado: "O que aparece no console quando esse código roda?",
        codigo: 'console.log(/^[0-9]+$/.test("abc"))',
        alternativas: [
          { id: "a", texto: "true" },
          { id: "b", texto: "false" },
          { id: "c", texto: "\"abc\"" },
          { id: "d", texto: "undefined" },
        ],
        respostaCorretaId: "b",
      },
      {
        id: "p3",
        tipo: "alternativa",
        enunciado: "O que o símbolo $ representa numa regex?",
        alternativas: [
          { id: "a", texto: "O fim do texto" },
          { id: "b", texto: "O início do texto" },
          { id: "c", texto: "Um dígito" },
          { id: "d", texto: "Um espaço" },
        ],
        respostaCorretaId: "a",
      },
    ],
  },

  u6_licao_5: {
    licaoId: "u6_licao_5",
    introducao: [
      {
        titulo: "toFixed",
        texto: ".toFixed(n) arredonda um número decimal pra n casas, devolvendo uma string.",
        codigo: 'const preco = 9.999\nconsole.log(preco.toFixed(2))\n// "10.00"',
      },
      {
        titulo: "toUpperCase / toLowerCase",
        texto: "Deixam um texto todo maiúsculo ou minúsculo.",
        codigo: 'console.log("Zul".toUpperCase())\n// "ZUL"',
      },
      {
        titulo: "Convertendo número pra string",
        texto: "String(numero) ou numero.toString() transformam um número em texto.",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "O que .toFixed(2) faz com um número decimal?",
        alternativas: [
          { id: "a", texto: "Arredonda pra 2 casas decimais e devolve uma string" },
          { id: "b", texto: "Transforma em array" },
          { id: "c", texto: "Soma 2 ao número" },
          { id: "d", texto: "Deixa o número negativo" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "logica",
        enunciado: "O que aparece no console quando esse código roda?",
        codigo: "console.log((3.14159).toFixed(2))",
        alternativas: [
          { id: "a", texto: "\"3.14\"" },
          { id: "b", texto: "\"3.14159\"" },
          { id: "c", texto: "3" },
          { id: "d", texto: "\"3.1\"" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "completar",
        enunciado: "Complete pra deixar o texto todo maiúsculo:",
        codigoAntes: '"zul".',
        codigoDepois: "()",
        blocos: ["toUpperCase", "toLowerCase", "trim", "toFixed"],
        respostaCorreta: "toUpperCase",
      },
    ],
  },

  u6_licao_6: {
    licaoId: "u6_licao_6",
    introducao: [
      {
        titulo: "Comparando strings",
        texto: "Strings são comparadas por ordem alfabética (o código de cada caractere) usando <, > e ===.",
        codigo: 'console.log("banana" > "abacaxi")\n// true',
      },
      {
        titulo: "Maiúsculas vs. minúsculas",
        texto: "Letras maiúsculas vêm \"antes\" das minúsculas na comparação — \"Z\" < \"a\" é true.",
        codigo: 'console.log("Z" < "a")\n// true',
      },
      {
        titulo: "Ordenando um array",
        texto: ".sort() sem argumento ordena um array de strings alfabeticamente, por padrão.",
        codigo: 'const nomes = ["Caio", "Ana", "Bia"]\nnomes.sort()\nconsole.log(nomes.join(", "))\n// "Ana, Bia, Caio"',
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "logica",
        enunciado: "O que aparece no console quando esse código roda?",
        codigo: 'console.log("banana" > "abacaxi")',
        alternativas: [
          { id: "a", texto: "true" },
          { id: "b", texto: "false" },
          { id: "c", texto: "\"banana\"" },
          { id: "d", texto: "Dá erro" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "alternativa",
        enunciado: "Qual método ordena um array de strings alfabeticamente, por padrão?",
        alternativas: [
          { id: "a", texto: ".sort()" },
          { id: "b", texto: ".slice()" },
          { id: "c", texto: ".split()" },
          { id: "d", texto: ".trim()" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "codigo",
        selo: { tipo: "dificil", texto: "Escreva o código" },
        enunciado: 'Ordene o array ["Caio", "Ana", "Bia"] com .sort() e imprima o resultado juntando com .join(", ").',
        codigoInicial: "",
        resultadoEsperado: "Ana, Bia, Caio",
        dica: 'const nomes = ["Caio", "Ana", "Bia"]\nnomes.sort()\nconsole.log(nomes.join(", "))',
      },
    ],
  },

  u6_licao_7: {
    licaoId: "u6_licao_7",
    introducao: [
      {
        titulo: "Operador +",
        texto: "O jeito mais simples de juntar (concatenar) strings é com +.",
        codigo: 'const primeiro = "Zul"\nconst segundo = "Code"\nconsole.log(primeiro + segundo)\n// "ZulCode"',
      },
      {
        titulo: "concat()",
        texto: ".concat() faz a mesma coisa que +, de um jeito mais explícito.",
        codigo: 'console.log(primeiro.concat(segundo))\n// "ZulCode"',
      },
      {
        titulo: "Template literal é o preferido hoje",
        texto: "Pra juntar várias partes com espaço/pontuação, template literals costumam ficar mais legíveis que +.",
        codigo: 'console.log(`${primeiro} ${segundo}`)\n// "Zul Code"',
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "Qual operador junta (concatena) duas strings?",
        alternativas: [
          { id: "a", texto: "+" },
          { id: "b", texto: "-" },
          { id: "c", texto: "*" },
          { id: "d", texto: "%" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "logica",
        enunciado: "O que aparece no console quando esse código roda?",
        codigo: 'const a = "Ola, "\nconst b = "mundo"\nconsole.log(a + b)',
        alternativas: [
          { id: "a", texto: "\"Ola, mundo\"" },
          { id: "b", texto: "\"Ola,mundo\"" },
          { id: "c", texto: "\"a + b\"" },
          { id: "d", texto: "Dá erro" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "completar",
        enunciado: "Complete pra juntar nome e sobrenome com um espaço no meio, usando template literal:",
        codigoAntes: "",
        codigoDepois: "${nome} ${sobrenome}`",
        blocos: ["`", "\"", "'", "("],
        respostaCorreta: "`",
      },
    ],
  },

  u6_licao_8: {
    licaoId: "u6_licao_8",
    introducao: [
      {
        titulo: "Você chegou até aqui!",
        texto:
          "Nessa unidade você viu: strings, slice/split/trim, template literals, regex básico, formatação de números, comparação e concatenação. Essa revisão junta um pouco de cada assunto.",
      },
      {
        titulo: "Tudo junto",
        texto: "Template literals combinam bem com métodos de string, pra montar mensagens formatadas.",
        codigo: 'const nome = "ana"\nconsole.log(`Bem-vinda, ${nome.toUpperCase()}!`)',
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "Qual símbolo cria um template literal?",
        alternativas: [
          { id: "a", texto: "`" },
          { id: "b", texto: "\"" },
          { id: "c", texto: "'" },
          { id: "d", texto: "{{" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "logica",
        enunciado: "O que aparece no console quando esse código roda?",
        codigo: 'const nome = "ana"\nconsole.log(`Oi, ${nome.toUpperCase()}!`)',
        alternativas: [
          { id: "a", texto: "\"Oi, ana!\"" },
          { id: "b", texto: "\"Oi, ANA!\"" },
          { id: "c", texto: "\"Oi, ${nome}!\"" },
          { id: "d", texto: "Dá erro" },
        ],
        respostaCorretaId: "b",
      },
      {
        id: "p3",
        tipo: "completar",
        enunciado: "Complete pra quebrar um texto separado por vírgula num array:",
        codigoAntes: '"a,b,c".',
        codigoDepois: '(",")',
        blocos: ["split", "slice", "trim", "join"],
        respostaCorreta: "split",
      },
      {
        id: "p4",
        tipo: "codigo",
        selo: { tipo: "dificil", texto: "Escreva o código" },
        enunciado: 'Use template literal pra montar "Nota: 8.5" a partir de const nota = 8.5, e imprima.',
        codigoInicial: "",
        resultadoEsperado: "Nota: 8.5",
        dica: "const nota = 8.5\nconsole.log(`Nota: ${nota}`)",
      },
    ],
  },

  // ---------- Unidade 7: Orientação a Objetos ----------

  u7_licao_1: {
    licaoId: "u7_licao_1",
    introducao: [
      {
        titulo: "O que é uma classe",
        texto: "Uma classe é um molde pra criar objetos parecidos, com as mesmas propriedades e comportamentos.",
        codigo: 'class Pessoa {\n  nome = "sem nome"\n}',
      },
      {
        titulo: "Criando uma instância",
        texto: "new Classe() cria um objeto novo (uma \"instância\") a partir do molde.",
        codigo: 'const p = new Pessoa()\nconsole.log(p.nome)\n// "sem nome"',
      },
      {
        titulo: "Cada instância é independente",
        texto: "Mudar uma instância não afeta as outras criadas a partir da mesma classe.",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "O que é uma classe?",
        alternativas: [
          { id: "a", texto: "Um molde pra criar objetos parecidos" },
          { id: "b", texto: "Um tipo de array" },
          { id: "c", texto: "Uma variável especial" },
          { id: "d", texto: "Um comentário" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "alternativa",
        enunciado: "O que new Pessoa() faz?",
        alternativas: [
          { id: "a", texto: "Cria uma nova instância (objeto) a partir da classe Pessoa" },
          { id: "b", texto: "Apaga a classe Pessoa" },
          { id: "c", texto: "Declara uma variável" },
          { id: "d", texto: "Cria um array vazio" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "completar",
        selo: { tipo: "novo", texto: "Sintaxe nova" },
        termoDestacado: "new",
        enunciado: "Complete pra criar uma nova instância de Pessoa:",
        codigoAntes: "const p = ",
        codigoDepois: "Pessoa()",
        blocos: ["new ", "create ", "make ", "class "],
        respostaCorreta: "new ",
      },
    ],
  },

  u7_licao_2: {
    licaoId: "u7_licao_2",
    introducao: [
      {
        titulo: "O método constructor",
        texto: "Roda automaticamente toda vez que uma instância é criada com new — é onde se define os valores iniciais.",
        codigo: "class Pessoa {\n  constructor(nome) {\n    this.nome = nome\n  }\n}",
      },
      {
        titulo: "this",
        texto: "Dentro da classe, this se refere à instância que está sendo criada/usada.",
        codigo: 'const p = new Pessoa("Ana")\nconsole.log(p.nome)\n// "Ana"',
      },
      {
        titulo: "Cada instância com seu valor",
        texto: "Como o constructor usa o parâmetro recebido, cada Pessoa criada pode ter um nome diferente.",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "Quando o método constructor roda?",
        alternativas: [
          { id: "a", texto: "Automaticamente, toda vez que uma instância é criada com new" },
          { id: "b", texto: "Só quando chamado manualmente" },
          { id: "c", texto: "Nunca roda sozinho" },
          { id: "d", texto: "Só uma vez, pra todas as instâncias" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "logica",
        enunciado: "O que aparece no console quando esse código roda?",
        codigo: 'class Pessoa {\n  constructor(nome) {\n    this.nome = nome\n  }\n}\nconst p = new Pessoa("Bia")\nconsole.log(p.nome)',
        alternativas: [
          { id: "a", texto: "\"nome\"" },
          { id: "b", texto: "\"Bia\"" },
          { id: "c", texto: "undefined" },
          { id: "d", texto: "Dá erro" },
        ],
        respostaCorretaId: "b",
      },
      {
        id: "p3",
        tipo: "completar",
        selo: { tipo: "novo", texto: "Sintaxe nova" },
        termoDestacado: "this",
        enunciado: "Complete pra guardar o parâmetro nome na instância:",
        codigoAntes: "constructor(nome) { ",
        codigoDepois: ".nome = nome }",
        blocos: ["this", "self", "instance", "me"],
        respostaCorreta: "this",
      },
    ],
  },

  u7_licao_3: {
    licaoId: "u7_licao_3",
    introducao: [
      {
        titulo: "Método de uma classe",
        texto: "Um método é uma função definida dentro da classe, que qualquer instância pode chamar.",
        codigo: 'class Pessoa {\n  constructor(nome) {\n    this.nome = nome\n  }\n  saudacao() {\n    return `Oi, sou ${this.nome}`\n  }\n}',
      },
      {
        titulo: "Chamando um método",
        texto: "Usa ponto, igual acessar uma propriedade, mas com parênteses no final.",
        codigo: 'const p = new Pessoa("Ana")\nconsole.log(p.saudacao())\n// "Oi, sou Ana"',
      },
      {
        titulo: "this dentro de um método",
        texto: "Continua se referindo à instância que chamou o método.",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "O que é um método de uma classe?",
        alternativas: [
          { id: "a", texto: "Uma função definida dentro da classe, que as instâncias podem chamar" },
          { id: "b", texto: "Uma variável global" },
          { id: "c", texto: "Um tipo de array" },
          { id: "d", texto: "Um comentário" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "logica",
        enunciado: "O que aparece no console quando esse código roda?",
        codigo: 'class Pessoa {\n  constructor(nome) {\n    this.nome = nome\n  }\n  saudacao() {\n    return `Oi, sou ${this.nome}`\n  }\n}\nconst p = new Pessoa("Caio")\nconsole.log(p.saudacao())',
        alternativas: [
          { id: "a", texto: "\"Oi, sou Caio\"" },
          { id: "b", texto: "\"Oi, sou this.nome\"" },
          { id: "c", texto: "undefined" },
          { id: "d", texto: "Dá erro" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "completar",
        enunciado: "Complete pra chamar o método saudacao da instância p:",
        codigoAntes: "console.log(p",
        codigoDepois: "())",
        blocos: [".saudacao", ".saudacao()", "saudacao", ".nome"],
        respostaCorreta: ".saudacao",
      },
    ],
  },

  u7_licao_4: {
    licaoId: "u7_licao_4",
    introducao: [
      {
        titulo: "extends",
        texto: "Uma classe pode herdar de outra com extends, ganhando suas propriedades e métodos.",
        codigo: "class Animal {\n  constructor(nome) {\n    this.nome = nome\n  }\n}\nclass Cachorro extends Animal {}",
      },
      {
        titulo: "super()",
        texto: "Dentro do constructor de uma classe filha, super(...) chama o constructor da classe pai.",
        codigo: "class Cachorro extends Animal {\n  constructor(nome, raca) {\n    super(nome)\n    this.raca = raca\n  }\n}",
      },
      {
        titulo: "Reaproveitando código",
        texto: "A classe filha não precisa reescrever o que já existe na classe pai — só o que é diferente.",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "O que extends faz entre duas classes?",
        alternativas: [
          { id: "a", texto: "Faz uma classe herdar propriedades e métodos de outra" },
          { id: "b", texto: "Cria uma cópia idêntica da classe" },
          { id: "c", texto: "Apaga a classe pai" },
          { id: "d", texto: "Impede a criação de instâncias" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "alternativa",
        enunciado: "Pra que serve super() dentro do constructor de uma classe filha?",
        alternativas: [
          { id: "a", texto: "Chama o constructor da classe pai" },
          { id: "b", texto: "Cria uma nova classe" },
          { id: "c", texto: "Apaga o this" },
          { id: "d", texto: "Não serve pra nada" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "completar",
        selo: { tipo: "novo", texto: "Sintaxe nova" },
        termoDestacado: "extends",
        enunciado: "Complete pra Cachorro herdar de Animal:",
        codigoAntes: "class Cachorro ",
        codigoDepois: " Animal {}",
        blocos: ["extends", "implements", "inherits", "from"],
        respostaCorreta: "extends",
      },
    ],
  },

  u7_licao_5: {
    licaoId: "u7_licao_5",
    introducao: [
      {
        titulo: "O que é encapsulamento",
        texto: "É a ideia de esconder detalhes internos de um objeto, expondo só o que é necessário usar de fora.",
      },
      {
        titulo: "Campo privado com #",
        texto: "Colocar # antes do nome de uma propriedade faz ela só poder ser acessada de dentro da própria classe.",
        codigo: "class ContaBancaria {\n  #saldo = 0\n  depositar(valor) {\n    this.#saldo += valor\n  }\n}",
      },
      {
        titulo: "Por que isso importa",
        texto: "Impede que código de fora altere o saldo diretamente, sem passar pelas regras da classe (como depositar).",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "O que é encapsulamento?",
        alternativas: [
          { id: "a", texto: "Esconder detalhes internos de um objeto, expondo só o necessário" },
          { id: "b", texto: "Criar várias classes iguais" },
          { id: "c", texto: "Apagar uma classe" },
          { id: "d", texto: "Um tipo de laço" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "alternativa",
        enunciado: "O que o símbolo # antes de uma propriedade indica?",
        alternativas: [
          { id: "a", texto: "Que ela é privada, só acessível de dentro da classe" },
          { id: "b", texto: "Que ela é um comentário" },
          { id: "c", texto: "Que ela é pública" },
          { id: "d", texto: "Que ela é uma função" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "completar",
        selo: { tipo: "novo", texto: "Sintaxe nova" },
        termoDestacado: "#",
        enunciado: "Complete pra declarar um campo privado chamado saldo:",
        codigoAntes: "class ContaBancaria { ",
        codigoDepois: "saldo = 0 }",
        blocos: ["#", "_", "$", "private "],
        respostaCorreta: "#",
      },
    ],
  },

  u7_licao_6: {
    licaoId: "u7_licao_6",
    introducao: [
      {
        titulo: "get",
        texto: "Um getter é um método que se comporta como se fosse uma propriedade — lido sem parênteses.",
        codigo: "class Circulo {\n  constructor(raio) {\n    this.raio = raio\n  }\n  get area() {\n    return Math.PI * this.raio ** 2\n  }\n}",
      },
      {
        titulo: "Usando o getter",
        texto: "Acessa como propriedade, sem chamar como função.",
        codigo: "const c = new Circulo(2)\nconsole.log(c.area)\n// 12.56...",
      },
      {
        titulo: "set",
        texto: "Um setter roda automaticamente quando alguém tenta atribuir um valor àquela \"propriedade\", permitindo validar antes.",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "Como se acessa um getter?",
        alternativas: [
          { id: "a", texto: "Como uma propriedade comum, sem parênteses" },
          { id: "b", texto: "Sempre com parênteses, como um método" },
          { id: "c", texto: "Só de dentro da própria classe" },
          { id: "d", texto: "Não dá pra acessar de forma nenhuma" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "alternativa",
        enunciado: "Pra que serve um setter?",
        alternativas: [
          { id: "a", texto: "Rodar um código automaticamente quando um valor é atribuído a uma propriedade" },
          { id: "b", texto: "Ler um valor sem executar nada" },
          { id: "c", texto: "Criar uma nova classe" },
          { id: "d", texto: "Apagar uma propriedade" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "completar",
        selo: { tipo: "novo", texto: "Sintaxe nova" },
        termoDestacado: "get",
        enunciado: "Complete pra declarar um getter chamado area:",
        codigoAntes: "class Circulo { ",
        codigoDepois: " area() { return Math.PI * this.raio ** 2 } }",
        blocos: ["get ", "set ", "function ", "const "],
        respostaCorreta: "get ",
      },
    ],
  },

  u7_licao_7: {
    licaoId: "u7_licao_7",
    introducao: [
      {
        titulo: "O que é polimorfismo",
        texto: "É quando classes diferentes têm um método com o mesmo nome, mas cada uma implementa ele do seu jeito.",
        codigo: 'class Animal {\n  falar() { return "..." }\n}\nclass Cachorro extends Animal {\n  falar() { return "Au au" }\n}\nclass Gato extends Animal {\n  falar() { return "Miau" }\n}',
      },
      {
        titulo: "Chamando sem saber o tipo exato",
        texto: "Dá pra chamar .falar() em qualquer Animal, e cada um responde do seu jeito, sem precisar de um if pra cada tipo.",
        codigo: "const animais = [new Cachorro(), new Gato()]\nanimais.forEach(a => console.log(a.falar()))",
      },
      {
        titulo: "Por que isso é útil",
        texto: "Simplifica código que trabalha com vários tipos parecidos, sem precisar checar o tipo de cada um.",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "O que é polimorfismo?",
        alternativas: [
          { id: "a", texto: "Classes diferentes implementando um método de mesmo nome, cada uma do seu jeito" },
          { id: "b", texto: "Uma classe sem métodos" },
          { id: "c", texto: "Um tipo de erro" },
          { id: "d", texto: "Um jeito de apagar uma classe" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "logica",
        enunciado: "O que aparece no console quando esse código roda?",
        codigo: 'class Animal {\n  falar() { return "..." }\n}\nclass Gato extends Animal {\n  falar() { return "Miau" }\n}\nconst g = new Gato()\nconsole.log(g.falar())',
        alternativas: [
          { id: "a", texto: "\"...\"" },
          { id: "b", texto: "\"Miau\"" },
          { id: "c", texto: "undefined" },
          { id: "d", texto: "Dá erro" },
        ],
        respostaCorretaId: "b",
      },
      {
        id: "p3",
        tipo: "alternativa",
        enunciado: "Qual a vantagem prática do polimorfismo?",
        alternativas: [
          { id: "a", texto: "Dá pra chamar o mesmo método em objetos de tipos diferentes, sem checar o tipo de cada um" },
          { id: "b", texto: "O código fica mais lento" },
          { id: "c", texto: "Impede herança" },
          { id: "d", texto: "Não tem vantagem real" },
        ],
        respostaCorretaId: "a",
      },
    ],
  },

  u7_licao_8: {
    licaoId: "u7_licao_8",
    introducao: [
      {
        titulo: "Você chegou até aqui!",
        texto:
          "Nessa unidade você viu: classes, construtores, métodos, herança (extends/super), encapsulamento, getters/setters e polimorfismo. Essa revisão junta um pouco de cada assunto.",
      },
      {
        titulo: "Tudo junto",
        texto: "Uma hierarquia comum: uma classe base com propriedades e comportamento compartilhado, e classes filhas que especializam com extends.",
        codigo: 'class Animal {\n  constructor(nome) {\n    this.nome = nome\n  }\n  falar() { return "..." }\n}\nclass Gato extends Animal {\n  falar() { return "Miau" }\n}',
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "O que new Classe() cria?",
        alternativas: [
          { id: "a", texto: "Uma instância (objeto) a partir do molde da classe" },
          { id: "b", texto: "Uma cópia do arquivo" },
          { id: "c", texto: "Um array" },
          { id: "d", texto: "Um comentário" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "logica",
        enunciado: "O que aparece no console quando esse código roda?",
        codigo: 'class Animal {\n  constructor(nome) {\n    this.nome = nome\n  }\n}\nclass Gato extends Animal {}\nconst g = new Gato("Mimi")\nconsole.log(g.nome)',
        alternativas: [
          { id: "a", texto: "\"Mimi\"" },
          { id: "b", texto: "undefined" },
          { id: "c", texto: "\"Animal\"" },
          { id: "d", texto: "Dá erro" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "completar",
        enunciado: "Complete pra Gato chamar o constructor de Animal:",
        codigoAntes: "constructor(nome) { ",
        codigoDepois: "(nome) }",
        blocos: ["super", "this", "extends", "new"],
        respostaCorreta: "super",
      },
      {
        id: "p4",
        tipo: "alternativa",
        enunciado: "O que o símbolo # faz numa propriedade de classe?",
        alternativas: [
          { id: "a", texto: "Torna ela privada, só acessível de dentro da classe" },
          { id: "b", texto: "Torna ela pública" },
          { id: "c", texto: "Cria um comentário" },
          { id: "d", texto: "Nada, é só estilo" },
        ],
        respostaCorretaId: "a",
      },
    ],
  },

  // ---------- Unidade 8: Tratamento de Erros ----------

  u8_licao_1: {
    licaoId: "u8_licao_1",
    introducao: [
      {
        titulo: "Tipos de erro comuns",
        texto:
          "SyntaxError (código mal escrito), TypeError (usar um valor de um jeito que o tipo dele não permite) e ReferenceError (usar algo que não existe) estão entre os mais comuns.",
        codigo: "console.log(numeroQueNaoExiste)\n// ReferenceError",
      },
      {
        titulo: "Lendo a mensagem de erro",
        texto: "A mensagem geralmente diz o tipo do erro e uma pista de onde/por que aconteceu.",
      },
      {
        titulo: "Erro não tratado",
        texto: "Se um erro acontece e ninguém trata ele, o programa para de rodar naquele ponto.",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "O que é um TypeError?",
        alternativas: [
          { id: "a", texto: "Um erro por usar um valor de um jeito que o tipo dele não permite" },
          { id: "b", texto: "Um erro de português" },
          { id: "c", texto: "Um aviso que não impede o código de rodar" },
          { id: "d", texto: "Não existe esse tipo de erro" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "alternativa",
        enunciado: "O que acontece quando um erro não é tratado?",
        alternativas: [
          { id: "a", texto: "O programa para de rodar naquele ponto" },
          { id: "b", texto: "Nada, o JavaScript ignora sozinho" },
          { id: "c", texto: "O erro vira um comentário" },
          { id: "d", texto: "O erro se conserta sozinho" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "alternativa",
        enunciado: "O que é um ReferenceError?",
        alternativas: [
          { id: "a", texto: "Tentar usar algo (variável/função) que não existe" },
          { id: "b", texto: "Um erro de português" },
          { id: "c", texto: "Escrever código bonito" },
          { id: "d", texto: "Um tipo de array" },
        ],
        respostaCorretaId: "a",
      },
    ],
  },

  u8_licao_2: {
    licaoId: "u8_licao_2",
    introducao: [
      {
        titulo: "try",
        texto: "O bloco try roda um código que pode falhar.",
        codigo: 'try {\n  JSON.parse("{ invalido")\n} catch (erro) {\n  console.log("Deu erro!")\n}',
      },
      {
        titulo: "catch",
        texto: "Se algo dentro do try der erro, o bloco catch roda no lugar de quebrar o programa, recebendo o erro.",
      },
      {
        titulo: "O objeto erro",
        texto: "Dentro do catch, erro.message tem a descrição do que aconteceu.",
        codigo: "catch (erro) {\n  console.log(erro.message)\n}",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "O que o bloco try faz?",
        alternativas: [
          { id: "a", texto: "Roda um código que pode falhar" },
          { id: "b", texto: "Sempre lança um erro" },
          { id: "c", texto: "Substitui um if" },
          { id: "d", texto: "Cria uma função" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "logica",
        enunciado: "O que aparece no console quando esse código roda?",
        codigo: 'try {\n  JSON.parse("{ invalido")\n} catch (erro) {\n  console.log("Capturado")\n}',
        alternativas: [
          { id: "a", texto: "\"Capturado\"" },
          { id: "b", texto: "Nada, o programa quebra" },
          { id: "c", texto: "\"{ invalido\"" },
          { id: "d", texto: "undefined" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "completar",
        enunciado: "Complete pra capturar o erro que aconteceu no try:",
        codigoAntes: "try { risco() } ",
        codigoDepois: " (erro) { console.log(erro.message) }",
        blocos: ["catch", "except", "error", "finally"],
        respostaCorreta: "catch",
      },
    ],
  },

  u8_licao_3: {
    licaoId: "u8_licao_3",
    introducao: [
      {
        titulo: "throw",
        texto: "Lança um erro de propósito, interrompendo a execução até um catch pegar ele.",
        codigo: 'function dividir(a, b) {\n  if (b === 0) {\n    throw new Error("Não pode dividir por zero")\n  }\n  return a / b\n}',
      },
      {
        titulo: "new Error()",
        texto: "O jeito mais comum de criar um erro é com new Error(\"mensagem\").",
      },
      {
        titulo: "Capturando um erro lançado",
        texto: "Um erro lançado com throw funciona igual qualquer outro erro: um try/catch em volta consegue pegar ele.",
        codigo: "try {\n  dividir(10, 0)\n} catch (erro) {\n  console.log(erro.message)\n}",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "Pra que serve throw?",
        alternativas: [
          { id: "a", texto: "Lançar um erro de propósito" },
          { id: "b", texto: "Criar uma variável" },
          { id: "c", texto: "Repetir um bloco de código" },
          { id: "d", texto: "Comentar uma linha" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "logica",
        selo: { tipo: "novo", texto: "Sintaxe nova" },
        termoDestacado: "throw",
        enunciado: "O que aparece no console quando esse código roda?",
        codigo: 'function dividir(a, b) {\n  if (b === 0) {\n    throw new Error("Não pode dividir por zero")\n  }\n  return a / b\n}\ntry {\n  dividir(10, 0)\n} catch (erro) {\n  console.log(erro.message)\n}',
        alternativas: [
          { id: "a", texto: "\"Não pode dividir por zero\"" },
          { id: "b", texto: "undefined" },
          { id: "c", texto: "Infinity" },
          { id: "d", texto: "\"10\"" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "completar",
        enunciado: "Complete pra lançar um erro com a mensagem \"Inválido\":",
        codigoAntes: "",
        codigoDepois: ' new Error("Inválido")',
        blocos: ["throw", "catch", "return", "new"],
        respostaCorreta: "throw",
      },
    ],
  },

  u8_licao_4: {
    licaoId: "u8_licao_4",
    introducao: [
      {
        titulo: "Estendendo Error",
        texto: "Dá pra criar um tipo de erro próprio, estendendo a classe Error com extends.",
        codigo: 'class ErroValidacao extends Error {\n  constructor(mensagem) {\n    super(mensagem)\n    this.name = "ErroValidacao"\n  }\n}',
      },
      {
        titulo: "Lançando o erro customizado",
        texto: "Funciona igual qualquer Error, só que com um nome/tipo específico.",
        codigo: 'throw new ErroValidacao("Campo obrigatório")',
      },
      {
        titulo: "Por que criar um erro customizado",
        texto: "Ajuda a diferenciar tipos de erro no catch, pra tratar cada um de um jeito.",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "Como criar um tipo de erro próprio?",
        alternativas: [
          { id: "a", texto: "Criando uma classe que estende (extends) Error" },
          { id: "b", texto: "Não é possível, só dá pra usar Error direto" },
          { id: "c", texto: "Com um array de erros" },
          { id: "d", texto: "Com console.error()" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "alternativa",
        enunciado: "O que super(mensagem) faz dentro do constructor de um erro customizado?",
        alternativas: [
          { id: "a", texto: "Chama o constructor da classe Error, guardando a mensagem" },
          { id: "b", texto: "Lança o erro imediatamente" },
          { id: "c", texto: "Cria uma nova classe" },
          { id: "d", texto: "Apaga a mensagem" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "completar",
        enunciado: "Complete pra ErroValidacao herdar de Error:",
        codigoAntes: "class ErroValidacao ",
        codigoDepois: " Error {}",
        blocos: ["extends", "implements", "throws", "from"],
        respostaCorreta: "extends",
      },
    ],
  },

  u8_licao_5: {
    licaoId: "u8_licao_5",
    introducao: [
      {
        titulo: "O bloco finally",
        texto: "Roda sempre, depois do try/catch, não importa se deu erro ou não.",
        codigo: 'try {\n  risco()\n} catch (erro) {\n  console.log("Erro!")\n} finally {\n  console.log("Sempre roda")\n}',
      },
      {
        titulo: "Pra que serve",
        texto: "Útil pra limpeza, como fechar uma conexão ou parar um carregamento, que precisa acontecer de qualquer jeito.",
      },
      {
        titulo: "Ordem de execução",
        texto: "try (ou catch, se der erro) roda primeiro — finally sempre por último.",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "Quando o bloco finally roda?",
        alternativas: [
          { id: "a", texto: "Sempre, depois do try/catch, não importa se deu erro ou não" },
          { id: "b", texto: "Só se der erro" },
          { id: "c", texto: "Só se não der erro" },
          { id: "d", texto: "Nunca roda automaticamente" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "logica",
        selo: { tipo: "novo", texto: "Sintaxe nova" },
        termoDestacado: "finally",
        enunciado: "Em que ordem os valores aparecem no console?",
        codigo: 'try {\n  console.log("A")\n  throw new Error("falhou")\n} catch (erro) {\n  console.log("B")\n} finally {\n  console.log("C")\n}',
        alternativas: [
          { id: "a", texto: "A, B, C" },
          { id: "b", texto: "A, C, B" },
          { id: "c", texto: "C, A, B" },
          { id: "d", texto: "B, A, C" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "completar",
        enunciado: "Complete pra rodar um bloco que sempre executa, com erro ou sem:",
        codigoAntes: "try { risco() } catch (erro) { tratar() } ",
        codigoDepois: " { limpar() }",
        blocos: ["finally", "then", "always", "end"],
        respostaCorreta: "finally",
      },
    ],
  },

  u8_licao_6: {
    licaoId: "u8_licao_6",
    introducao: [
      {
        titulo: "console.log como depuração",
        texto: "A forma mais simples de depurar é espalhar console.log() pra ver os valores das variáveis em cada ponto.",
      },
      {
        titulo: "console.error e console.table",
        texto: "console.error() destaca uma mensagem como erro; console.table() mostra um array/objeto formatado como tabela.",
        codigo: 'console.table([{ nome: "Ana" }, { nome: "Bia" }])',
      },
      {
        titulo: "Breakpoints",
        texto:
          "Nas ferramentas de desenvolvedor do navegador, um breakpoint pausa o código numa linha específica pra inspecionar tudo naquele momento — sem precisar de console.log espalhado.",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "Qual é a forma mais simples de depurar, espalhando pontos de checagem pelo código?",
        alternativas: [
          { id: "a", texto: "console.log()" },
          { id: "b", texto: "throw" },
          { id: "c", texto: "try/catch" },
          { id: "d", texto: "extends" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "alternativa",
        enunciado: "O que um breakpoint faz nas ferramentas de desenvolvedor?",
        alternativas: [
          { id: "a", texto: "Pausa a execução numa linha específica pra inspecionar o estado ali" },
          { id: "b", texto: "Apaga uma linha de código" },
          { id: "c", texto: "Formata o código automaticamente" },
          { id: "d", texto: "Cria um novo arquivo" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "alternativa",
        enunciado: "Pra que serve console.table()?",
        alternativas: [
          { id: "a", texto: "Mostrar um array/objeto formatado como tabela" },
          { id: "b", texto: "Criar uma tabela HTML na página" },
          { id: "c", texto: "Ordenar um array" },
          { id: "d", texto: "Lançar um erro" },
        ],
        respostaCorretaId: "a",
      },
    ],
  },

  u8_licao_7: {
    licaoId: "u8_licao_7",
    introducao: [
      {
        titulo: "Validar antes de usar",
        texto: "Checar se um valor é o esperado ANTES de usar ele evita muitos erros em tempo de execução.",
        codigo: 'function dividir(a, b) {\n  if (typeof a !== "number" || typeof b !== "number") {\n    throw new Error("Os dois valores precisam ser números")\n  }\n  return a / b\n}',
      },
      {
        titulo: "Valores que costumam quebrar código",
        texto: "undefined, null ou tipo errado estão entre as causas mais comuns de erro em produção.",
      },
      {
        titulo: "Falhar cedo",
        texto: "É melhor lançar um erro claro assim que algo inválido aparece, do que deixar o programa continuar com um dado errado.",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "Por que validar um valor antes de usar ele?",
        alternativas: [
          { id: "a", texto: "Evita muitos erros em tempo de execução" },
          { id: "b", texto: "Deixa o código mais lento sem nenhum motivo" },
          { id: "c", texto: "É opcional e nunca ajuda" },
          { id: "d", texto: "Só serve pra formulários" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "alternativa",
        enunciado: "Quais valores costumam ser as causas mais comuns de erro?",
        alternativas: [
          { id: "a", texto: "undefined, null ou tipo errado" },
          { id: "b", texto: "Números pares" },
          { id: "c", texto: "Strings muito curtas" },
          { id: "d", texto: "Comentários" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "completar",
        selo: { tipo: "novo", texto: "Sintaxe nova" },
        termoDestacado: "typeof",
        enunciado: "Complete pra checar se a NÃO é do tipo number:",
        codigoAntes: "if (",
        codigoDepois: ' a !== "number") { throw new Error("Inválido") }',
        blocos: ["typeof", "type", "instanceof", "isType"],
        respostaCorreta: "typeof",
      },
    ],
  },

  u8_licao_8: {
    licaoId: "u8_licao_8",
    introducao: [
      {
        titulo: "Você chegou até aqui!",
        texto:
          "Nessa unidade você viu: erros comuns, try/catch, throw, erros customizados, finally, depuração e validação. Essa revisão junta um pouco de cada assunto.",
      },
      {
        titulo: "Tudo junto",
        texto: "Um padrão comum: validar a entrada, lançar um erro claro se algo estiver errado, e capturar esse erro em volta.",
        codigo: 'function dividir(a, b) {\n  if (b === 0) throw new Error("Não pode dividir por zero")\n  return a / b\n}\ntry {\n  console.log(dividir(10, 0))\n} catch (erro) {\n  console.log(erro.message)\n}',
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "O que try/catch faz?",
        alternativas: [
          { id: "a", texto: "Roda um código que pode falhar, e trata o erro se acontecer" },
          { id: "b", texto: "Sempre lança um erro" },
          { id: "c", texto: "Cria uma nova variável" },
          { id: "d", texto: "Formata o código" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "logica",
        enunciado: "O que aparece no console quando esse código roda?",
        codigo: 'function dividir(a, b) {\n  if (b === 0) throw new Error("Não pode dividir por zero")\n  return a / b\n}\ntry {\n  console.log(dividir(10, 0))\n} catch (erro) {\n  console.log(erro.message)\n}',
        alternativas: [
          { id: "a", texto: "\"Não pode dividir por zero\"" },
          { id: "b", texto: "Infinity" },
          { id: "c", texto: "undefined" },
          { id: "d", texto: "\"10\"" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "completar",
        enunciado: "Complete pra rodar um bloco que sempre executa, com erro ou sem:",
        codigoAntes: "try { risco() } catch (erro) { tratar() } ",
        codigoDepois: " { limpar() }",
        blocos: ["finally", "then", "always", "end"],
        respostaCorreta: "finally",
      },
      {
        id: "p4",
        tipo: "codigo",
        selo: { tipo: "dificil", texto: "Escreva o código" },
        enunciado:
          "Escreva uma função validarIdade(idade) que lança um Error com a mensagem \"Idade inválida\" se idade for menor que 0. Capture com try/catch chamando validarIdade(-5) e imprima erro.message.",
        codigoInicial: "",
        resultadoEsperado: "Idade inválida",
        dica: 'function validarIdade(idade) {\n  if (idade < 0) {\n    throw new Error("Idade inválida")\n  }\n}\ntry {\n  validarIdade(-5)\n} catch (erro) {\n  console.log(erro.message)\n}',
      },
    ],
  },

  // ---------- Unidade 9: Módulos e Ferramentas ----------
  // Assunto majoritariamente conceitual (import/export de arquivo, NPM,
  // bundlers) — não roda dentro do playground de uma linha só, então sem
  // perguntas do tipo "codigo" aqui.

  u9_licao_1: {
    licaoId: "u9_licao_1",
    introducao: [
      {
        titulo: "Por que dividir em módulos",
        texto: "Conforme um projeto cresce, dividir o código em vários arquivos (módulos) facilita organizar e reaproveitar.",
      },
      {
        titulo: "export",
        texto: "export marca o que um arquivo disponibiliza pra outros arquivos usarem.",
        codigo: "// arquivo matematica.js\nexport function somar(a, b) {\n  return a + b\n}",
      },
      {
        titulo: "import",
        texto: "import traz algo exportado de outro arquivo pra usar no atual.",
        codigo: '// arquivo principal.js\nimport { somar } from "./matematica.js"\nconsole.log(somar(2, 3))',
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "Pra que serve dividir um projeto em módulos (vários arquivos)?",
        alternativas: [
          { id: "a", texto: "Facilita organizar e reaproveitar código" },
          { id: "b", texto: "Deixa o código mais lento" },
          { id: "c", texto: "É obrigatório em todo projeto, mesmo pequeno" },
          { id: "d", texto: "Não tem nenhuma vantagem" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "alternativa",
        enunciado: "O que export faz num arquivo?",
        alternativas: [
          { id: "a", texto: "Marca o que esse arquivo disponibiliza pra outros usarem" },
          { id: "b", texto: "Apaga uma função" },
          { id: "c", texto: "Roda o arquivo automaticamente" },
          { id: "d", texto: "Cria uma variável global" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "completar",
        selo: { tipo: "novo", texto: "Sintaxe nova" },
        termoDestacado: "import",
        enunciado: "Complete pra trazer a função somar do arquivo matematica.js:",
        codigoAntes: "",
        codigoDepois: ' { somar } from "./matematica.js"',
        blocos: ["import", "export", "require", "include"],
        respostaCorreta: "import",
      },
    ],
  },

  u9_licao_2: {
    licaoId: "u9_licao_2",
    introducao: [
      {
        titulo: "O que é NPM",
        texto: "Node Package Manager é o gerenciador de pacotes do Node.js — usado pra instalar bibliotecas prontas, feitas por outras pessoas.",
      },
      {
        titulo: "package.json",
        texto: "Arquivo que lista as dependências (pacotes) do projeto, e outras configurações.",
        codigo: '{\n  "name": "meu-projeto",\n  "dependencies": {\n    "lodash": "^4.17.21"\n  }\n}',
      },
      {
        titulo: "npm install",
        texto: "O comando que baixa e instala os pacotes listados no package.json.",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "O que é o NPM?",
        alternativas: [
          { id: "a", texto: "O gerenciador de pacotes do Node.js, pra instalar bibliotecas prontas" },
          { id: "b", texto: "Uma linguagem de programação" },
          { id: "c", texto: "Um tipo de banco de dados" },
          { id: "d", texto: "Um framework de CSS" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "alternativa",
        enunciado: "O que o arquivo package.json guarda?",
        alternativas: [
          { id: "a", texto: "As dependências (pacotes) do projeto e outras configurações" },
          { id: "b", texto: "O código-fonte inteiro do projeto" },
          { id: "c", texto: "Só comentários" },
          { id: "d", texto: "As imagens do site" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "alternativa",
        enunciado: "O que o comando npm install faz?",
        alternativas: [
          { id: "a", texto: "Baixa e instala os pacotes listados no package.json" },
          { id: "b", texto: "Apaga o projeto" },
          { id: "c", texto: "Cria um novo arquivo HTML" },
          { id: "d", texto: "Roda os testes" },
        ],
        respostaCorretaId: "a",
      },
    ],
  },

  u9_licao_3: {
    licaoId: "u9_licao_3",
    introducao: [
      {
        titulo: "O problema",
        texto: "Um projeto grande tem vários arquivos e módulos, mas nem todo navegador entende import/export do mesmo jeito.",
      },
      {
        titulo: "O que um bundler faz",
        texto: "Junta vários arquivos JavaScript num só (ou poucos), otimizado pra rodar no navegador.",
      },
      {
        titulo: "Exemplos",
        texto: "Webpack, Vite e esbuild são bundlers populares no ecossistema JavaScript.",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "O que um bundler faz?",
        alternativas: [
          { id: "a", texto: "Junta vários arquivos JavaScript num só (ou poucos), pronto pro navegador" },
          { id: "b", texto: "Apaga arquivos não usados do computador" },
          { id: "c", texto: "Escreve testes automaticamente" },
          { id: "d", texto: "Cria um banco de dados" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "alternativa",
        enunciado: "Qual desses é um exemplo de bundler?",
        alternativas: [
          { id: "a", texto: "Vite" },
          { id: "b", texto: "JSON" },
          { id: "c", texto: "HTML" },
          { id: "d", texto: "CSS" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "alternativa",
        enunciado: "Por que um projeto grande costuma usar um bundler?",
        alternativas: [
          { id: "a", texto: "Pra juntar e otimizar vários arquivos antes de rodar no navegador" },
          { id: "b", texto: "Porque o JavaScript não existe sem ele" },
          { id: "c", texto: "Só por estética" },
          { id: "d", texto: "Não existe motivo real" },
        ],
        respostaCorretaId: "a",
      },
    ],
  },

  u9_licao_4: {
    licaoId: "u9_licao_4",
    introducao: [
      {
        titulo: "O que é ES6+",
        texto:
          "ECMAScript é o padrão oficial do JavaScript. ES6 (2015) trouxe let/const, arrow functions, template literals, classes — muito do que você já aprendeu.",
      },
      {
        titulo: "Versões seguintes",
        texto: "A cada ano surgem novos recursos (ES2016, ES2017...), coletivamente chamados de \"ES6+\" ou \"JavaScript moderno\".",
      },
      {
        titulo: "Compatibilidade",
        texto: "Nem todo navegador antigo suporta os recursos mais novos — por isso ferramentas de build às vezes convertem código moderno pra uma versão mais compatível.",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "O que é ECMAScript?",
        alternativas: [
          { id: "a", texto: "O padrão oficial que define a linguagem JavaScript" },
          { id: "b", texto: "Um framework de CSS" },
          { id: "c", texto: "Um tipo de banco de dados" },
          { id: "d", texto: "Um navegador" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "alternativa",
        enunciado: "Quais recursos o ES6 trouxe pro JavaScript?",
        alternativas: [
          { id: "a", texto: "let/const, arrow functions, template literals, classes, entre outros" },
          { id: "b", texto: "HTML e CSS" },
          { id: "c", texto: "O próprio navegador" },
          { id: "d", texto: "Nenhum recurso novo" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "alternativa",
        enunciado: "Por que às vezes é preciso converter código moderno pra uma versão mais antiga?",
        alternativas: [
          { id: "a", texto: "Porque nem todo navegador antigo suporta os recursos mais novos" },
          { id: "b", texto: "Porque é proibido usar recursos novos" },
          { id: "c", texto: "Esse processo não existe" },
          { id: "d", texto: "Só por estética" },
        ],
        respostaCorretaId: "a",
      },
    ],
  },

  u9_licao_5: {
    licaoId: "u9_licao_5",
    introducao: [
      {
        titulo: "O que é um transpilador",
        texto: "O Babel é o transpilador mais usado: converte JavaScript moderno numa versão que navegadores mais antigos entendem.",
      },
      {
        titulo: "Build",
        texto: "\"Build\" é o processo de transformar o código-fonte (o que você escreve) no código final, otimizado, que vai pro navegador.",
      },
      {
        titulo: "Ferramentas de build comuns",
        texto: "Babel (converte sintaxe), Webpack/Vite (empacota) e ESLint (aponta problemas) costumam trabalhar juntos nesse processo.",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "O que o Babel faz?",
        alternativas: [
          { id: "a", texto: "Converte JavaScript moderno numa versão que navegadores antigos entendem" },
          { id: "b", texto: "Cria bancos de dados" },
          { id: "c", texto: "Desenha interfaces" },
          { id: "d", texto: "Escreve testes sozinho" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "alternativa",
        enunciado: "O que significa \"build\" de um projeto?",
        alternativas: [
          { id: "a", texto: "Transformar o código-fonte no código final, otimizado, que vai pro navegador" },
          { id: "b", texto: "Apagar o projeto inteiro" },
          { id: "c", texto: "Escrever a primeira versão do código" },
          { id: "d", texto: "Fazer backup do código" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "alternativa",
        enunciado: "Qual dessas ferramentas aponta problemas no código, como parte do processo de build?",
        alternativas: [
          { id: "a", texto: "ESLint" },
          { id: "b", texto: "HTML" },
          { id: "c", texto: "JSON" },
          { id: "d", texto: "CSV" },
        ],
        respostaCorretaId: "a",
      },
    ],
  },

  u9_licao_6: {
    licaoId: "u9_licao_6",
    introducao: [
      {
        titulo: "Nomes claros",
        texto: "Variáveis e funções com nomes que dizem o que elas fazem tornam o código mais fácil de entender, sem precisar de comentário.",
        codigo: "// Ruim\nconst x = 10\n\n// Bom\nconst idadeMinima = 10",
      },
      {
        titulo: "Funções pequenas",
        texto: "Uma função que faz uma coisa só é mais fácil de testar, entender e reaproveitar do que uma função gigante que faz tudo.",
      },
      {
        titulo: "Evitar repetição (DRY)",
        texto: "\"Don't Repeat Yourself\": se um mesmo trecho de código aparece várias vezes, geralmente vale a pena virar uma função.",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "Por que usar nomes claros pra variáveis e funções?",
        alternativas: [
          { id: "a", texto: "Torna o código mais fácil de entender, sem precisar de comentário" },
          { id: "b", texto: "Deixa o código mais lento" },
          { id: "c", texto: "É só uma questão de estilo, sem impacto real" },
          { id: "d", texto: "É obrigatório pelo JavaScript" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "alternativa",
        enunciado: "O que o princípio DRY (Don't Repeat Yourself) recomenda?",
        alternativas: [
          { id: "a", texto: "Evitar repetir o mesmo trecho de código, transformando ele numa função" },
          { id: "b", texto: "Escrever tudo numa única linha" },
          { id: "c", texto: "Nunca usar funções" },
          { id: "d", texto: "Repetir o código pra garantir que funciona" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "alternativa",
        enunciado: "Qual a vantagem de uma função pequena, que faz só uma coisa?",
        alternativas: [
          { id: "a", texto: "É mais fácil de testar, entender e reaproveitar" },
          { id: "b", texto: "Ela roda mais rápido sempre" },
          { id: "c", texto: "Ela nunca tem bugs" },
          { id: "d", texto: "Não tem nenhuma vantagem real" },
        ],
        respostaCorretaId: "a",
      },
    ],
  },

  u9_licao_7: {
    licaoId: "u9_licao_7",
    introducao: [
      {
        titulo: "Por que testar",
        texto: "Um teste automatizado verifica se uma função continua funcionando do jeito esperado, mesmo depois de mudanças no código.",
      },
      {
        titulo: "Um teste simples",
        texto: "Compara o resultado real de uma função com o resultado esperado.",
        codigo: "function somar(a, b) {\n  return a + b\n}\n\n// teste\nconsole.log(somar(2, 3) === 5)\n// true = passou",
      },
      {
        titulo: "Ferramentas de teste",
        texto: "Jest e Vitest são bibliotecas populares que organizam e rodam testes automaticamente, com uma sintaxe própria.",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "Pra que serve um teste automatizado?",
        alternativas: [
          { id: "a", texto: "Verificar se uma função continua funcionando como esperado, mesmo após mudanças" },
          { id: "b", texto: "Deixar o código mais bonito" },
          { id: "c", texto: "Substituir a necessidade de escrever funções" },
          { id: "d", texto: "Rodar o site mais rápido" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "logica",
        enunciado: "O que aparece no console quando esse código roda?",
        codigo: "function somar(a, b) {\n  return a + b\n}\nconsole.log(somar(2, 3) === 5)",
        alternativas: [
          { id: "a", texto: "true" },
          { id: "b", texto: "false" },
          { id: "c", texto: "5" },
          { id: "d", texto: "undefined" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "alternativa",
        enunciado: "Qual dessas é uma biblioteca popular pra escrever e rodar testes?",
        alternativas: [
          { id: "a", texto: "Jest" },
          { id: "b", texto: "HTML" },
          { id: "c", texto: "CSS" },
          { id: "d", texto: "JSON" },
        ],
        respostaCorretaId: "a",
      },
    ],
  },

  u9_licao_8: {
    licaoId: "u9_licao_8",
    introducao: [
      {
        titulo: "Você chegou até aqui!",
        texto:
          "Nessa unidade você viu: módulos (import/export), NPM, bundlers, ES6+, build tools, boas práticas e testes. Essa revisão junta um pouco de cada assunto.",
      },
      {
        titulo: "Tudo junto",
        texto:
          "Um projeto real combina tudo isso: código dividido em módulos, dependências instaladas via NPM, empacotado por um bundler, e testado antes de ir pro ar.",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "O que export faz num módulo?",
        alternativas: [
          { id: "a", texto: "Marca o que esse arquivo disponibiliza pra outros usarem" },
          { id: "b", texto: "Apaga o arquivo" },
          { id: "c", texto: "Roda testes" },
          { id: "d", texto: "Instala um pacote" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "alternativa",
        enunciado: "O que o NPM instala, a partir do package.json?",
        alternativas: [
          { id: "a", texto: "Os pacotes (dependências) do projeto" },
          { id: "b", texto: "O navegador" },
          { id: "c", texto: "O sistema operacional" },
          { id: "d", texto: "Nada, só lê o arquivo" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "alternativa",
        enunciado: "O que um bundler faz com vários arquivos JavaScript?",
        alternativas: [
          { id: "a", texto: "Junta e otimiza eles pra rodar no navegador" },
          { id: "b", texto: "Apaga os que não são usados de vez" },
          { id: "c", texto: "Transforma eles em CSS" },
          { id: "d", texto: "Nada, cada um roda separado do outro" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p4",
        tipo: "alternativa",
        enunciado: "Pra que serve um teste automatizado?",
        alternativas: [
          { id: "a", texto: "Verificar se o código continua funcionando como esperado" },
          { id: "b", texto: "Deixar o site mais bonito" },
          { id: "c", texto: "Substituir o bundler" },
          { id: "d", texto: "Não serve pra nada em produção" },
        ],
        respostaCorretaId: "a",
      },
    ],
  },

  // ---------- Unidade 10: Projeto Final ----------
  // Fio condutor: montar uma lista de tarefas (to-do list) simples,
  // reaproveitando DOM/eventos (unidade 4), arrays de objetos (unidade 2) e
  // validação (unidade 8) — juntando a trilha inteira num projeto de verdade.

  u10_licao_1: {
    licaoId: "u10_licao_1",
    introducao: [
      {
        titulo: "Antes de programar",
        texto: "Planejar bem economiza tempo: definir o que o projeto faz, quais telas/funções ele precisa, antes de escrever a primeira linha.",
      },
      {
        titulo: "Quebrando em partes pequenas",
        texto: "Dividir o projeto em tarefas pequenas (ex: \"criar lista\", \"adicionar item\", \"marcar como feito\") deixa mais fácil de organizar o progresso.",
      },
      {
        titulo: "Nosso projeto",
        texto: "Ao longo dessa unidade, vamos planejar e montar uma lista de tarefas (to-do list) simples, juntando o que você aprendeu até aqui.",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "Por que planejar antes de programar?",
        alternativas: [
          { id: "a", texto: "Economiza tempo, definindo o que o projeto precisa antes de escrever código" },
          { id: "b", texto: "É uma perda de tempo" },
          { id: "c", texto: "Só é necessário em projetos gigantes" },
          { id: "d", texto: "Substitui a necessidade de testar" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "alternativa",
        enunciado: "Qual a vantagem de quebrar um projeto em tarefas pequenas?",
        alternativas: [
          { id: "a", texto: "Fica mais fácil de organizar e acompanhar o progresso" },
          { id: "b", texto: "O código fica mais lento" },
          { id: "c", texto: "Não tem vantagem real" },
          { id: "d", texto: "Deixa o projeto mais confuso" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "alternativa",
        enunciado: "Qual projeto vamos montar nessa unidade?",
        alternativas: [
          { id: "a", texto: "Uma lista de tarefas (to-do list) simples" },
          { id: "b", texto: "Um jogo 3D" },
          { id: "c", texto: "Um sistema operacional" },
          { id: "d", texto: "Um banco de dados do zero" },
        ],
        respostaCorretaId: "a",
      },
    ],
  },

  u10_licao_2: {
    licaoId: "u10_licao_2",
    introducao: [
      {
        titulo: "Os três pilares",
        texto: "HTML estrutura o conteúdo, CSS cuida do visual, e JavaScript dá comportamento e interatividade.",
      },
      {
        titulo: "Onde o JS entra",
        texto: "Pro to-do list, o HTML já tem um input e uma lista <ul> vazia; o JavaScript é quem vai criar os itens dinamicamente.",
        codigo: '<input id="novaTarefa" />\n<button id="adicionar">Adicionar</button>\n<ul id="lista"></ul>',
      },
      {
        titulo: "Selecionando os elementos",
        texto: "O primeiro passo em JS é sempre pegar referências dos elementos que vamos usar.",
        codigo: 'const input = document.querySelector("#novaTarefa")\nconst lista = document.querySelector("#lista")',
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "Qual a função do JavaScript nos três pilares de uma página (HTML/CSS/JS)?",
        alternativas: [
          { id: "a", texto: "Dar comportamento e interatividade" },
          { id: "b", texto: "Estruturar o conteúdo" },
          { id: "c", texto: "Cuidar só das cores" },
          { id: "d", texto: "Nenhuma, é sempre opcional" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "alternativa",
        enunciado: "Qual é o primeiro passo comum ao começar a programar interatividade numa página?",
        alternativas: [
          { id: "a", texto: "Selecionar (com querySelector) os elementos que vamos usar" },
          { id: "b", texto: "Apagar o HTML inteiro" },
          { id: "c", texto: "Criar um banco de dados" },
          { id: "d", texto: "Escrever CSS" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "completar",
        enunciado: "Complete pra selecionar o elemento com id \"lista\":",
        codigoAntes: "const lista = document.",
        codigoDepois: '("#lista")',
        blocos: ["querySelector", "createElement", "addEventListener", "value"],
        respostaCorreta: "querySelector",
      },
    ],
  },

  u10_licao_3: {
    licaoId: "u10_licao_3",
    introducao: [
      {
        titulo: "A regra do to-do list",
        texto: "Quando alguém clica em \"Adicionar\", pega o texto do input e cria um novo item na lista.",
        codigo: 'function adicionarTarefa(texto) {\n  if (texto.trim() === "") return\n  const item = document.createElement("li")\n  item.textContent = texto\n  lista.appendChild(item)\n}',
      },
      {
        titulo: "Validando antes de adicionar",
        texto: "O if no início evita adicionar uma tarefa vazia — a mesma ideia de validação que você viu na unidade de erros.",
      },
      {
        titulo: "Limpando o campo",
        texto: "Depois de adicionar, é comum limpar o input pra facilitar digitar a próxima tarefa.",
        codigo: 'input.value = ""',
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "logica",
        enunciado: "O que acontece quando esse código roda?",
        codigo: 'function adicionarTarefa(texto) {\n  if (texto.trim() === "") return\n  console.log("Adicionado:", texto)\n}\nadicionarTarefa("   ")',
        alternativas: [
          { id: "a", texto: "Nada é impresso, porque o texto fica vazio depois do trim" },
          { id: "b", texto: "Imprime \"Adicionado:   \"" },
          { id: "c", texto: "Dá erro" },
          { id: "d", texto: "Imprime undefined" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "alternativa",
        enunciado: "Por que validar o texto antes de criar o item da lista?",
        alternativas: [
          { id: "a", texto: "Pra evitar adicionar uma tarefa vazia" },
          { id: "b", texto: "Pra deixar o código mais lento" },
          { id: "c", texto: "Não tem motivo real" },
          { id: "d", texto: "É obrigatório pelo HTML" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "completar",
        enunciado: "Complete pra limpar o campo depois de adicionar a tarefa:",
        codigoAntes: "input.",
        codigoDepois: ' = ""',
        blocos: ["value", "textContent", "innerHTML", "length"],
        respostaCorreta: "value",
      },
    ],
  },

  u10_licao_4: {
    licaoId: "u10_licao_4",
    introducao: [
      {
        titulo: "Escutando o clique",
        texto: "O botão \"Adicionar\" precisa de um addEventListener pra chamar a função quando for clicado.",
        codigo: 'botaoAdicionar.addEventListener("click", () => {\n  adicionarTarefa(input.value)\n})',
      },
      {
        titulo: "Também funciona com Enter",
        texto: "Dá pra deixar o usuário apertar Enter no input em vez de clicar no botão, escutando o evento \"keydown\".",
        codigo: 'input.addEventListener("keydown", (event) => {\n  if (event.key === "Enter") adicionarTarefa(input.value)\n})',
      },
      {
        titulo: "Marcando como concluída",
        texto: "Com delegação de eventos na lista, um clique em qualquer item pode alternar uma classe \"concluida\".",
        codigo: 'lista.addEventListener("click", (event) => {\n  event.target.classList.toggle("concluida")\n})',
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "Qual evento detecta quando o usuário aperta uma tecla?",
        alternativas: [
          { id: "a", texto: "\"keydown\"" },
          { id: "b", texto: "\"click\"" },
          { id: "c", texto: "\"submit\"" },
          { id: "d", texto: "\"load\"" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "alternativa",
        enunciado: "Por que usar delegação de eventos (listener na lista, não em cada item) pra marcar tarefas como concluídas?",
        alternativas: [
          { id: "a", texto: "Porque novos itens são criados depois, e não teriam listener próprio se cada um precisasse do seu" },
          { id: "b", texto: "Porque é mais bonito" },
          { id: "c", texto: "Não tem vantagem, dá no mesmo" },
          { id: "d", texto: "Porque a lista não pode ter listener" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "completar",
        enunciado: "Complete pra alternar a classe \"concluida\" no item clicado:",
        codigoAntes: "event.target.classList.",
        codigoDepois: '("concluida")',
        blocos: ["toggle", "add", "remove", "value"],
        respostaCorreta: "toggle",
      },
    ],
  },

  u10_licao_5: {
    licaoId: "u10_licao_5",
    introducao: [
      {
        titulo: "Guardando as tarefas num array",
        texto: "Em vez de só mexer no HTML direto, é mais organizado guardar as tarefas num array de objetos.",
        codigo: 'const tarefas = [\n  { texto: "Estudar JS", feita: false },\n  { texto: "Fazer exercício", feita: true }\n]',
      },
      {
        titulo: "Renderizando a partir do array",
        texto: "Percorre o array com .forEach() e cria um item na tela pra cada tarefa.",
        codigo: 'tarefas.forEach((tarefa) => {\n  const item = document.createElement("li")\n  item.textContent = tarefa.texto\n  lista.appendChild(item)\n})',
      },
      {
        titulo: "Contando o progresso",
        texto: "Com .filter(), dá pra saber quantas tarefas já foram concluídas.",
        codigo: "const feitas = tarefas.filter((t) => t.feita).length",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "Por que guardar as tarefas num array de objetos, em vez de só no HTML?",
        alternativas: [
          { id: "a", texto: "Fica mais organizado guardar os dados separados da exibição" },
          { id: "b", texto: "É obrigatório pelo JavaScript" },
          { id: "c", texto: "Deixa o código mais lento" },
          { id: "d", texto: "Não tem vantagem real" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "logica",
        enunciado: "O que aparece no console quando esse código roda?",
        codigo: 'const tarefas = [\n  { texto: "Estudar JS", feita: false },\n  { texto: "Fazer exercício", feita: true }\n]\nconst feitas = tarefas.filter((t) => t.feita).length\nconsole.log(feitas)',
        alternativas: [
          { id: "a", texto: "0" },
          { id: "b", texto: "1" },
          { id: "c", texto: "2" },
          { id: "d", texto: "undefined" },
        ],
        respostaCorretaId: "b",
      },
      {
        id: "p3",
        tipo: "completar",
        enunciado: "Complete pra criar um item pra cada tarefa do array:",
        codigoAntes: "tarefas.",
        codigoDepois: "((tarefa) => { /* criar item */ })",
        blocos: ["forEach", "filter", "length", "find"],
        respostaCorreta: "forEach",
      },
    ],
  },

  u10_licao_6: {
    licaoId: "u10_licao_6",
    introducao: [
      {
        titulo: "Feedback visual",
        texto: "Dar um retorno visual (mudar cor, riscar texto) quando uma tarefa é concluída ajuda bastante a experiência.",
        codigo: ".concluida {\n  text-decoration: line-through;\n  opacity: 0.6;\n}",
      },
      {
        titulo: "Tratando casos extremos",
        texto: "O que acontece se a lista estiver vazia? Vale mostrar uma mensagem tipo \"Nenhuma tarefa ainda\".",
      },
      {
        titulo: "Revisando nomes e organização",
        texto: "Antes de considerar pronto, vale reler o código e aplicar as boas práticas que você já viu: nomes claros, funções pequenas, sem repetição.",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "Por que dar um feedback visual quando uma tarefa é concluída?",
        alternativas: [
          { id: "a", texto: "Ajuda bastante a experiência de quem usa" },
          { id: "b", texto: "É obrigatório pelo HTML" },
          { id: "c", texto: "Deixa o CSS mais lento" },
          { id: "d", texto: "Não tem nenhum efeito real" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "alternativa",
        enunciado: "O que vale a pena mostrar quando a lista de tarefas está vazia?",
        alternativas: [
          { id: "a", texto: "Uma mensagem tipo \"Nenhuma tarefa ainda\"" },
          { id: "b", texto: "Um erro no console" },
          { id: "c", texto: "Nada, deixar em branco é o ideal" },
          { id: "d", texto: "Recarregar a página sozinha" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p3",
        tipo: "alternativa",
        enunciado: "Quais boas práticas vale revisar antes de considerar o projeto pronto?",
        alternativas: [
          { id: "a", texto: "Nomes claros, funções pequenas, sem repetição" },
          { id: "b", texto: "Deixar tudo numa função só, gigante" },
          { id: "c", texto: "Usar nomes de variável de uma letra só" },
          { id: "d", texto: "Não revisar nada" },
        ],
        respostaCorretaId: "a",
      },
    ],
  },

  u10_licao_7: {
    licaoId: "u10_licao_7",
    introducao: [
      {
        titulo: "Testando manualmente",
        texto: "Antes de considerar pronto, testa cada fluxo: adicionar tarefa vazia, adicionar tarefa normal, marcar como concluída, apertar Enter.",
      },
      {
        titulo: "Casos que costumam quebrar",
        texto: "Texto só com espaços, clicar muito rápido várias vezes, lista vazia — são os primeiros lugares pra testar.",
      },
      {
        titulo: "Um teste automatizado da lógica",
        texto: "A função que decide se adiciona ou não (a validação) pode ser testada isolada, sem precisar da tela.",
        codigo: 'function podeAdicionar(texto) {\n  return texto.trim() !== ""\n}\nconsole.log(podeAdicionar("   ") === false)\n// true = passou',
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "Por que testar o caso de uma tarefa só com espaços?",
        alternativas: [
          { id: "a", texto: "Porque é um caso que costuma escapar da validação, se não for pensado" },
          { id: "b", texto: "Não faz diferença nenhuma" },
          { id: "c", texto: "Só existe esse caso de teste possível" },
          { id: "d", texto: "Porque espaços sempre quebram o JavaScript" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "logica",
        enunciado: "O que aparece no console quando esse código roda?",
        codigo: 'function podeAdicionar(texto) {\n  return texto.trim() !== ""\n}\nconsole.log(podeAdicionar("   "))',
        alternativas: [
          { id: "a", texto: "true" },
          { id: "b", texto: "false" },
          { id: "c", texto: "\"   \"" },
          { id: "d", texto: "undefined" },
        ],
        respostaCorretaId: "b",
      },
      {
        id: "p3",
        tipo: "alternativa",
        enunciado: "Qual a vantagem de testar a lógica de validação separada da tela?",
        alternativas: [
          { id: "a", texto: "Dá pra testar ela isolada, sem precisar simular clique na interface" },
          { id: "b", texto: "Não tem vantagem nenhuma" },
          { id: "c", texto: "É obrigatório pelo JavaScript" },
          { id: "d", texto: "Deixa o teste mais lento" },
        ],
        respostaCorretaId: "a",
      },
    ],
  },

  u10_licao_8: {
    licaoId: "u10_licao_8",
    introducao: [
      {
        titulo: "Você chegou até o fim da trilha!",
        texto:
          "Foi desde o básico (variáveis, tipos, condicionais) até assuntos avançados (closures, assincronia, classes, módulos) — e usou tudo isso pra montar um projeto de verdade.",
      },
      {
        titulo: "O que vem depois",
        texto: "O próximo passo natural é criar seus próprios projetos, consultando documentação e praticando sempre que travar — é assim que todo mundo continua aprendendo.",
      },
      {
        titulo: "Revisão final",
        texto: "Essa última atividade junta conceitos de várias unidades diferentes, do começo ao fim da trilha.",
      },
    ],
    perguntas: [
      {
        id: "p1",
        tipo: "alternativa",
        enunciado: "Qual a ordem certa pra validar e depois criar um item na lista de tarefas?",
        alternativas: [
          { id: "a", texto: "Primeiro validar o texto, depois criar e adicionar o item" },
          { id: "b", texto: "Primeiro criar o item, validar depois" },
          { id: "c", texto: "Não precisa validar nada" },
          { id: "d", texto: "Validar substitui criar o item" },
        ],
        respostaCorretaId: "a",
      },
      {
        id: "p2",
        tipo: "logica",
        enunciado: "O que aparece no console quando esse código roda?",
        codigo: 'const tarefas = [{ texto: "A", feita: true }, { texto: "B", feita: false }]\nconsole.log(tarefas.filter(t => t.feita).length)',
        alternativas: [
          { id: "a", texto: "0" },
          { id: "b", texto: "1" },
          { id: "c", texto: "2" },
          { id: "d", texto: "undefined" },
        ],
        respostaCorretaId: "b",
      },
      {
        id: "p3",
        tipo: "completar",
        enunciado: "Complete pra escutar o clique no botão de adicionar:",
        codigoAntes: "botao.",
        codigoDepois: '("click", aoClicar)',
        blocos: ["addEventListener", "createElement", "querySelector", "classList"],
        respostaCorreta: "addEventListener",
      },
      {
        id: "p4",
        tipo: "codigo",
        selo: { tipo: "dificil", texto: "Escreva o código" },
        enunciado:
          'Escreva uma função podeAdicionar(texto) que devolve true só se texto.trim() não for vazio, e imprima podeAdicionar("Estudar").',
        codigoInicial: "",
        resultadoEsperado: "true",
        dica: 'function podeAdicionar(texto) {\n  return texto.trim() !== ""\n}\nconsole.log(podeAdicionar("Estudar"))',
      },
    ],
  },
};

/**
 * Id fixo da única lição semeada de verdade no backend (prisma/seed.ts, que
 * cria com `id: 'seed-lesson-js-1'` via upsert — não é uuid gerado, então dá
 * pra referenciar esse id direto no front). Ela se chama "Variáveis e
 * Tipos" e testa `const`, o mesmo assunto de u1_licao_2 — é por isso que
 * u1_licao_2 (ID_LICAO_CONECTADA, em hooks/use-jornada.ts) é o slot da
 * trilha que fala com o backend de verdade: usado só nas chamadas de API
 * (POST /lessons/:id/complete), nunca como id de rota ou chave de conteúdo.
 */
export const LICAO_REAL_VARIAVEIS_ID = "seed-lesson-js-1";
