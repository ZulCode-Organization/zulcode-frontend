import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import type { Extension } from "@codemirror/state";
import type React from "react";
import { tags as t } from "@lezer/highlight";

/** Os temas são escritos à mão em vez de vir de um pacote por tema: são oito
 *  paletas conhecidas descritas em dados, e assim o "ZulCode" pode seguir os
 *  mesmos tokens do app sem que o editor pareça colado de outro lugar. */
export type Paleta = {
  id: string;
  nome: string;
  escuro: boolean;
  fundo: string;
  fundoBarra: string;
  texto: string;
  apagado: string;
  cursor: string;
  /** A cor de ação da moldura: botão de rodar, aba ativa, foco. Separada do
   *  cursor porque em vários temas o cursor é quase branco, e um botão branco
   *  com texto branco some. */
  acento: string;
  selecao: string;
  linhaAtiva: string;
  borda: string;
  comentario: string;
  palavraChave: string;
  texto_: string;
  numero: string;
  funcao: string;
  tipo: string;
  tag: string;
  atributo: string;
  propriedade: string;
  operador: string;
  erro: string;
};

export const PALETAS: Paleta[] = [
  {
    id: "zulcode-escuro", nome: "ZulCode escuro", escuro: true,
    fundo: "#0f1115", fundoBarra: "#151a20", texto: "#f3f6fa", apagado: "#8b96a5",
    cursor: "#1892ff", acento: "#1892ff", selecao: "#1d3a5c", linhaAtiva: "#171d25", borda: "#232a33",
    comentario: "#64707f", palavraChave: "#5fb0ff", texto_: "#8ee7a1", numero: "#f0b86c",
    funcao: "#c3a0ff", tipo: "#5ad8d8", tag: "#5fb0ff", atributo: "#8ee7a1",
    propriedade: "#5ad8d8", operador: "#b9c4d0", erro: "#ff6b6b",
  },
  {
    id: "zulcode-claro", nome: "ZulCode claro", escuro: false,
    fundo: "#ffffff", fundoBarra: "#f5f8fc", texto: "#0f1115", apagado: "#62707f",
    cursor: "#1892ff", acento: "#1892ff", selecao: "#cfe4ff", linhaAtiva: "#f5f8fc", borda: "#e1e8f0",
    comentario: "#7a8794", palavraChave: "#0f62c4", texto_: "#0b7a44", numero: "#9a4b00",
    funcao: "#7a3bbf", tipo: "#0d6a76", tag: "#0f62c4", atributo: "#0b7a44",
    propriedade: "#0d6a76", operador: "#4a5663", erro: "#c62828",
  },
  {
    id: "dracula", nome: "Dracula", escuro: true,
    fundo: "#282a36", fundoBarra: "#21222c", texto: "#f8f8f2", apagado: "#6272a4",
    cursor: "#f8f8f2", acento: "#bd93f9", selecao: "#44475a", linhaAtiva: "#313443", borda: "#44475a",
    comentario: "#6272a4", palavraChave: "#ff79c6", texto_: "#f1fa8c", numero: "#bd93f9",
    funcao: "#50fa7b", tipo: "#8be9fd", tag: "#ff79c6", atributo: "#50fa7b",
    propriedade: "#8be9fd", operador: "#ff79c6", erro: "#ff5555",
  },
  {
    id: "tokyo-night", nome: "Tokyo Night", escuro: true,
    fundo: "#1a1b26", fundoBarra: "#16161e", texto: "#c0caf5", apagado: "#565f89",
    cursor: "#c0caf5", acento: "#7aa2f7", selecao: "#283457", linhaAtiva: "#1e202e", borda: "#2a2e42",
    comentario: "#565f89", palavraChave: "#bb9af7", texto_: "#9ece6a", numero: "#ff9e64",
    funcao: "#7aa2f7", tipo: "#2ac3de", tag: "#f7768e", atributo: "#bb9af7",
    propriedade: "#7dcfff", operador: "#89ddff", erro: "#f7768e",
  },
  {
    id: "one-dark", nome: "One Dark", escuro: true,
    fundo: "#282c34", fundoBarra: "#21252b", texto: "#abb2bf", apagado: "#5c6370",
    cursor: "#528bff", acento: "#61afef", selecao: "#3e4451", linhaAtiva: "#2c313a", borda: "#3b4048",
    comentario: "#5c6370", palavraChave: "#c678dd", texto_: "#98c379", numero: "#d19a66",
    funcao: "#61afef", tipo: "#e5c07b", tag: "#e06c75", atributo: "#d19a66",
    propriedade: "#e06c75", operador: "#56b6c2", erro: "#e06c75",
  },
  {
    id: "nord", nome: "Nord", escuro: true,
    fundo: "#2e3440", fundoBarra: "#272c36", texto: "#d8dee9", apagado: "#616e88",
    cursor: "#d8dee9", acento: "#88c0d0", selecao: "#434c5e", linhaAtiva: "#3b4252", borda: "#3b4252",
    comentario: "#616e88", palavraChave: "#81a1c1", texto_: "#a3be8c", numero: "#b48ead",
    funcao: "#88c0d0", tipo: "#8fbcbb", tag: "#81a1c1", atributo: "#8fbcbb",
    propriedade: "#d8dee9", operador: "#81a1c1", erro: "#bf616a",
  },
  {
    id: "monokai", nome: "Monokai", escuro: true,
    fundo: "#272822", fundoBarra: "#22231c", texto: "#f8f8f2", apagado: "#75715e",
    cursor: "#f8f8f0", acento: "#66d9ef", selecao: "#49483e", linhaAtiva: "#2f302a", borda: "#3e3d32",
    comentario: "#75715e", palavraChave: "#f92672", texto_: "#e6db74", numero: "#ae81ff",
    funcao: "#a6e22e", tipo: "#66d9ef", tag: "#f92672", atributo: "#a6e22e",
    propriedade: "#fd971f", operador: "#f92672", erro: "#f92672",
  },
  {
    id: "solarized-claro", nome: "Solarized claro", escuro: false,
    fundo: "#fdf6e3", fundoBarra: "#f5eed7", texto: "#586e75", apagado: "#93a1a1",
    cursor: "#657b83", acento: "#268bd2", selecao: "#eee8d5", linhaAtiva: "#f4ecd8", borda: "#e4dcc3",
    comentario: "#93a1a1", palavraChave: "#859900", texto_: "#2aa198", numero: "#d33682",
    funcao: "#268bd2", tipo: "#b58900", tag: "#268bd2", atributo: "#cb4b16",
    propriedade: "#657b83", operador: "#859900", erro: "#dc322f",
  },
  {
    id: "github-claro", nome: "GitHub claro", escuro: false,
    fundo: "#ffffff", fundoBarra: "#f6f8fa", texto: "#24292f", apagado: "#6e7781",
    cursor: "#0969da", acento: "#0969da", selecao: "#b6d8fe", linhaAtiva: "#f6f8fa", borda: "#d0d7de",
    comentario: "#6e7781", palavraChave: "#cf222e", texto_: "#0a3069", numero: "#0550ae",
    funcao: "#8250df", tipo: "#953800", tag: "#116329", atributo: "#0550ae",
    propriedade: "#0550ae", operador: "#cf222e", erro: "#cf222e",
  },
];

export function paleta(id: string) {
  return PALETAS.find((item) => item.id === id) ?? PALETAS[0];
}

/** Uma paleta vira duas extensões: as cores da moldura (fundo, cursor, gutter)
 *  e o realce da sintaxe. */
export function criarTema(p: Paleta): Extension {
  const moldura = EditorView.theme({
    "&": { color: p.texto, backgroundColor: p.fundo },
    ".cm-content": { caretColor: p.cursor },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: p.cursor, borderLeftWidth: "2px" },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
      backgroundColor: p.selecao,
    },
    ".cm-activeLine": { backgroundColor: p.linhaAtiva },
    ".cm-activeLineGutter": { backgroundColor: p.linhaAtiva, color: p.texto },
    ".cm-gutters": { backgroundColor: p.fundoBarra, color: p.apagado, border: "none" },
    ".cm-lineNumbers .cm-gutterElement": { padding: "0 10px 0 6px" },
    ".cm-foldPlaceholder": { backgroundColor: p.selecao, color: p.apagado, border: "none" },
    ".cm-selectionMatch": { backgroundColor: p.selecao },
    "&.cm-focused .cm-matchingBracket": { backgroundColor: p.selecao, outline: `1px solid ${p.apagado}` },
    "&.cm-focused .cm-nonmatchingBracket": { color: p.erro },
    ".cm-tooltip": {
      backgroundColor: p.fundoBarra, color: p.texto,
      border: `1px solid ${p.borda}`, borderRadius: "10px", overflow: "hidden",
    },
    ".cm-tooltip .cm-tooltip-arrow:before": { borderTopColor: p.borda, borderBottomColor: p.borda },
    ".cm-tooltip .cm-tooltip-arrow:after": { borderTopColor: p.fundoBarra, borderBottomColor: p.fundoBarra },
    ".cm-tooltip-autocomplete > ul > li": { padding: "4px 8px" },
    ".cm-tooltip-autocomplete > ul > li[aria-selected]": {
      backgroundColor: p.selecao, color: p.texto,
    },
    ".cm-completionIcon": { color: p.apagado, paddingRight: "8px" },
    ".cm-completionDetail": { color: p.apagado, fontStyle: "normal", marginLeft: "8px" },
    ".cm-panels": { backgroundColor: p.fundoBarra, color: p.texto },
    ".cm-searchMatch": { backgroundColor: p.selecao, outline: `1px solid ${p.apagado}` },
    ".cm-searchMatch.cm-searchMatch-selected": { backgroundColor: p.cursor, color: p.fundo },
    ".cm-lintRange-error": { backgroundImage: "none", borderBottom: `2px wavy ${p.erro}` },
  }, { dark: p.escuro });

  const sintaxe = HighlightStyle.define([
    { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], color: p.comentario, fontStyle: "italic" },
    { tag: [t.keyword, t.modifier, t.controlKeyword, t.moduleKeyword, t.self, t.null], color: p.palavraChave },
    { tag: [t.operatorKeyword, t.operator, t.derefOperator, t.logicOperator], color: p.operador },
    { tag: [t.string, t.special(t.string), t.regexp], color: p.texto_ },
    { tag: [t.number, t.bool, t.atom, t.unit], color: p.numero },
    { tag: [t.function(t.variableName), t.function(t.propertyName), t.labelName], color: p.funcao },
    { tag: [t.typeName, t.className, t.namespace, t.changed, t.annotation], color: p.tipo },
    { tag: [t.tagName, t.standard(t.tagName), t.angleBracket], color: p.tag },
    { tag: [t.attributeName, t.definition(t.propertyName)], color: p.atributo },
    { tag: [t.attributeValue], color: p.texto_ },
    { tag: [t.propertyName, t.variableName, t.definition(t.variableName)], color: p.propriedade },
    { tag: [t.heading, t.strong], color: p.palavraChave, fontWeight: "bold" },
    { tag: [t.link, t.url], color: p.funcao, textDecoration: "underline" },
    { tag: [t.meta, t.processingInstruction, t.documentMeta], color: p.apagado },
    { tag: [t.punctuation, t.separator, t.bracket], color: p.apagado },
    { tag: [t.invalid], color: p.erro, textDecoration: "underline wavy" },
  ]);

  return [moldura, syntaxHighlighting(sintaxe)];
}

/** A paleta como variáveis de CSS, para a moldura inteira — abas, barras,
 *  painéis — usar a mesma cor do código. Sem isto, um editor Dracula ficaria
 *  dentro de um app branco e azul, que é exatamente a aparência de "site com
 *  um editor colado dentro". */
export function variaveisDaPaleta(p: Paleta) {
  return {
    "--pg-fundo": p.fundo,
    "--pg-barra": p.fundoBarra,
    "--pg-texto": p.texto,
    "--pg-apagado": p.apagado,
    "--pg-borda": p.borda,
    "--pg-acento": p.acento,
    "--pg-ativo": p.linhaAtiva,
    "--pg-selecao": p.selecao,
    "--pg-erro": p.erro,
  } as React.CSSProperties;
}
