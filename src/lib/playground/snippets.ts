import { snippetCompletion, type Completion } from "@codemirror/autocomplete";
import type { Linguagem } from "./tipos";

/** Atalhos de digitação. `${nome}` marca um ponto de parada: depois de expandir,
 *  Tab pula de um para o outro. Os rótulos e as descrições estão em português
 *  porque é o que o aluno digita procurando. */
export type Snippet = {
  atalho: string;
  descricao: string;
  corpo: string;
  linguagem: Linguagem;
};

export const SNIPPETS_PADRAO: Snippet[] = [
  // ---- JavaScript ----
  { linguagem: "javascript", atalho: "log", descricao: "console.log", corpo: 'console.log(${valor});' },
  { linguagem: "javascript", atalho: "func", descricao: "função", corpo: "function ${nome}(${parametros}) {\n\t${}\n}" },
  { linguagem: "javascript", atalho: "seta", descricao: "função de seta", corpo: "const ${nome} = (${parametros}) => {\n\t${}\n};" },
  { linguagem: "javascript", atalho: "for", descricao: "for clássico", corpo: "for (let i = 0; i < ${limite}; i++) {\n\t${}\n}" },
  { linguagem: "javascript", atalho: "forof", descricao: "for...of", corpo: "for (const ${item} of ${lista}) {\n\t${}\n}" },
  { linguagem: "javascript", atalho: "forin", descricao: "for...in", corpo: "for (const ${chave} in ${objeto}) {\n\t${}\n}" },
  { linguagem: "javascript", atalho: "if", descricao: "if", corpo: "if (${condicao}) {\n\t${}\n}" },
  { linguagem: "javascript", atalho: "ifelse", descricao: "if / else", corpo: "if (${condicao}) {\n\t${}\n} else {\n\t\n}" },
  { linguagem: "javascript", atalho: "while", descricao: "while", corpo: "while (${condicao}) {\n\t${}\n}" },
  { linguagem: "javascript", atalho: "switch", descricao: "switch", corpo: "switch (${valor}) {\n\tcase ${1}:\n\t\t${}\n\t\tbreak;\n\tdefault:\n\t\tbreak;\n}" },
  { linguagem: "javascript", atalho: "try", descricao: "try / catch", corpo: "try {\n\t${}\n} catch (erro) {\n\tconsole.error(erro);\n}" },
  { linguagem: "javascript", atalho: "pegar", descricao: "querySelector", corpo: 'const ${elemento} = document.querySelector("${seletor}");' },
  { linguagem: "javascript", atalho: "pegartodos", descricao: "querySelectorAll", corpo: 'const ${elementos} = document.querySelectorAll("${seletor}");' },
  { linguagem: "javascript", atalho: "clique", descricao: "escutar clique", corpo: '${elemento}.addEventListener("click", () => {\n\t${}\n});' },
  { linguagem: "javascript", atalho: "evento", descricao: "addEventListener", corpo: '${alvo}.addEventListener("${evento}", (e) => {\n\t${}\n});' },
  { linguagem: "javascript", atalho: "criar", descricao: "createElement", corpo: 'const ${elemento} = document.createElement("${div}");' },
  { linguagem: "javascript", atalho: "classe", descricao: "classe", corpo: "class ${Nome} {\n\tconstructor(${parametros}) {\n\t\t${}\n\t}\n}" },
  { linguagem: "javascript", atalho: "map", descricao: "map", corpo: "const ${novo} = ${lista}.map((${item}) => ${item});" },
  { linguagem: "javascript", atalho: "filter", descricao: "filter", corpo: "const ${novo} = ${lista}.filter((${item}) => ${condicao});" },
  { linguagem: "javascript", atalho: "reduce", descricao: "reduce", corpo: "const ${total} = ${lista}.reduce((soma, ${item}) => soma + ${item}, 0);" },
  { linguagem: "javascript", atalho: "espera", descricao: "setTimeout", corpo: "setTimeout(() => {\n\t${}\n}, ${1000});" },
  { linguagem: "javascript", atalho: "intervalo", descricao: "setInterval", corpo: "const ${id} = setInterval(() => {\n\t${}\n}, ${1000});" },
  { linguagem: "javascript", atalho: "assincrona", descricao: "função async", corpo: "async function ${nome}() {\n\ttry {\n\t\t${}\n\t} catch (erro) {\n\t\tconsole.error(erro);\n\t}\n}" },
  { linguagem: "javascript", atalho: "sorteio", descricao: "número aleatório", corpo: "const ${numero} = Math.floor(Math.random() * ${10});" },
  { linguagem: "javascript", atalho: "carregou", descricao: "esperar o DOM", corpo: 'document.addEventListener("DOMContentLoaded", () => {\n\t${}\n});' },

  // ---- CSS ----
  { linguagem: "css", atalho: "centro", descricao: "centralizar com grid", corpo: "display: grid;\nplace-items: center;" },
  { linguagem: "css", atalho: "flexlinha", descricao: "flex em linha", corpo: "display: flex;\nalign-items: center;\ngap: ${12px};" },
  { linguagem: "css", atalho: "flexcoluna", descricao: "flex em coluna", corpo: "display: flex;\nflex-direction: column;\ngap: ${12px};" },
  { linguagem: "css", atalho: "grade", descricao: "grid responsivo", corpo: "display: grid;\ngrid-template-columns: repeat(auto-fit, minmax(${200px}, 1fr));\ngap: ${16px};" },
  { linguagem: "css", atalho: "transicao", descricao: "transição", corpo: "transition: ${all} ${200ms} ease;" },
  { linguagem: "css", atalho: "sombra", descricao: "sombra", corpo: "box-shadow: 0 ${4px} ${12px} rgba(0, 0, 0, ${0.15});" },
  { linguagem: "css", atalho: "celular", descricao: "media query", corpo: "@media (max-width: ${640px}) {\n\t${}\n}" },
  { linguagem: "css", atalho: "animacao", descricao: "keyframes", corpo: "@keyframes ${nome} {\n\tfrom { ${opacity: 0}; }\n\tto { ${opacity: 1}; }\n}" },
  { linguagem: "css", atalho: "variaveis", descricao: "variáveis no :root", corpo: ":root {\n\t--${cor}: ${#1892ff};\n}" },
  { linguagem: "css", atalho: "degrade", descricao: "gradiente", corpo: "background: linear-gradient(${135deg}, ${#1892ff}, ${#7a3bbf});" },
  { linguagem: "css", atalho: "zerar", descricao: "reset básico", corpo: "* {\n\tmargin: 0;\n\tpadding: 0;\n\tbox-sizing: border-box;\n}" },

  // ---- HTML ----
  // O "!" do Emmet continua valendo; estes são os pedaços que o Emmet não dá.
  { linguagem: "html", atalho: "tabela", descricao: "tabela com cabeçalho", corpo: "<table>\n\t<thead>\n\t\t<tr><th>${Coluna}</th></tr>\n\t</thead>\n\t<tbody>\n\t\t<tr><td>${valor}</td></tr>\n\t</tbody>\n</table>" },
  { linguagem: "html", atalho: "formulario", descricao: "formulário com label", corpo: '<form>\n\t<label for="${campo}">${Rótulo}</label>\n\t<input id="${campo}" name="${campo}" type="${text}">\n\t<button type="submit">Enviar</button>\n</form>' },
  { linguagem: "html", atalho: "lista", descricao: "lista", corpo: "<ul>\n\t<li>${item}</li>\n</ul>" },
  { linguagem: "html", atalho: "imagem", descricao: "imagem com alt", corpo: '<img src="${caminho}" alt="${descrição}">' },
  { linguagem: "html", atalho: "link", descricao: "link", corpo: '<a href="${endereço}">${texto}</a>' },
  { linguagem: "html", atalho: "botao", descricao: "botão com id", corpo: '<button id="${acao}" type="button">${Clique}</button>' },
  { linguagem: "html", atalho: "canvas", descricao: "canvas", corpo: '<canvas id="${tela}" width="${400}" height="${300}"></canvas>' },
  { linguagem: "html", atalho: "video", descricao: "vídeo", corpo: '<video src="${caminho}" controls></video>' },
];

export function paraCompletion(snippet: Snippet): Completion {
  return snippetCompletion(snippet.corpo, {
    label: snippet.atalho,
    detail: snippet.descricao,
    type: "snippet",
    // Acima do autocomplete normal: quem digitou "for" quase sempre quer o laço.
    boost: 40,
  });
}

// ---- Snippets do próprio usuário ----

const CHAVE = "zulcode:playground-snippets:v1";

export type SnippetSalvo = Snippet & { id: string };

export function lerSnippets(): SnippetSalvo[] {
  if (typeof window === "undefined") return [];
  try {
    const cru: unknown = JSON.parse(localStorage.getItem(CHAVE) ?? "[]");
    if (!Array.isArray(cru)) return [];
    return cru.filter((item): item is SnippetSalvo =>
      !!item && typeof item === "object" &&
      typeof (item as SnippetSalvo).id === "string" &&
      typeof (item as SnippetSalvo).atalho === "string" &&
      typeof (item as SnippetSalvo).corpo === "string" &&
      ["html", "css", "javascript"].includes((item as SnippetSalvo).linguagem));
  } catch {
    return [];
  }
}

export function salvarSnippets(lista: SnippetSalvo[]) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(lista.slice(0, 200)));
    return true;
  } catch {
    return false;
  }
}
