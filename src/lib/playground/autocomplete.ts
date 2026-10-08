import type { Completion, CompletionContext, CompletionResult } from "@codemirror/autocomplete";
import { lerSnippets, paraCompletion, SNIPPETS_PADRAO, type Snippet } from "./snippets";
import type { Linguagem } from "./tipos";

/** O CodeMirror já completa tag de HTML, propriedade de CSS e nome de variável
 *  que está no arquivo. O que falta — e é justamente o que trava quem está
 *  aprendendo — são os nomes da plataforma: `querySelector`, `addEventListener`,
 *  `Math.random`. Esta lista cobre isso. É escrita à mão porque não há tipos do
 *  TypeScript no navegador aqui; em troca, cada item tem uma descrição em
 *  português que o aluno entende sem sair da tela. */

type Item = [nome: string, detalhe: string];

const MEMBROS: Record<string, Item[]> = {
  console: [
    ["log", "mostra valores no console"],
    ["error", "mostra como erro, em vermelho"],
    ["warn", "mostra como aviso"],
    ["info", "mostra como informação"],
    ["table", "mostra uma lista como tabela"],
    ["clear", "limpa o console"],
  ],
  document: [
    ["querySelector", "primeiro elemento que casa com o seletor"],
    ["querySelectorAll", "todos os elementos que casam"],
    ["getElementById", "elemento por id"],
    ["createElement", "cria um elemento novo"],
    ["createTextNode", "cria um nó de texto"],
    ["addEventListener", "escuta um evento do documento"],
    ["body", "o <body> da página"],
    ["head", "o <head> da página"],
    ["title", "título da aba"],
  ],
  Math: [
    ["random", "número aleatório entre 0 e 1"],
    ["floor", "arredonda para baixo"],
    ["ceil", "arredonda para cima"],
    ["round", "arredonda para o mais perto"],
    ["abs", "valor sem sinal"],
    ["max", "o maior dos valores"],
    ["min", "o menor dos valores"],
    ["pow", "potência"],
    ["sqrt", "raiz quadrada"],
    ["PI", "3,14159…"],
    ["hypot", "distância pela diagonal"],
    ["sign", "-1, 0 ou 1"],
  ],
  JSON: [
    ["stringify", "transforma em texto"],
    ["parse", "transforma texto em objeto"],
  ],
  Object: [
    ["keys", "lista as chaves"],
    ["values", "lista os valores"],
    ["entries", "lista pares [chave, valor]"],
    ["assign", "copia propriedades"],
    ["freeze", "impede mudanças"],
    ["fromEntries", "monta objeto a partir de pares"],
  ],
  Array: [
    ["isArray", "diz se é uma lista"],
    ["from", "cria lista a partir de algo iterável"],
    ["of", "cria lista com os valores dados"],
  ],
  Number: [
    ["parseInt", "texto para inteiro"],
    ["parseFloat", "texto para decimal"],
    ["isInteger", "diz se é inteiro"],
    ["isNaN", "diz se não é número"],
    ["toFixed", "casas decimais fixas"],
  ],
  String: [["fromCharCode", "código para caractere"]],
  Promise: [
    ["all", "espera todas"],
    ["allSettled", "espera todas, com erro e tudo"],
    ["race", "a primeira que terminar"],
    ["resolve", "promessa já pronta"],
    ["reject", "promessa que falhou"],
  ],
  localStorage: [
    ["getItem", "lê um valor salvo"],
    ["setItem", "salva um valor"],
    ["removeItem", "apaga um valor"],
    ["clear", "apaga tudo"],
  ],
  window: [
    ["addEventListener", "escuta um evento da janela"],
    ["setTimeout", "roda uma vez depois de um tempo"],
    ["setInterval", "roda de novo a cada tempo"],
    ["requestAnimationFrame", "roda no próximo quadro"],
    ["innerWidth", "largura da janela"],
    ["innerHeight", "altura da janela"],
    ["alert", "caixa de aviso"],
  ],
};

/** Quando não se sabe o que vem antes do ponto — o caso comum: `nomes.` — vale
 *  mais oferecer o que quase sempre é usado em lista, texto e elemento do que
 *  não oferecer nada. */
const MEMBROS_COMUNS: Item[] = [
  ["length", "quantos itens / quantas letras"],
  ["push", "adiciona no fim da lista"],
  ["pop", "remove do fim da lista"],
  ["shift", "remove do começo"],
  ["unshift", "adiciona no começo"],
  ["forEach", "percorre cada item"],
  ["map", "transforma cada item"],
  ["filter", "mantém só os que passam no teste"],
  ["reduce", "acumula em um só valor"],
  ["find", "o primeiro que passa no teste"],
  ["findIndex", "a posição do primeiro que passa"],
  ["includes", "diz se contém"],
  ["indexOf", "em que posição está"],
  ["join", "junta a lista em um texto"],
  ["slice", "um pedaço, sem mexer no original"],
  ["splice", "remove ou insere no meio"],
  ["sort", "ordena"],
  ["reverse", "inverte"],
  ["concat", "junta com outra"],
  ["split", "divide um texto em lista"],
  ["trim", "tira espaços das pontas"],
  ["replace", "troca a primeira ocorrência"],
  ["replaceAll", "troca todas as ocorrências"],
  ["toUpperCase", "tudo em maiúscula"],
  ["toLowerCase", "tudo em minúscula"],
  ["padStart", "completa no começo"],
  ["startsWith", "diz se começa com"],
  ["endsWith", "diz se termina com"],
  ["textContent", "o texto dentro do elemento"],
  ["innerHTML", "o HTML dentro do elemento"],
  ["value", "o valor de um input"],
  ["classList", "as classes do elemento"],
  ["style", "os estilos em linha"],
  ["dataset", "os atributos data-*"],
  ["addEventListener", "escuta um evento"],
  ["removeEventListener", "para de escutar"],
  ["append", "coloca dentro, no fim"],
  ["prepend", "coloca dentro, no começo"],
  ["remove", "tira da página"],
  ["setAttribute", "define um atributo"],
  ["getAttribute", "lê um atributo"],
  ["closest", "o ancestral mais perto que casa"],
  ["focus", "põe o cursor nele"],
  ["then", "quando a promessa terminar"],
  ["catch", "quando a promessa falhar"],
  ["toFixed", "casas decimais fixas"],
  ["toString", "transforma em texto"],
];

const GLOBAIS: Item[] = [
  ["console", "mensagens de depuração"],
  ["document", "a página"],
  ["window", "a janela"],
  ["Math", "contas"],
  ["JSON", "texto ↔ objeto"],
  ["Object", "utilidades de objeto"],
  ["Array", "utilidades de lista"],
  ["Number", "utilidades de número"],
  ["String", "utilidades de texto"],
  ["Promise", "trabalho assíncrono"],
  ["localStorage", "guarda dados no navegador"],
  ["setTimeout", "roda uma vez depois de um tempo"],
  ["setInterval", "roda de novo a cada tempo"],
  ["clearInterval", "para um setInterval"],
  ["clearTimeout", "cancela um setTimeout"],
  ["requestAnimationFrame", "roda no próximo quadro"],
  ["parseInt", "texto para inteiro"],
  ["parseFloat", "texto para decimal"],
  ["isNaN", "diz se não é número"],
  ["alert", "caixa de aviso"],
  ["prompt", "pergunta ao usuário"],
  ["confirm", "pergunta sim ou não"],
  ["structuredClone", "copia profunda"],
];

const PALAVRAS: Item[] = [
  ["const", "valor que não muda de nome"],
  ["let", "variável que pode mudar"],
  ["function", "declara uma função"],
  ["return", "devolve um valor"],
  ["if", "condição"],
  ["else", "senão"],
  ["for", "laço contado"],
  ["while", "laço por condição"],
  ["break", "sai do laço"],
  ["continue", "pula para a próxima volta"],
  ["class", "declara uma classe"],
  ["new", "cria uma instância"],
  ["this", "o objeto atual"],
  ["typeof", "o tipo do valor"],
  ["async", "função assíncrona"],
  ["await", "espera uma promessa"],
  ["try", "tenta"],
  ["catch", "trata o erro"],
  ["throw", "lança um erro"],
];

function paraLista(itens: Item[], tipo: Completion["type"], boost = 0): Completion[] {
  return itens.map(([label, detail]) => ({ label, detail, type: tipo, boost }));
}

const DEPOIS_DO_PONTO = /([A-Za-z_$][\w$]*)\s*\.\s*([\w$]*)$/;
const PALAVRA = /[\w$]*$/;

/** Sugestões de JavaScript. Roda junto com a do CodeMirror, que já conhece as
 *  variáveis do próprio arquivo — as duas listas se somam. */
export function sugestoesJs(contexto: CompletionContext): CompletionResult | null {
  const antes = contexto.state.sliceDoc(
    Math.max(0, contexto.pos - 120),
    contexto.pos,
  );

  const membro = DEPOIS_DO_PONTO.exec(antes);
  if (membro) {
    const [, objeto, escrito] = membro;
    const conhecidos = MEMBROS[objeto];
    return {
      from: contexto.pos - escrito.length,
      options: conhecidos
        ? paraLista(conhecidos, "property", 30)
        : paraLista(MEMBROS_COMUNS, "property"),
      validFor: /^[\w$]*$/,
    };
  }

  const palavra = PALAVRA.exec(antes);
  if (!palavra) return null;
  if (!palavra[0] && !contexto.explicit) return null;

  return {
    from: contexto.pos - palavra[0].length,
    options: [...paraLista(GLOBAIS, "variable", 10), ...paraLista(PALAVRAS, "keyword", 5)],
    validFor: /^[\w$]*$/,
  };
}

/** Os snippets — os de fábrica mais os que o usuário criou — como uma fonte de
 *  autocomplete por linguagem. */
export function sugestoesDeSnippet(linguagem: Linguagem) {
  return (contexto: CompletionContext): CompletionResult | null => {
    const palavra = contexto.matchBefore(/[\w-]+$/);
    if (!palavra && !contexto.explicit) return null;
    const lista: Snippet[] = [
      ...SNIPPETS_PADRAO.filter((item) => item.linguagem === linguagem),
      ...lerSnippets().filter((item) => item.linguagem === linguagem),
    ];
    return {
      from: palavra?.from ?? contexto.pos,
      options: lista.map(paraCompletion),
      validFor: /^[\w-]*$/,
    };
  };
}
