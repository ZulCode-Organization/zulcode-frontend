import { UnidadeTrilha } from "@/lib/types/trilha";

/**
 * Curso de JavaScript: 10 unidades de 8 lições cada (80 no total). Só a
 * primeira unidade tem uma lição "atual" + "disponivel" pra abrir o caminho
 * — as outras 9 ficam inteiramente bloqueadas, porque nesse mock ninguém
 * ainda progrediu além da unidade 1.
 */
export const unidadesTrilha: UnidadeTrilha[] = [
  {
    id: "unidade_1",
    secao: 1,
    unidade: 1,
    titulo: "Fundamentos do JavaScript",
    duracaoEstimada: "~30 min",
    licoes: [
      { id: "u1_licao_1", titulo: "Intro ao JS", subtitulo: "O que é JavaScript", xp: 20, estado: "atual" },
      { id: "u1_licao_2", titulo: "Variáveis", subtitulo: "let, const e var", xp: 25, estado: "disponivel" },
      { id: "u1_licao_3", titulo: "Tipos de dados", subtitulo: "Números, texto e booleanos", xp: 20, estado: "bloqueada" },
      { id: "u1_licao_4", titulo: "Operadores", subtitulo: "Comparações e cálculos", xp: 25, estado: "bloqueada" },
      { id: "u1_licao_5", titulo: "Condicionais", subtitulo: "if, else e switch", xp: 30, estado: "bloqueada" },
      { id: "u1_licao_6", titulo: "Laços", subtitulo: "for e while", xp: 25, estado: "bloqueada" },
      { id: "u1_licao_7", titulo: "Funções", subtitulo: "Declare e reutilize código", xp: 25, estado: "bloqueada" },
      { id: "u1_licao_8", titulo: "Revisão", subtitulo: "Feche a unidade", xp: 35, estado: "bloqueada" },
    ],
  },
  {
    id: "unidade_2",
    secao: 1,
    unidade: 2,
    titulo: "Arrays e Objetos",
    duracaoEstimada: "~30 min",
    licoes: [
      { id: "u2_licao_1", titulo: "Arrays", subtitulo: "Listas ordenadas", xp: 20, estado: "bloqueada" },
      { id: "u2_licao_2", titulo: "Métodos de array", subtitulo: "push, map e filter", xp: 25, estado: "bloqueada" },
      { id: "u2_licao_3", titulo: "Objetos", subtitulo: "Pares chave-valor", xp: 20, estado: "bloqueada" },
      { id: "u2_licao_4", titulo: "Desestruturação", subtitulo: "Extraia valores rápido", xp: 25, estado: "bloqueada" },
      { id: "u2_licao_5", titulo: "Objetos aninhados", subtitulo: "Estruturas mais profundas", xp: 30, estado: "bloqueada" },
      { id: "u2_licao_6", titulo: "Iteração", subtitulo: "for...of e for...in", xp: 25, estado: "bloqueada" },
      { id: "u2_licao_7", titulo: "JSON", subtitulo: "Serialize e leia dados", xp: 25, estado: "bloqueada" },
      { id: "u2_licao_8", titulo: "Revisão", subtitulo: "Feche a unidade", xp: 35, estado: "bloqueada" },
    ],
  },
  {
    id: "unidade_3",
    secao: 1,
    unidade: 3,
    titulo: "Funções Avançadas",
    duracaoEstimada: "~30 min",
    licoes: [
      { id: "u3_licao_1", titulo: "Arrow functions", subtitulo: "Sintaxe curta", xp: 20, estado: "bloqueada" },
      { id: "u3_licao_2", titulo: "Escopo", subtitulo: "let, const e closures", xp: 25, estado: "bloqueada" },
      { id: "u3_licao_3", titulo: "Closures", subtitulo: "Funções que lembram", xp: 25, estado: "bloqueada" },
      { id: "u3_licao_4", titulo: "Parâmetros", subtitulo: "Padrão e rest", xp: 20, estado: "bloqueada" },
      { id: "u3_licao_5", titulo: "Callbacks", subtitulo: "Funções como argumento", xp: 30, estado: "bloqueada" },
      { id: "u3_licao_6", titulo: "Funções puras", subtitulo: "Sem efeitos colaterais", xp: 25, estado: "bloqueada" },
      { id: "u3_licao_7", titulo: "Recursão", subtitulo: "Funções que se chamam", xp: 30, estado: "bloqueada" },
      { id: "u3_licao_8", titulo: "Revisão", subtitulo: "Feche a unidade", xp: 35, estado: "bloqueada" },
    ],
  },
  {
    id: "unidade_4",
    secao: 1,
    unidade: 4,
    titulo: "DOM e Eventos",
    duracaoEstimada: "~30 min",
    licoes: [
      { id: "u4_licao_1", titulo: "O DOM", subtitulo: "A árvore da página", xp: 20, estado: "bloqueada" },
      { id: "u4_licao_2", titulo: "Selecionando elementos", subtitulo: "querySelector", xp: 20, estado: "bloqueada" },
      { id: "u4_licao_3", titulo: "Alterando o DOM", subtitulo: "Texto, estilo e classes", xp: 25, estado: "bloqueada" },
      { id: "u4_licao_4", titulo: "Eventos", subtitulo: "click, input e mais", xp: 25, estado: "bloqueada" },
      { id: "u4_licao_5", titulo: "Formulários", subtitulo: "Capture dados do usuário", xp: 30, estado: "bloqueada" },
      { id: "u4_licao_6", titulo: "Criando elementos", subtitulo: "createElement", xp: 25, estado: "bloqueada" },
      { id: "u4_licao_7", titulo: "Delegação de eventos", subtitulo: "Um listener, vários alvos", xp: 30, estado: "bloqueada" },
      { id: "u4_licao_8", titulo: "Revisão", subtitulo: "Feche a unidade", xp: 35, estado: "bloqueada" },
    ],
  },
  {
    id: "unidade_5",
    secao: 1,
    unidade: 5,
    titulo: "Assincronia",
    duracaoEstimada: "~30 min",
    licoes: [
      { id: "u5_licao_1", titulo: "Callbacks assíncronos", subtitulo: "Código que espera", xp: 20, estado: "bloqueada" },
      { id: "u5_licao_2", titulo: "Promises", subtitulo: "resolve e reject", xp: 25, estado: "bloqueada" },
      { id: "u5_licao_3", titulo: "Encadeando promises", subtitulo: ".then e .catch", xp: 25, estado: "bloqueada" },
      { id: "u5_licao_4", titulo: "async/await", subtitulo: "Sintaxe mais limpa", xp: 30, estado: "bloqueada" },
      { id: "u5_licao_5", titulo: "Fetch", subtitulo: "Buscando dados de uma API", xp: 30, estado: "bloqueada" },
      { id: "u5_licao_6", titulo: "Erros assíncronos", subtitulo: "try/catch com await", xp: 25, estado: "bloqueada" },
      { id: "u5_licao_7", titulo: "Promise.all", subtitulo: "Várias tarefas de uma vez", xp: 30, estado: "bloqueada" },
      { id: "u5_licao_8", titulo: "Revisão", subtitulo: "Feche a unidade", xp: 35, estado: "bloqueada" },
    ],
  },
  {
    id: "unidade_6",
    secao: 1,
    unidade: 6,
    titulo: "Manipulação de Strings",
    duracaoEstimada: "~30 min",
    licoes: [
      { id: "u6_licao_1", titulo: "Strings", subtitulo: "Criando e lendo texto", xp: 20, estado: "bloqueada" },
      { id: "u6_licao_2", titulo: "Métodos de string", subtitulo: "slice, split e trim", xp: 25, estado: "bloqueada" },
      { id: "u6_licao_3", titulo: "Template literals", subtitulo: "Interpolação de texto", xp: 20, estado: "bloqueada" },
      { id: "u6_licao_4", titulo: "Regex básico", subtitulo: "Padrões de texto", xp: 30, estado: "bloqueada" },
      { id: "u6_licao_5", titulo: "Formatação", subtitulo: "Números e datas", xp: 25, estado: "bloqueada" },
      { id: "u6_licao_6", titulo: "Comparações", subtitulo: "Ordenando texto", xp: 20, estado: "bloqueada" },
      { id: "u6_licao_7", titulo: "Concatenação", subtitulo: "Juntando strings", xp: 20, estado: "bloqueada" },
      { id: "u6_licao_8", titulo: "Revisão", subtitulo: "Feche a unidade", xp: 35, estado: "bloqueada" },
    ],
  },
  {
    id: "unidade_7",
    secao: 1,
    unidade: 7,
    titulo: "Orientação a Objetos",
    duracaoEstimada: "~30 min",
    licoes: [
      { id: "u7_licao_1", titulo: "Classes", subtitulo: "Moldes de objetos", xp: 20, estado: "bloqueada" },
      { id: "u7_licao_2", titulo: "Construtores", subtitulo: "Inicializando instâncias", xp: 25, estado: "bloqueada" },
      { id: "u7_licao_3", titulo: "Métodos", subtitulo: "Comportamento dos objetos", xp: 25, estado: "bloqueada" },
      { id: "u7_licao_4", titulo: "Herança", subtitulo: "extends e super", xp: 30, estado: "bloqueada" },
      { id: "u7_licao_5", titulo: "Encapsulamento", subtitulo: "Campos privados", xp: 25, estado: "bloqueada" },
      { id: "u7_licao_6", titulo: "Getters e setters", subtitulo: "Acesso controlado", xp: 25, estado: "bloqueada" },
      { id: "u7_licao_7", titulo: "Polimorfismo", subtitulo: "Mesmo método, resultados diferentes", xp: 30, estado: "bloqueada" },
      { id: "u7_licao_8", titulo: "Revisão", subtitulo: "Feche a unidade", xp: 35, estado: "bloqueada" },
    ],
  },
  {
    id: "unidade_8",
    secao: 1,
    unidade: 8,
    titulo: "Tratamento de Erros",
    duracaoEstimada: "~30 min",
    licoes: [
      { id: "u8_licao_1", titulo: "Erros comuns", subtitulo: "Identifique e corrija", xp: 20, estado: "bloqueada" },
      { id: "u8_licao_2", titulo: "try/catch", subtitulo: "Capturando exceções", xp: 25, estado: "bloqueada" },
      { id: "u8_licao_3", titulo: "throw", subtitulo: "Lançando seus erros", xp: 20, estado: "bloqueada" },
      { id: "u8_licao_4", titulo: "Erros customizados", subtitulo: "Classes de erro", xp: 30, estado: "bloqueada" },
      { id: "u8_licao_5", titulo: "finally", subtitulo: "Sempre executa", xp: 20, estado: "bloqueada" },
      { id: "u8_licao_6", titulo: "Depuração", subtitulo: "Console e breakpoints", xp: 25, estado: "bloqueada" },
      { id: "u8_licao_7", titulo: "Validação", subtitulo: "Prevenindo erros", xp: 25, estado: "bloqueada" },
      { id: "u8_licao_8", titulo: "Revisão", subtitulo: "Feche a unidade", xp: 35, estado: "bloqueada" },
    ],
  },
  {
    id: "unidade_9",
    secao: 1,
    unidade: 9,
    titulo: "Módulos e Ferramentas",
    duracaoEstimada: "~30 min",
    licoes: [
      { id: "u9_licao_1", titulo: "Módulos", subtitulo: "import e export", xp: 20, estado: "bloqueada" },
      { id: "u9_licao_2", titulo: "NPM", subtitulo: "Instalando pacotes", xp: 20, estado: "bloqueada" },
      { id: "u9_licao_3", titulo: "Bundlers", subtitulo: "Preparando pro navegador", xp: 25, estado: "bloqueada" },
      { id: "u9_licao_4", titulo: "ES6+", subtitulo: "Recursos modernos", xp: 25, estado: "bloqueada" },
      { id: "u9_licao_5", titulo: "Build tools", subtitulo: "Babel e afins", xp: 25, estado: "bloqueada" },
      { id: "u9_licao_6", titulo: "Boas práticas", subtitulo: "Código limpo", xp: 25, estado: "bloqueada" },
      { id: "u9_licao_7", titulo: "Testes", subtitulo: "Testando funções", xp: 30, estado: "bloqueada" },
      { id: "u9_licao_8", titulo: "Revisão", subtitulo: "Feche a unidade", xp: 35, estado: "bloqueada" },
    ],
  },
  {
    id: "unidade_10",
    secao: 1,
    unidade: 10,
    titulo: "Projeto Final",
    duracaoEstimada: "~30 min",
    licoes: [
      { id: "u10_licao_1", titulo: "Planejamento", subtitulo: "Estruture seu projeto", xp: 25, estado: "bloqueada" },
      { id: "u10_licao_2", titulo: "Estrutura", subtitulo: "HTML, CSS e JS juntos", xp: 25, estado: "bloqueada" },
      { id: "u10_licao_3", titulo: "Lógica principal", subtitulo: "Implemente as regras", xp: 30, estado: "bloqueada" },
      { id: "u10_licao_4", titulo: "Interatividade", subtitulo: "Conecte os eventos", xp: 30, estado: "bloqueada" },
      { id: "u10_licao_5", titulo: "Dados dinâmicos", subtitulo: "Busque e exiba", xp: 30, estado: "bloqueada" },
      { id: "u10_licao_6", titulo: "Refino", subtitulo: "Ajustes finais", xp: 25, estado: "bloqueada" },
      { id: "u10_licao_7", titulo: "Testando tudo", subtitulo: "Garanta que funciona", xp: 25, estado: "bloqueada" },
      { id: "u10_licao_8", titulo: "Projeto Final", subtitulo: "Publique seu trabalho", xp: 50, estado: "bloqueada" },
    ],
  },
];

/**
 * Uma cor por unidade pra o cabeçalho fixo trocar ao rolar — classes
 * literais (não geradas por template string) pra o Tailwind conseguir achar
 * e gerar cada uma no build.
 */
export const CORES_UNIDADE = [
  { bg: "bg-primary", sombra: "shadow-primary/20", trilha: "bg-primary" },
  { bg: "bg-emerald-500", sombra: "shadow-emerald-500/20", trilha: "bg-emerald-500" },
  { bg: "bg-orange-500", sombra: "shadow-orange-500/20", trilha: "bg-orange-500" },
  { bg: "bg-rose-500", sombra: "shadow-rose-500/20", trilha: "bg-rose-500" },
  { bg: "bg-violet-500", sombra: "shadow-violet-500/20", trilha: "bg-violet-500" },
  { bg: "bg-teal-500", sombra: "shadow-teal-500/20", trilha: "bg-teal-500" },
  { bg: "bg-pink-500", sombra: "shadow-pink-500/20", trilha: "bg-pink-500" },
  { bg: "bg-indigo-500", sombra: "shadow-indigo-500/20", trilha: "bg-indigo-500" },
  { bg: "bg-amber-500", sombra: "shadow-amber-500/20", trilha: "bg-amber-500" },
  { bg: "bg-cyan-500", sombra: "shadow-cyan-500/20", trilha: "bg-cyan-500" },
] as const;

export type CorUnidade = (typeof CORES_UNIDADE)[number];
