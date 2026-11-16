export interface AlternativaNivelamento {
  id: string;
  texto: string;
}

export interface PerguntaNivelamento {
  id: string;
  enunciado: string;
  /** Um trecho de código para a pergunta, quando ela é "o que isto mostra?". */
  codigo?: string;
  alternativas: AlternativaNivelamento[];
  corretaId: string;
}

/**
 * Banco do teste de nivelamento: uma pergunta por unidade da trilha, na mesma
 * ordem das unidades (src/conteudo/cursos no backend). Quem acerta as N
 * primeiras seguidas começa na unidade N+1 — por isso cada pergunta cobra só o
 * que a sua unidade ensina, nada de fora da trilha.
 *
 * Se uma trilha mudar de unidades, este banco muda junto.
 */
export const PERGUNTAS_NIVELAMENTO: Record<string, PerguntaNivelamento[]> = {
  python: [
    {
      id: "py_1",
      enunciado: "O que este código mostra?",
      codigo: 'nome = "Zul"\nprint(f"Oi, {nome}!")',
      alternativas: [
        { id: "a", texto: "Oi, {nome}!" },
        { id: "b", texto: "Oi, Zul!" },
        { id: "c", texto: 'Oi, "Zul"!' },
        { id: "d", texto: "Dá erro" },
      ],
      corretaId: "b",
    },
    {
      id: "py_2",
      enunciado: "O que este código mostra?",
      codigo: "def dobro(n):\n    return n * 2\n\nprint(dobro(4))",
      alternativas: [
        { id: "a", texto: "8" },
        { id: "b", texto: "4" },
        { id: "c", texto: "n * 2" },
        { id: "d", texto: "None" },
      ],
      corretaId: "a",
    },
    {
      id: "py_3",
      enunciado: "O que este código mostra?",
      codigo: 'nota = 6\nif nota >= 7:\n    print("aprovado")\nelif nota >= 5:\n    print("recuperação")\nelse:\n    print("reprovado")',
      alternativas: [
        { id: "a", texto: "aprovado" },
        { id: "b", texto: "reprovado" },
        { id: "c", texto: "recuperação" },
        { id: "d", texto: "aprovado e recuperação" },
      ],
      corretaId: "c",
    },
    {
      id: "py_4",
      enunciado: "O que este código mostra?",
      codigo: "total = 0\nfor n in [1, 2, 3]:\n    total += n\nprint(total)",
      alternativas: [
        { id: "a", texto: "3" },
        { id: "b", texto: "[1, 2, 3]" },
        { id: "c", texto: "123" },
        { id: "d", texto: "6" },
      ],
      corretaId: "d",
    },
    {
      id: "py_5",
      enunciado: "O que este código mostra?",
      codigo: 'aluno = {"nome": "Ana", "nota": 9}\nprint(aluno["nota"])',
      alternativas: [
        { id: "a", texto: "nota" },
        { id: "b", texto: "9" },
        { id: "c", texto: "Ana" },
        { id: "d", texto: '{"nota": 9}' },
      ],
      corretaId: "b",
    },
    {
      id: "py_6",
      enunciado: "O que este código mostra?",
      codigo: "numeros = [1, 2, 3, 4]\npares = [n * 10 for n in numeros if n % 2 == 0]\nprint(pares)",
      alternativas: [
        { id: "a", texto: "[10, 30]" },
        { id: "b", texto: "[2, 4]" },
        { id: "c", texto: "[20, 40]" },
        { id: "d", texto: "[10, 20, 30, 40]" },
      ],
      corretaId: "c",
    },
  ],

  javascript: [
    {
      id: "js_1",
      enunciado: "O que este código mostra?",
      codigo: 'const nome = "Zul";\nconsole.log(`Oi, ${nome}!`);',
      alternativas: [
        { id: "a", texto: "Oi, Zul!" },
        { id: "b", texto: "Oi, ${nome}!" },
        { id: "c", texto: "Oi, nome!" },
        { id: "d", texto: "Dá erro" },
      ],
      corretaId: "a",
    },
    {
      id: "js_2",
      enunciado: "O que este código mostra?",
      codigo: "const dobro = (n) => n * 2;\nconsole.log(dobro(4));",
      alternativas: [
        { id: "a", texto: "4" },
        { id: "b", texto: "undefined" },
        { id: "c", texto: "8" },
        { id: "d", texto: "n * 2" },
      ],
      corretaId: "c",
    },
    {
      id: "js_3",
      enunciado: "O que este código mostra?",
      codigo: 'const idade = 15;\nif (idade >= 18) {\n  console.log("pode votar");\n} else {\n  console.log("ainda não");\n}',
      alternativas: [
        { id: "a", texto: "pode votar" },
        { id: "b", texto: "ainda não" },
        { id: "c", texto: "As duas frases" },
        { id: "d", texto: "Nada" },
      ],
      corretaId: "b",
    },
    {
      id: "js_4",
      enunciado: "O que este código mostra?",
      codigo: "let total = 0;\nfor (const n of [1, 2, 3]) {\n  total += n;\n}\nconsole.log(total);",
      alternativas: [
        { id: "a", texto: "123" },
        { id: "b", texto: "3" },
        { id: "c", texto: "[1, 2, 3]" },
        { id: "d", texto: "6" },
      ],
      corretaId: "d",
    },
    {
      id: "js_5",
      enunciado: "O que este código mostra?",
      codigo: 'const aluno = { nome: "Ana", nota: 9 };\nconsole.log(aluno.nota);',
      alternativas: [
        { id: "a", texto: "9" },
        { id: "b", texto: "nota" },
        { id: "c", texto: "Ana" },
        { id: "d", texto: "undefined" },
      ],
      corretaId: "a",
    },
    {
      id: "js_6",
      enunciado: "O que este código mostra?",
      codigo: "const numeros = [1, 2, 3, 4];\nconst pares = numeros.filter((n) => n % 2 === 0).map((n) => n * 10);\nconsole.log(pares);",
      alternativas: [
        { id: "a", texto: "[10, 30]" },
        { id: "b", texto: "[20, 40]" },
        { id: "c", texto: "[2, 4]" },
        { id: "d", texto: "[10, 20, 30, 40]" },
      ],
      corretaId: "b",
    },
  ],

  typescript: [
    {
      id: "ts_1",
      enunciado: "Qual linha o TypeScript acusa como erro?",
      codigo: 'let idade: number = 15;\nidade = 16;\nidade = "dezesseis";',
      alternativas: [
        { id: "a", texto: "A linha 1" },
        { id: "b", texto: "A linha 2" },
        { id: "c", texto: "A linha 3" },
        { id: "d", texto: "Nenhuma" },
      ],
      corretaId: "c",
    },
    {
      id: "ts_2",
      enunciado: "O que o `: number` depois dos parênteses diz?",
      codigo: "function dobro(n: number): number {\n  return n * 2;\n}",
      alternativas: [
        { id: "a", texto: "Que a função devolve um número" },
        { id: "b", texto: "Que o parâmetro é opcional" },
        { id: "c", texto: "Que a função não devolve nada" },
        { id: "d", texto: "Que n vale 2" },
      ],
      corretaId: "a",
    },
    {
      id: "ts_3",
      enunciado: "Quais valores cabem nesta variável?",
      codigo: "let id: string | number;",
      alternativas: [
        { id: "a", texto: "Só textos" },
        { id: "b", texto: "Só números" },
        { id: "c", texto: "Um texto e um número ao mesmo tempo" },
        { id: "d", texto: "Um texto ou um número" },
      ],
      corretaId: "d",
    },
    {
      id: "ts_4",
      enunciado: "Este objeto é aceito pelo tipo Aluno?",
      codigo: 'interface Aluno {\n  nome: string;\n  apelido?: string;\n}\n\nconst a: Aluno = { nome: "Ana" };',
      alternativas: [
        { id: "a", texto: "Não, falta o apelido" },
        { id: "b", texto: "Sim, o apelido é opcional" },
        { id: "c", texto: "Não, interface não pode ter ?" },
        { id: "d", texto: "Só se apelido for null" },
      ],
      corretaId: "b",
    },
    {
      id: "ts_5",
      enunciado: "Dentro do if, qual é o tipo de valor?",
      codigo: 'function tamanho(valor: string | number) {\n  if (typeof valor === "string") {\n    return valor.length;\n  }\n  return valor;\n}',
      alternativas: [
        { id: "a", texto: "string | number" },
        { id: "b", texto: "number" },
        { id: "c", texto: "string" },
        { id: "d", texto: "any" },
      ],
      corretaId: "c",
    },
    {
      id: "ts_6",
      enunciado: "Qual é o tipo de x?",
      codigo: "function primeiro<T>(lista: T[]): T {\n  return lista[0];\n}\n\nconst x = primeiro([10, 20, 30]);",
      alternativas: [
        { id: "a", texto: "number" },
        { id: "b", texto: "T" },
        { id: "c", texto: "number[]" },
        { id: "d", texto: "any" },
      ],
      corretaId: "a",
    },
  ],

  java: [
    {
      id: "java_1",
      enunciado: "O que este código mostra?",
      codigo: "int a = 7;\nint b = 2;\nSystem.out.println(a / b);",
      alternativas: [
        { id: "a", texto: "3.5" },
        { id: "b", texto: "3" },
        { id: "c", texto: "4" },
        { id: "d", texto: "Dá erro" },
      ],
      corretaId: "b",
    },
    {
      id: "java_2",
      enunciado: "O que este código mostra?",
      codigo: 'int nota = 6;\nif (nota >= 7) {\n  System.out.println("aprovado");\n} else if (nota >= 5) {\n  System.out.println("recuperação");\n} else {\n  System.out.println("reprovado");\n}',
      alternativas: [
        { id: "a", texto: "aprovado" },
        { id: "b", texto: "reprovado" },
        { id: "c", texto: "aprovado e recuperação" },
        { id: "d", texto: "recuperação" },
      ],
      corretaId: "d",
    },
    {
      id: "java_3",
      enunciado: "O que este código mostra?",
      codigo: "int[] numeros = {1, 2, 3};\nint total = 0;\nfor (int n : numeros) {\n  total += n;\n}\nSystem.out.println(total);",
      alternativas: [
        { id: "a", texto: "6" },
        { id: "b", texto: "3" },
        { id: "c", texto: "123" },
        { id: "d", texto: "[1, 2, 3]" },
      ],
      corretaId: "a",
    },
    {
      id: "java_4",
      enunciado: "O que este código mostra?",
      codigo: "static int dobro(int n) {\n  return n * 2;\n}\n\n// dentro do main:\nSystem.out.println(dobro(4));",
      alternativas: [
        { id: "a", texto: "4" },
        { id: "b", texto: "n * 2" },
        { id: "c", texto: "8" },
        { id: "d", texto: "Nada, o método é void" },
      ],
      corretaId: "c",
    },
    {
      id: "java_5",
      enunciado: "Para que serve o método Aluno(String nome) aqui?",
      codigo: "class Aluno {\n  private String nome;\n\n  Aluno(String nome) {\n    this.nome = nome;\n  }\n}",
      alternativas: [
        { id: "a", texto: "É o construtor: roda ao criar um Aluno com new" },
        { id: "b", texto: "Devolve o nome do aluno" },
        { id: "c", texto: "Apaga o aluno" },
        { id: "d", texto: "Torna o nome público" },
      ],
      corretaId: "a",
    },
    {
      id: "java_6",
      enunciado: "O que este código mostra?",
      codigo: 'HashMap<String, Integer> notas = new HashMap<>();\nnotas.put("Ana", 9);\nnotas.put("Bia", 7);\nSystem.out.println(notas.get("Bia"));',
      alternativas: [
        { id: "a", texto: "Bia" },
        { id: "b", texto: "9" },
        { id: "c", texto: "2" },
        { id: "d", texto: "7" },
      ],
      corretaId: "d",
    },
  ],

  csharp: [
    {
      id: "cs_1",
      enunciado: "O que este código mostra?",
      codigo: 'string nome = "Zul";\nConsole.WriteLine($"Oi, {nome}!");',
      alternativas: [
        { id: "a", texto: "Oi, {nome}!" },
        { id: "b", texto: "Oi, $nome!" },
        { id: "c", texto: "Oi, Zul!" },
        { id: "d", texto: "Dá erro" },
      ],
      corretaId: "c",
    },
    {
      id: "cs_2",
      enunciado: "O que este código mostra?",
      codigo: 'string? apelido = null;\nConsole.WriteLine(apelido ?? "sem apelido");',
      alternativas: [
        { id: "a", texto: "sem apelido" },
        { id: "b", texto: "null" },
        { id: "c", texto: "Uma linha vazia" },
        { id: "d", texto: "Dá erro" },
      ],
      corretaId: "a",
    },
    {
      id: "cs_3",
      enunciado: "O que este código mostra?",
      codigo: "var numeros = new List<int> { 1, 2, 3 };\nnumeros.Add(4);\nConsole.WriteLine(numeros.Count);",
      alternativas: [
        { id: "a", texto: "3" },
        { id: "b", texto: "4" },
        { id: "c", texto: "10" },
        { id: "d", texto: "1, 2, 3, 4" },
      ],
      corretaId: "b",
    },
    {
      id: "cs_4",
      enunciado: "O que este código mostra?",
      codigo: 'static string Saudar(string nome = "visitante") => $"Oi, {nome}";\n\nConsole.WriteLine(Saudar());',
      alternativas: [
        { id: "a", texto: "Oi, " },
        { id: "b", texto: "Dá erro: faltou o nome" },
        { id: "c", texto: "Oi, nome" },
        { id: "d", texto: "Oi, visitante" },
      ],
      corretaId: "d",
    },
    {
      id: "cs_5",
      enunciado: "O que este código mostra?",
      codigo: 'record Aluno(string Nome, int Nota);\n\nvar a = new Aluno("Ana", 9);\nConsole.WriteLine(a.Nome);',
      alternativas: [
        { id: "a", texto: "Aluno" },
        { id: "b", texto: "9" },
        { id: "c", texto: "Ana" },
        { id: "d", texto: "Nome" },
      ],
      corretaId: "c",
    },
    {
      id: "cs_6",
      enunciado: "O que este código mostra?",
      codigo: "var numeros = new List<int> { 1, 2, 3, 4 };\nvar soma = numeros.Where(n => n % 2 == 0).Sum();\nConsole.WriteLine(soma);",
      alternativas: [
        { id: "a", texto: "6" },
        { id: "b", texto: "10" },
        { id: "c", texto: "4" },
        { id: "d", texto: "2" },
      ],
      corretaId: "a",
    },
  ],

  go: [
    {
      id: "go_1",
      enunciado: "O que este código mostra?",
      codigo: 'nome := "Zul"\nfmt.Println("Oi,", nome)',
      alternativas: [
        { id: "a", texto: "Oi,nome" },
        { id: "b", texto: "Oi, Zul" },
        { id: "c", texto: "Oi,Zul" },
        { id: "d", texto: "Dá erro" },
      ],
      corretaId: "b",
    },
    {
      id: "go_2",
      enunciado: "O que este código mostra?",
      codigo: 'nota := 6\nif nota >= 7 {\n    fmt.Println("aprovado")\n} else {\n    fmt.Println("estude mais")\n}',
      alternativas: [
        { id: "a", texto: "estude mais" },
        { id: "b", texto: "aprovado" },
        { id: "c", texto: "As duas frases" },
        { id: "d", texto: "Nada" },
      ],
      corretaId: "a",
    },
    {
      id: "go_3",
      enunciado: "O que este código mostra?",
      codigo: "numeros := []int{1, 2, 3}\ntotal := 0\nfor _, n := range numeros {\n    total += n\n}\nfmt.Println(total)",
      alternativas: [
        { id: "a", texto: "3" },
        { id: "b", texto: "[1 2 3]" },
        { id: "c", texto: "6" },
        { id: "d", texto: "123" },
      ],
      corretaId: "c",
    },
    {
      id: "go_4",
      enunciado: "O que a função dividir devolve?",
      codigo: 'func dividir(a, b int) (int, error) {\n    if b == 0 {\n        return 0, errors.New("divisão por zero")\n    }\n    return a / b, nil\n}',
      alternativas: [
        { id: "a", texto: "Só o resultado da divisão" },
        { id: "b", texto: "Só um erro" },
        { id: "c", texto: "Nada, ela só imprime" },
        { id: "d", texto: "Dois valores: o resultado e um erro (ou nil)" },
      ],
      corretaId: "d",
    },
    {
      id: "go_5",
      enunciado: "O que este código mostra?",
      codigo: 'type Aluno struct {\n    Nome string\n    Nota int\n}\n\na := Aluno{Nome: "Ana", Nota: 9}\nfmt.Println(a.Nome)',
      alternativas: [
        { id: "a", texto: "Ana" },
        { id: "b", texto: "Nome" },
        { id: "c", texto: "{Ana 9}" },
        { id: "d", texto: "9" },
      ],
      corretaId: "a",
    },
    {
      id: "go_6",
      enunciado: "O que este código mostra?",
      codigo: 'notas := map[string]int{"Ana": 9}\nnota, existe := notas["Bia"]\nfmt.Println(nota, existe)',
      alternativas: [
        { id: "a", texto: "9 true" },
        { id: "b", texto: "Dá erro: Bia não existe" },
        { id: "c", texto: "0 false" },
        { id: "d", texto: "nil false" },
      ],
      corretaId: "c",
    },
  ],
};

export function obterPerguntasNivelamento(languageSlug: string): PerguntaNivelamento[] {
  return PERGUNTAS_NIVELAMENTO[languageSlug] ?? [];
}
