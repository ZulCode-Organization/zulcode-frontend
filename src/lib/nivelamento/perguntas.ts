export interface AlternativaNivelamento {
  id: string;
  texto: string;
}

export interface PerguntaNivelamento {
  id: string;
  enunciado: string;
  alternativas: AlternativaNivelamento[];
  corretaId: string;
}

/**
 * Banco de perguntas do teste de nivelamento — 5 por linguagem, cobrindo do
 * básico ao um pouco mais avançado, pra dar alguma variação de dificuldade
 * na medição. Os slugs batem com os de `prisma/seed.ts` (javascript, python,
 * typescript, java, csharp, go). Sem endpoint/model no backend pra isso
 * ainda — ver src/lib/nivelamento-local.ts para onde o resultado é salvo.
 */
export const PERGUNTAS_NIVELAMENTO: Record<string, PerguntaNivelamento[]> = {
  javascript: [
    {
      id: "js_1",
      enunciado: "Qual é a forma certa de declarar uma constante em JavaScript?",
      alternativas: [
        { id: "a", texto: "let const x = 5" },
        { id: "b", texto: "const x = 5" },
        { id: "c", texto: "constant x = 5" },
        { id: "d", texto: "fixed x = 5" },
      ],
      corretaId: "b",
    },
    {
      id: "js_2",
      enunciado: "O que o método .map() faz num array?",
      alternativas: [
        { id: "a", texto: "Remove itens do array" },
        { id: "b", texto: "Ordena o array" },
        { id: "c", texto: "Cria um novo array aplicando uma função a cada item" },
        { id: "d", texto: "Soma todos os itens do array" },
      ],
      corretaId: "c",
    },
    {
      id: "js_3",
      enunciado: 'O que aparece no console ao rodar console.log(typeof null)?',
      alternativas: [
        { id: "a", texto: '"null"' },
        { id: "b", texto: '"undefined"' },
        { id: "c", texto: '"number"' },
        { id: "d", texto: '"object"' },
      ],
      corretaId: "d",
    },
    {
      id: "js_4",
      enunciado: "Qual é a diferença entre == e === em JavaScript?",
      alternativas: [
        { id: "a", texto: "Não tem diferença nenhuma" },
        { id: "b", texto: "=== compara valor e tipo; == só compara valor, convertendo tipos" },
        { id: "c", texto: "== é mais rápido de executar" },
        { id: "d", texto: "=== só funciona com números" },
      ],
      corretaId: "b",
    },
    {
      id: "js_5",
      enunciado: "O que uma Promise representa em JavaScript?",
      alternativas: [
        { id: "a", texto: "Um tipo de array especial" },
        { id: "b", texto: "Uma função que sempre roda de forma síncrona" },
        { id: "c", texto: "Um objeto de erro" },
        { id: "d", texto: "Um valor que pode estar disponível agora, no futuro, ou nunca" },
      ],
      corretaId: "d",
    },
  ],

  python: [
    {
      id: "py_1",
      enunciado: "Como se define uma função em Python?",
      alternativas: [
        { id: "a", texto: "function minhaFuncao():" },
        { id: "b", texto: "def minha_funcao():" },
        { id: "c", texto: "func minha_funcao()" },
        { id: "d", texto: "void minhaFuncao()" },
      ],
      corretaId: "b",
    },
    {
      id: "py_2",
      enunciado: "Qual estrutura o Python usa pra indicar blocos de código, em vez de chaves { }?",
      alternativas: [
        { id: "a", texto: "Ponto e vírgula" },
        { id: "b", texto: "Parênteses" },
        { id: "c", texto: "Indentação (espaços)" },
        { id: "d", texto: "Colchetes" },
      ],
      corretaId: "c",
    },
    {
      id: "py_3",
      enunciado: "O que lista.append(x) faz?",
      alternativas: [
        { id: "a", texto: "Adiciona x no final da lista" },
        { id: "b", texto: "Remove x da lista" },
        { id: "c", texto: "Ordena a lista inteira" },
        { id: "d", texto: "Conta quantas vezes x aparece" },
      ],
      corretaId: "a",
    },
    {
      id: "py_4",
      enunciado: "O que é uma list comprehension em Python?",
      alternativas: [
        { id: "a", texto: "Uma função nativa pra ordenar listas" },
        { id: "b", texto: "Um tipo de dicionário" },
        { id: "c", texto: "Um erro comum de sintaxe" },
        { id: "d", texto: "Um jeito curto de criar uma lista a partir de um loop, numa linha só" },
      ],
      corretaId: "d",
    },
    {
      id: "py_5",
      enunciado: "Qual biblioteca é a escolha mais comum pra fazer requisições HTTP em Python?",
      alternativas: [
        { id: "a", texto: "http-client" },
        { id: "b", texto: "requests" },
        { id: "c", texto: "fetch" },
        { id: "d", texto: "urllib-simple" },
      ],
      corretaId: "b",
    },
  ],

  typescript: [
    {
      id: "ts_1",
      enunciado: "Qual a principal diferença entre TypeScript e JavaScript?",
      alternativas: [
        { id: "a", texto: "TypeScript roda só no servidor" },
        { id: "b", texto: "TypeScript não usa funções" },
        { id: "c", texto: "São linguagens sem nenhuma relação" },
        { id: "d", texto: "TypeScript adiciona tipagem estática ao JavaScript" },
      ],
      corretaId: "d",
    },
    {
      id: "ts_2",
      enunciado: "Como se declara uma variável do tipo string em TypeScript?",
      alternativas: [
        { id: "a", texto: 'let nome = string("Ana")' },
        { id: "b", texto: 'let nome: string = "Ana"' },
        { id: "c", texto: 'string nome = "Ana"' },
        { id: "d", texto: 'let nome<string> = "Ana"' },
      ],
      corretaId: "b",
    },
    {
      id: "ts_3",
      enunciado: "O que uma interface faz em TypeScript?",
      alternativas: [
        { id: "a", texto: "Executa código em tempo real" },
        { id: "b", texto: "Substitui variáveis" },
        { id: "c", texto: "Define o formato (shape) que um objeto deve ter" },
        { id: "d", texto: "Cria um array" },
      ],
      corretaId: "c",
    },
    {
      id: "ts_4",
      enunciado: 'O que o tipo "any" significa em TypeScript?',
      alternativas: [
        { id: "a", texto: "Indica que o valor é sempre nulo" },
        { id: "b", texto: "É um tipo numérico especial" },
        { id: "c", texto: "Só existe em arrays" },
        { id: "d", texto: "Desativa a checagem de tipo pra aquele valor" },
      ],
      corretaId: "d",
    },
    {
      id: "ts_5",
      enunciado: "Antes de rodar num navegador, código TypeScript precisa ser...",
      alternativas: [
        { id: "a", texto: "Compilado (transpilado) para JavaScript" },
        { id: "b", texto: "Executado direto, sem nenhum passo extra" },
        { id: "c", texto: "Convertido para HTML" },
        { id: "d", texto: "Ele nunca funciona no navegador" },
      ],
      corretaId: "a",
    },
  ],

  java: [
    {
      id: "java_1",
      enunciado: "Toda aplicação Java precisa de um método especial pra começar a rodar. Qual é ele?",
      alternativas: [
        { id: "a", texto: "void start()" },
        { id: "b", texto: "def main()" },
        { id: "c", texto: "public static void main(String[] args)" },
        { id: "d", texto: "function main()" },
      ],
      corretaId: "c",
    },
    {
      id: "java_2",
      enunciado: 'O que a palavra-chave "class" define em Java?',
      alternativas: [
        { id: "a", texto: "Uma variável global" },
        { id: "b", texto: "Um molde (blueprint) pra criar objetos" },
        { id: "c", texto: "Um comentário" },
        { id: "d", texto: "Um tipo de laço" },
      ],
      corretaId: "b",
    },
    {
      id: "java_3",
      enunciado: "Java é uma linguagem...",
      alternativas: [
        { id: "a", texto: "Sem tipos e funcional pura" },
        { id: "b", texto: "Só usada em scripts pequenos" },
        { id: "c", texto: "Interpretada linha por linha, sem compilação" },
        { id: "d", texto: "Fortemente tipada e orientada a objetos" },
      ],
      corretaId: "d",
    },
    {
      id: "java_4",
      enunciado: "O que \"public\", \"private\" e \"protected\" controlam numa classe Java?",
      alternativas: [
        { id: "a", texto: "A cor do texto no editor" },
        { id: "b", texto: "O nível de acesso (visibilidade) de atributos e métodos" },
        { id: "c", texto: "A velocidade de execução" },
        { id: "d", texto: "O tipo de dado" },
      ],
      corretaId: "b",
    },
    {
      id: "java_5",
      enunciado: "O que significa herança (extends) em Java?",
      alternativas: [
        { id: "a", texto: "Uma classe apaga outra" },
        { id: "b", texto: "Duas classes com o mesmo nome" },
        { id: "c", texto: "Um jeito de importar bibliotecas" },
        { id: "d", texto: "Uma classe reaproveita atributos e métodos de outra classe" },
      ],
      corretaId: "d",
    },
  ],

  csharp: [
    {
      id: "cs_1",
      enunciado: "Qual empresa criou o C#?",
      alternativas: [
        { id: "a", texto: "Google" },
        { id: "b", texto: "Oracle" },
        { id: "c", texto: "Microsoft" },
        { id: "d", texto: "Apple" },
      ],
      corretaId: "c",
    },
    {
      id: "cs_2",
      enunciado: "Como se declara uma variável do tipo inteiro em C#?",
      alternativas: [
        { id: "a", texto: "integer idade = 25" },
        { id: "b", texto: "int idade = 25;" },
        { id: "c", texto: "var int idade = 25" },
        { id: "d", texto: "idade: int = 25" },
      ],
      corretaId: "b",
    },
    {
      id: "cs_3",
      enunciado: "O que o .NET representa no ecossistema C#?",
      alternativas: [
        { id: "a", texto: "Um tipo de banco de dados" },
        { id: "b", texto: "Um editor de código" },
        { id: "c", texto: "Uma linguagem concorrente ao C#" },
        { id: "d", texto: "A plataforma/framework onde aplicações C# rodam" },
      ],
      corretaId: "d",
    },
    {
      id: "cs_4",
      enunciado: "Toda instrução em C# termina com qual símbolo?",
      alternativas: [
        { id: "a", texto: "Dois pontos (:)" },
        { id: "b", texto: "Vírgula (,)" },
        { id: "c", texto: "Ponto e vírgula (;)" },
        { id: "d", texto: "Nenhum símbolo" },
      ],
      corretaId: "c",
    },
    {
      id: "cs_5",
      enunciado: 'O que "namespace" organiza em um projeto C#?',
      alternativas: [
        { id: "a", texto: "Define o tipo de uma variável" },
        { id: "b", texto: "Agrupa classes relacionadas, evitando conflito de nomes" },
        { id: "c", texto: "Controla a velocidade do programa" },
        { id: "d", texto: "É só um comentário especial" },
      ],
      corretaId: "b",
    },
  ],

  go: [
    {
      id: "go_1",
      enunciado: "Qual empresa criou a linguagem Go?",
      alternativas: [
        { id: "a", texto: "Microsoft" },
        { id: "b", texto: "Google" },
        { id: "c", texto: "Amazon" },
        { id: "d", texto: "Meta" },
      ],
      corretaId: "b",
    },
    {
      id: "go_2",
      enunciado: "Como se declara uma variável em Go usando a sintaxe curta?",
      alternativas: [
        { id: "a", texto: 'var nome = "Ana";' },
        { id: "b", texto: 'let nome = "Ana"' },
        { id: "c", texto: 'nome := "Ana"' },
        { id: "d", texto: 'nome = string("Ana")' },
      ],
      corretaId: "c",
    },
    {
      id: "go_3",
      enunciado: "O que uma goroutine representa em Go?",
      alternativas: [
        { id: "a", texto: "Um tipo de array" },
        { id: "b", texto: "Um comentário especial" },
        { id: "c", texto: "Um erro de compilação" },
        { id: "d", texto: "Uma função que roda de forma concorrente, de um jeito leve" },
      ],
      corretaId: "d",
    },
    {
      id: "go_4",
      enunciado: "Go é conhecida principalmente por ser...",
      alternativas: [
        { id: "a", texto: "Só usada pra páginas web estáticas" },
        { id: "b", texto: "Uma linguagem sem tipos" },
        { id: "c", texto: "Simples, rápida de compilar e boa pra sistemas concorrentes" },
        { id: "d", texto: "Interpretada, sem compilação" },
      ],
      corretaId: "c",
    },
    {
      id: "go_5",
      enunciado: "Qual comando roda um arquivo Go diretamente?",
      alternativas: [
        { id: "a", texto: "go start arquivo.go" },
        { id: "b", texto: "go execute arquivo.go" },
        { id: "c", texto: "run go arquivo.go" },
        { id: "d", texto: "go run arquivo.go" },
      ],
      corretaId: "d",
    },
  ],
};

export function obterPerguntasNivelamento(languageSlug: string): PerguntaNivelamento[] {
  return PERGUNTAS_NIVELAMENTO[languageSlug] ?? [];
}
