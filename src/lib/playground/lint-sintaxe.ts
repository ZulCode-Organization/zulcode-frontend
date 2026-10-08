import { syntaxTree } from "@codemirror/language";
import type { Diagnostic } from "@codemirror/lint";
import type { EditorView } from "@codemirror/view";
import type { Linguagem } from "./tipos";

/** Erro de sintaxe apontado na linha, antes de rodar.
 *
 *  Vem da própria árvore do CodeMirror: o parser de cada linguagem marca os
 *  trechos que não entendeu, então HTML, CSS e JavaScript são verificados pelo
 *  mesmo caminho, sem embutir um ESLint de 2 MB no navegador. Em troca, isto
 *  pega erro de escrita — parêntese sem fechar, chave sobrando — e não erro de
 *  lógica. Esse fica para o console. */

const MAX_ERROS = 20;

const PARES: Record<string, string> = { "(": ")", "[": "]", "{": "}" };
const FECHAMENTOS = new Set([")", "]", "}"]);

const NOMES: Record<string, string> = {
  ")": "parêntese", "]": "colchete", "}": "chave",
  "(": "parêntese", "[": "colchete", "{": "chave",
};

/** Conta pares fora de string e de comentário. É o erro mais comum de quem
 *  está começando, e a mensagem genérica da árvore não diz o que falta. */
function erroDeEquilibrio(codigo: string, linguagem: Linguagem): Diagnostic | null {
  if (linguagem === "html") return null;
  const pilha: { char: string; pos: number }[] = [];
  let i = 0;
  while (i < codigo.length) {
    const char = codigo[i];
    const proximo = codigo[i + 1];

    if (char === "/" && proximo === "/" && linguagem === "javascript") {
      const fim = codigo.indexOf("\n", i);
      i = fim === -1 ? codigo.length : fim + 1;
      continue;
    }
    if (char === "/" && proximo === "*") {
      const fim = codigo.indexOf("*/", i + 2);
      i = fim === -1 ? codigo.length : fim + 2;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      i++;
      while (i < codigo.length && codigo[i] !== char) {
        if (codigo[i] === "\\") i++;
        else if (char !== "`" && codigo[i] === "\n") break;
        i++;
      }
      i++;
      continue;
    }
    if (char in PARES) pilha.push({ char, pos: i });
    else if (FECHAMENTOS.has(char)) {
      const aberto = pilha.pop();
      if (!aberto) {
        return {
          from: i, to: i + 1, severity: "error",
          message: `Este ${NOMES[char]} fecha algo que não foi aberto. Apague ou abra o ${NOMES[char]} correspondente.`,
        };
      }
      if (PARES[aberto.char] !== char) {
        return {
          from: aberto.pos, to: aberto.pos + 1, severity: "error",
          message: `Este ${NOMES[aberto.char]} foi fechado com "${char}". Feche com "${PARES[aberto.char]}".`,
        };
      }
    }
    i++;
  }
  const sobrando = pilha[0];
  if (sobrando) {
    return {
      from: sobrando.pos, to: sobrando.pos + 1, severity: "error",
      message: `Falta fechar este ${NOMES[sobrando.char]} com "${PARES[sobrando.char]}".`,
    };
  }
  return null;
}

function mensagemDaArvore(trecho: string, linguagem: Linguagem) {
  const limpo = trecho.trim().slice(0, 24);
  if (!limpo) {
    return linguagem === "css"
      ? "Falta algo aqui — talvez o ponto e vírgula do fim da linha."
      : "Falta algo aqui para a linha ficar completa.";
  }
  return `"${limpo}" está em um lugar que o navegador não entende.`;
}

/** As posições inválidas que a árvore marca, uma por linha. Mais de uma marca
 *  na mesma linha é quase sempre o mesmo erro visto de ângulos diferentes. */
export function errosDeSintaxe(view: EditorView, linguagem: Linguagem): Diagnostic[] {
  const { state } = view;
  const codigo = state.doc.toString();
  const equilibrio = erroDeEquilibrio(codigo, linguagem);
  if (equilibrio) return [equilibrio];

  const erros: Diagnostic[] = [];
  const linhasMarcadas = new Set<number>();
  syntaxTree(state).iterate({
    enter: (no) => {
      if (erros.length >= MAX_ERROS || !no.type.isError) return;
      const linha = state.doc.lineAt(no.from);
      if (linhasMarcadas.has(linha.number)) return;
      linhasMarcadas.add(linha.number);
      // Marca de largura zero não é clicável; estica até o fim da linha.
      const de = Math.min(no.from, linha.to);
      const ate = no.to > no.from ? Math.min(no.to, linha.to) : linha.to;
      if (ate <= de) return;
      erros.push({
        from: de,
        to: ate,
        severity: "error",
        message: mensagemDaArvore(state.sliceDoc(de, ate), linguagem),
      });
    },
  });
  return erros;
}
