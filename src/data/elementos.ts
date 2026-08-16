export interface ElementoGlossario {
  id: string;
  /** O símbolo/palavra-chave em si — ex: "//", "console.log()". */
  termo: string;
  /** Rótulo curto embaixo do termo, no card. */
  apelido: string;
  significado: string;
  exemplo: string;
}

export interface CategoriaElementos {
  titulo: string;
  itens: ElementoGlossario[];
}

/**
 * Glossário pra rever o que já foi ensinado — só entra aqui o que apareceu
 * de verdade numa introdução de lição (ver data/atividades.ts). Conforme
 * novas lições ganharem conteúdo, essa lista cresce junto.
 */
export const categoriasElementos: CategoriaElementos[] = [
  {
    titulo: "Fundamentos do JavaScript",
    itens: [
      {
        id: "comentario",
        termo: "//",
        apelido: "Comentário",
        significado:
          "Comenta uma linha inteira — o computador ignora tudo que vem depois das barras até o fim da linha. Serve só pra explicar o código pra quem lê.",
        exemplo: '// Isso é um comentário\nconsole.log("Isso roda normalmente")',
      },
      {
        id: "console-log",
        termo: "console.log()",
        apelido: "Mostrar valor",
        significado:
          "Mostra um valor no console enquanto o código roda — o jeito mais comum de ver o que o código está fazendo por dentro.",
        exemplo: 'console.log("Olá, mundo!")',
      },
      {
        id: "let",
        termo: "let",
        apelido: "Variável",
        significado: "Declara uma variável que pode mudar de valor depois — a opção mais comum pra coisas que vão variar ao longo do código.",
        exemplo: "let idade = 25\nidade = 26",
      },
      {
        id: "const",
        termo: "const",
        apelido: "Variável fixa",
        significado: "Declara uma variável que não pode ser reatribuída depois — tentar mudar o valor de uma const dá erro.",
        exemplo: 'const nome = "Ana"\n// nome = "Bia"  →  erro',
      },
      {
        id: "typeof",
        termo: "typeof",
        apelido: "Tipo do valor",
        significado: "Operador que devolve o tipo de um valor, como texto — serve pra descobrir com o que você está lidando.",
        exemplo: 'console.log(typeof "oi") // "string"',
      },
      {
        id: "comparacao-estrita",
        termo: "===",
        apelido: "Comparação estrita",
        significado: "Compara o valor e o tipo ao mesmo tempo — mais seguro que ==, que às vezes considera coisas de tipos diferentes como iguais.",
        exemplo: '5 === "5"  // false\n5 === 5    // true',
      },
      {
        id: "else",
        termo: "else",
        apelido: "Senão",
        significado: "Roda quando a condição do if é falsa — é o \"caso contrário\" de um if.",
        exemplo: 'if (idade >= 18) {\n  console.log("Maior")\n} else {\n  console.log("Menor")\n}',
      },
      {
        id: "for",
        termo: "for",
        apelido: "Repetir N vezes",
        significado: "Repete um bloco de código um número definido de vezes — usado quando você já sabe quantas voltas quer dar.",
        exemplo: "for (let i = 0; i < 3; i++) {\n  console.log(i)\n}",
      },
      {
        id: "while",
        termo: "while",
        apelido: "Repetir até",
        significado: "Repete um bloco enquanto uma condição continuar verdadeira — usado quando você não sabe de antemão quantas voltas vai precisar.",
        exemplo: "let x = 0\nwhile (x < 3) {\n  x++\n}",
      },
      {
        id: "function",
        termo: "function",
        apelido: "Função",
        significado: "Declara um bloco de código com nome que pode ser reaproveitado, chamando esse nome sempre que precisar.",
        exemplo: 'function saudacao() {\n  console.log("Oi!")\n}\nsaudacao()',
      },
      {
        id: "return",
        termo: "return",
        apelido: "Devolver valor",
        significado: "Devolve um valor de dentro de uma função pra quem chamou ela, em vez de só imprimir algo.",
        exemplo: "function somar(a, b) {\n  return a + b\n}",
      },
    ],
  },
];
