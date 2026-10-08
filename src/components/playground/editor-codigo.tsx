"use client";

import { useEffect, useRef } from "react";
import { EditorState, Compartment, Prec, type Extension } from "@codemirror/state";
import {
  EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter,
  highlightSpecialChars, drawSelection, dropCursor, rectangularSelection,
  crosshairCursor,
} from "@codemirror/view";
import {
  defaultKeymap, history, historyKeymap, indentWithTab, redo, undo,
} from "@codemirror/commands";
import {
  bracketMatching, foldGutter, foldKeymap, indentOnInput, indentUnit,
} from "@codemirror/language";
import {
  autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap,
} from "@codemirror/autocomplete";
import { highlightSelectionMatches, openSearchPanel, searchKeymap } from "@codemirror/search";
import {
  forEachDiagnostic, lintGutter, lintKeymap, linter, nextDiagnostic,
} from "@codemirror/lint";
import { html, htmlLanguage } from "@codemirror/lang-html";
import { css, cssLanguage } from "@codemirror/lang-css";
import { javascript, javascriptLanguage } from "@codemirror/lang-javascript";
import { abbreviationTracker, expandAbbreviation } from "@emmetio/codemirror6-plugin";
import { sugestoesDeSnippet, sugestoesJs } from "@/lib/playground/autocomplete";
import { errosDeSintaxe } from "@/lib/playground/lint-sintaxe";
import { criarTema, paleta } from "@/lib/playground/temas";
import { definirEstadoEditor } from "@/lib/playground/estado-editor";
import type { Ajustes } from "@/lib/playground/ajustes";
import type { Linguagem } from "@/lib/playground/tipos";

/** O que a barra de teclas do celular e a paleta de comandos chamam no editor.
 *  São comandos imperativos porque é isso que um botão de teclado é: "digite
 *  isto onde o cursor está". */
export type ApiEditor = {
  inserir: (texto: string, voltarCursor?: number) => void;
  comando: (
    nome: "tab" | "desfazer" | "refazer" | "esquerda" | "direita" | "fim" | "buscar" | "erro",
  ) => void;
  irParaLinha: (linha: number) => void;
  focar: () => void;
};

type Acoes = {
  aoMudar: (conteudo: string) => void;
  aoRodar: () => void;
  aoFormatar: () => void;
  aoAbrirPaleta: () => void;
};

type Props = Acoes & {
  arquivoId: string;
  conteudo: string;
  linguagem: Linguagem;
  ajustes: Ajustes;
  aoMontar?: (api: ApiEditor | null) => void;
  /** Usado na pagina publica: da para ler, copiar e navegar, nao para mudar.
   *  Nao muda durante a vida do componente. */
  somenteLeitura?: boolean;
};

const tema = new Compartment();
const linguagemCompart = new Compartment();
const aparencia = new Compartment();
const tabulacao = new Compartment();
const quebra = new Compartment();
const numeros = new Compartment();
const pares = new Compartment();

function extensoesDaLinguagem(linguagem: Linguagem, emmet: boolean): Extension {
  const extensoes: Extension[] =
    linguagem === "html"
      ? [
          html({ autoCloseTags: true }),
          htmlLanguage.data.of({ autocomplete: sugestoesDeSnippet("html") }),
        ]
      : linguagem === "css"
        ? [css(), cssLanguage.data.of({ autocomplete: sugestoesDeSnippet("css") })]
        : [
            javascript(),
            javascriptLanguage.data.of({ autocomplete: sugestoesDeSnippet("javascript") }),
            javascriptLanguage.data.of({ autocomplete: sugestoesJs }),
          ];

  // O Emmet só faz sentido em HTML e CSS; em JavaScript ele disputaria o Tab
  // com a indentação sem nunca ter o que expandir.
  if (emmet && linguagem !== "javascript") extensoes.push(abbreviationTracker());
  extensoes.push(linter((view) => errosDeSintaxe(view, linguagem), { delay: 500 }));
  return extensoes;
}

function temaDaFonte(fonte: number) {
  return EditorView.theme({
    "&": { fontSize: `${fonte}px` },
    ".cm-content": { fontFamily: "var(--font-mono, ui-monospace, monospace)" },
    ".cm-scroller": { lineHeight: "1.65", fontFamily: "inherit" },
  });
}

/** Tudo o que depende de preferência ou de linguagem, em um lugar só: serve
 *  para montar o editor, para criar o estado de um arquivo novo e para
 *  reconfigurar um estado guardado que voltou com o tema antigo. */
function configuracao(ajustes: Ajustes, linguagem: Linguagem) {
  return {
    tema: criarTema(paleta(ajustes.tema)),
    linguagem: extensoesDaLinguagem(linguagem, ajustes.emmet),
    aparencia: temaDaFonte(ajustes.fonte),
    tabulacao: [
      indentUnit.of(" ".repeat(ajustes.tabulacao)),
      EditorState.tabSize.of(ajustes.tabulacao),
    ] as Extension,
    quebra: ajustes.quebrarLinha ? EditorView.lineWrapping : [],
    numeros: ajustes.numerosDeLinha ? lineNumbers() : [],
    pares: ajustes.fecharPares ? closeBrackets() : [],
  };
}

function efeitosDeConfiguracao(ajustes: Ajustes, linguagem: Linguagem) {
  const c = configuracao(ajustes, linguagem);
  return [
    tema.reconfigure(c.tema),
    linguagemCompart.reconfigure(c.linguagem),
    aparencia.reconfigure(c.aparencia),
    tabulacao.reconfigure(c.tabulacao),
    quebra.reconfigure(c.quebra),
    numeros.reconfigure(c.numeros),
    pares.reconfigure(c.pares),
  ];
}

export function EditorCodigo({
  arquivoId, conteudo, linguagem, ajustes,
  aoMudar, aoRodar, aoFormatar, aoAbrirPaleta, aoMontar, somenteLeitura = false,
}: Props) {
  const caixa = useRef<HTMLDivElement | null>(null);
  const view = useRef<EditorView | null>(null);
  // Um estado por arquivo: trocar de aba preserva cursor, rolagem e desfazer.
  const estados = useRef(new Map<string, EditorState>());
  const idAtivo = useRef(arquivoId);
  // As props mudam a cada render; o keymap do CodeMirror é criado uma vez só.
  // Os valores iniciais já servem para a montagem, e este efeito mantém as
  // caixas em dia depois — escrever em ref durante a renderização tornaria o
  // componente impuro.
  const acoes = useRef<Acoes>({ aoMudar, aoRodar, aoFormatar, aoAbrirPaleta });
  const atual = useRef({ ajustes, linguagem });
  useEffect(() => {
    acoes.current = { aoMudar, aoRodar, aoFormatar, aoAbrirPaleta };
    atual.current = { ajustes, linguagem };
  });
  // Guardado em ref porque nasce dentro do efeito de montagem, onde a lista
  // de extensoes fixas existe, e e usado depois ao abrir um arquivo novo.
  const criarEstadoRef = useRef<((doc: string) => EditorState) | null>(null);

  // Monta uma vez. Trocar de arquivo, de tema ou de fonte não recria o editor.
  useEffect(() => {
    const alvo = caixa.current;
    if (!alvo) return;

    const fixas: Extension[] = [
      Prec.high(keymap.of([
        // O Emmet devolve false quando não há abreviação, então o Tab continua
        // servindo para campo de snippet e para indentar.
        { key: "Tab", run: expandAbbreviation },
        { key: "Mod-Enter", run: () => { acoes.current.aoRodar(); return true; }, preventDefault: true },
        { key: "Mod-s", run: () => { acoes.current.aoRodar(); return true; }, preventDefault: true },
        { key: "Shift-Alt-f", run: () => { acoes.current.aoFormatar(); return true; }, preventDefault: true },
        { key: "Mod-k", run: () => { acoes.current.aoAbrirPaleta(); return true; }, preventDefault: true },
      ])),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      foldGutter({ openText: "▾", closedText: "▸" }),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      indentOnInput(),
      bracketMatching(),
      rectangularSelection(),
      crosshairCursor(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      lintGutter(),
      autocompletion({
        activateOnTyping: true,
        icons: true,
        maxRenderedOptions: 24,
        closeOnBlur: true,
      }),
      keymap.of([
        ...closeBracketsKeymap, ...defaultKeymap, ...searchKeymap,
        ...historyKeymap, ...foldKeymap, ...completionKeymap, ...lintKeymap,
      ]),
      Prec.low(keymap.of([indentWithTab])),
      EditorState.readOnly.of(somenteLeitura),
      EditorView.editable.of(!somenteLeitura),
      EditorView.contentAttributes.of({
        autocapitalize: "off",
        autocorrect: "off",
        spellcheck: "false",
        "aria-label": "Editor de código",
      }),
      EditorView.updateListener.of((atualizacao) => {
        if (atualizacao.docChanged) acoes.current.aoMudar(atualizacao.state.doc.toString());
        // Recontar a cada atualizacao e deixar o store descartar o que nao
        // mudou e mais simples do que adivinhar quais transacoes trazem
        // diagnostico -- o lint chega depois, assincrono, no seu proprio
        // update.
        const { state } = atualizacao;
        const posicao = state.selection.main.head;
        const linha = state.doc.lineAt(posicao);
        let erros = 0;
        forEachDiagnostic(state, (aviso) => {
          if (aviso.severity === "error") erros++;
        });
        definirEstadoEditor({
          linha: linha.number,
          coluna: posicao - linha.from + 1,
          erros,
        });
      }),
    ];

    const criarEstado = (doc: string) => {
      const c = configuracao(atual.current.ajustes, atual.current.linguagem);
      return EditorState.create({
        doc,
        extensions: [
          tema.of(c.tema),
          linguagemCompart.of(c.linguagem),
          aparencia.of(c.aparencia),
          tabulacao.of(c.tabulacao),
          quebra.of(c.quebra),
          numeros.of(c.numeros),
          pares.of(c.pares),
          fixas,
        ],
      });
    };
    criarEstadoRef.current = criarEstado;

    const estado = criarEstado(conteudo);
    const editor = new EditorView({ state: estado, parent: alvo });
    view.current = editor;
    estados.current.set(arquivoId, estado);
    idAtivo.current = arquivoId;

    const api: ApiEditor = {
      inserir: (texto, voltarCursor = 0) => {
        const { from, to } = editor.state.selection.main;
        editor.dispatch({
          changes: { from, to, insert: texto },
          selection: { anchor: from + texto.length - voltarCursor },
          scrollIntoView: true,
        });
        editor.focus();
      },
      comando: (nome) => {
        if (nome === "buscar") return void openSearchPanel(editor);
        if (nome === "erro") return void nextDiagnostic(editor);
        if (nome === "desfazer") undo(editor);
        else if (nome === "refazer") redo(editor);
        else {
          const { from, to } = editor.state.selection.main;
          if (nome === "tab") {
            const espacos = " ".repeat(atual.current.ajustes.tabulacao);
            editor.dispatch({
              changes: { from, to, insert: espacos },
              selection: { anchor: from + espacos.length },
            });
          } else if (nome === "esquerda") {
            editor.dispatch({ selection: { anchor: Math.max(0, from - 1) }, scrollIntoView: true });
          } else if (nome === "direita") {
            editor.dispatch({
              selection: { anchor: Math.min(editor.state.doc.length, to + 1) },
              scrollIntoView: true,
            });
          } else {
            const linha = editor.state.doc.lineAt(to);
            editor.dispatch({ selection: { anchor: linha.to }, scrollIntoView: true });
          }
        }
        editor.focus();
      },
      irParaLinha: (linha) => {
        const destino = editor.state.doc.line(
          Math.min(Math.max(1, linha), editor.state.doc.lines),
        );
        editor.dispatch({ selection: { anchor: destino.from }, scrollIntoView: true });
        editor.focus();
      },
      focar: () => editor.focus(),
    };
    aoMontar?.(api);

    const guardados = estados.current;
    return () => {
      aoMontar?.(null);
      editor.destroy();
      view.current = null;
      guardados.clear();
    };
    // Monta uma vez: as mudanças de prop entram pelos efeitos abaixo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Trocar de arquivo: guarda o estado do que sai e devolve o do que entra.
  useEffect(() => {
    const editor = view.current;
    const criarEstado = criarEstadoRef.current;
    if (!editor || !criarEstado || idAtivo.current === arquivoId) return;
    estados.current.set(idAtivo.current, editor.state);
    const guardado = estados.current.get(arquivoId);
    if (guardado) {
      editor.setState(guardado);
      // O estado guardado carrega a configuração de quando saiu de cena. Tema,
      // fonte e linguagem podem ter mudado desde então.
      editor.dispatch({ effects: efeitosDeConfiguracao(ajustes, linguagem) });
    } else {
      // Arquivo novo: estado próprio, para o desfazer não atravessar arquivos.
      editor.setState(criarEstado(conteudo));
    }
    idAtivo.current = arquivoId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arquivoId]);

  // Conteúdo vindo de fora: formatar, restaurar versão, abrir outro projeto.
  useEffect(() => {
    const editor = view.current;
    if (!editor || idAtivo.current !== arquivoId) return;
    if (editor.state.doc.toString() === conteudo) return;
    editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: conteudo } });
  }, [conteudo, arquivoId]);

  useEffect(() => {
    view.current?.dispatch({ effects: tema.reconfigure(criarTema(paleta(ajustes.tema))) });
  }, [ajustes.tema]);

  useEffect(() => {
    view.current?.dispatch({
      effects: linguagemCompart.reconfigure(extensoesDaLinguagem(linguagem, ajustes.emmet)),
    });
  }, [linguagem, ajustes.emmet]);

  useEffect(() => {
    view.current?.dispatch({ effects: aparencia.reconfigure(temaDaFonte(ajustes.fonte)) });
  }, [ajustes.fonte]);

  useEffect(() => {
    view.current?.dispatch({
      effects: tabulacao.reconfigure([
        indentUnit.of(" ".repeat(ajustes.tabulacao)),
        EditorState.tabSize.of(ajustes.tabulacao),
      ]),
    });
  }, [ajustes.tabulacao]);

  useEffect(() => {
    view.current?.dispatch({
      effects: quebra.reconfigure(ajustes.quebrarLinha ? EditorView.lineWrapping : []),
    });
  }, [ajustes.quebrarLinha]);

  useEffect(() => {
    view.current?.dispatch({
      effects: numeros.reconfigure(ajustes.numerosDeLinha ? lineNumbers() : []),
    });
  }, [ajustes.numerosDeLinha]);

  useEffect(() => {
    view.current?.dispatch({
      effects: pares.reconfigure(ajustes.fecharPares ? closeBrackets() : []),
    });
  }, [ajustes.fecharPares]);

  return <div ref={caixa} className="zc-editor min-h-0 flex-1 overflow-hidden" />;
}
