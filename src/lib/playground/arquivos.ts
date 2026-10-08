import { urlsDeEstilo, urlsDeScript } from "./bibliotecas";
import type { Arquivo, Linguagem, Modo, Projeto } from "./tipos";

export const MAX_ARQUIVOS = 30;
export const MAX_TAMANHO = 100_000;

const EXTENSOES: Record<string, Linguagem> = {
  html: "html",
  htm: "html",
  css: "css",
  js: "javascript",
  mjs: "javascript",
};

export function linguagemDe(nome: string): Linguagem {
  const extensao = nome.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSOES[extensao] ?? "javascript";
}

export function extensaoValida(nome: string) {
  return (nome.split(".").pop()?.toLowerCase() ?? "") in EXTENSOES;
}

/** Devolve a mensagem do problema, ou null se o nome serve. Nome de arquivo é
 *  usado em sourceURL e no .zip exportado, por isso a regra é estreita. */
export function erroDeNome(nome: string, existentes: Arquivo[], ignorarId?: string) {
  const limpo = nome.trim();
  if (!limpo) return "Dê um nome ao arquivo.";
  if (limpo.length > 40) return "No máximo 40 caracteres.";
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(limpo)) {
    return "Use letras, números, ponto, hífen e sublinhado — sem espaço nem barra.";
  }
  if (!extensaoValida(limpo)) return "Termine em .html, .css ou .js.";
  if (existentes.some((arquivo) => arquivo.id !== ignorarId && arquivo.nome.toLowerCase() === limpo.toLowerCase())) {
    return "Já existe um arquivo com esse nome.";
  }
  return null;
}

export function novoId() {
  return crypto.randomUUID();
}

function porLinguagem(projeto: Projeto, linguagem: Linguagem) {
  return projeto.arquivos.filter((arquivo) => linguagemDe(arquivo.nome) === linguagem);
}

/** O .html de entrada é o primeiro da lista — a mesma regra que decide a ordem
 *  de injeção dos outros arquivos, para não ter duas regras concorrentes. */
export function arquivoDeEntrada(projeto: Projeto) {
  return porLinguagem(projeto, "html")[0] ?? null;
}

const PAGINA_DO_MODO_JS = `<main id="saida">
  <h1>Modo JavaScript</h1>
  <p>O resultado aparece no console.</p>
</main>
<style>
  body { margin: 0; display: grid; place-items: center; min-height: 100vh;
         font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; }
  h1 { font-size: 1.1rem; } p { color: #94a3b8; font-size: .85rem; }
</style>`;

/** O formato que o preview espera. Em modo "js" a página é nossa: o aluno não
 *  precisa escrever HTML para testar um `for`. */
export function paraOPreview(projeto: Projeto) {
  const estilos = urlsDeEstilo(projeto.bibliotecas)
    .map((url) => `<link rel="stylesheet" href="${url}">`)
    .join("\n");
  const entrada = projeto.modo === "js"
    ? PAGINA_DO_MODO_JS
    : (arquivoDeEntrada(projeto)?.conteudo ?? "");

  return {
    html: estilos ? `${estilos}\n${entrada}` : entrada,
    styles: projeto.modo === "js" ? [] : porLinguagem(projeto, "css").map(paraArquivoDoPreview),
    scripts: porLinguagem(projeto, "javascript").map(paraArquivoDoPreview),
    libs: urlsDeScript(projeto.bibliotecas),
  };
}

function paraArquivoDoPreview(arquivo: Arquivo) {
  return { nome: arquivo.nome, codigo: arquivo.conteudo };
}

function escaparParaTag(codigo: string) {
  // Fechar o <script> dentro de uma string do próprio código encerraria a tag
  // no HTML exportado e o resto do arquivo viraria texto na tela.
  return codigo.replaceAll("</script", "<\\/script");
}

/** Um .html sozinho, com tudo embutido: é o que o aluno manda para alguém ver
 *  sem precisar do ZulCode aberto. */
export function htmlUnico(projeto: Projeto) {
  const corpo = projeto.modo === "js" ? PAGINA_DO_MODO_JS : (arquivoDeEntrada(projeto)?.conteudo ?? "");
  const temEsqueleto = /<html[\s>]/i.test(corpo);
  const estilos = [
    ...urlsDeEstilo(projeto.bibliotecas).map((url) => `<link rel="stylesheet" href="${url}">`),
    ...porLinguagem(projeto, "css").map((arquivo) => `<style>\n${arquivo.conteudo}\n</style>`),
  ].join("\n");
  const scripts = [
    ...urlsDeScript(projeto.bibliotecas).map((url) => `<script src="${url}"></script>`),
    ...porLinguagem(projeto, "javascript").map(
      (arquivo) => `<script>\n${escaparParaTag(arquivo.conteudo)}\n</script>`,
    ),
  ].join("\n");

  if (temEsqueleto) {
    // Já tem <html>: respeitamos o documento do aluno e só penduramos o resto.
    return corpo
      .replace(/<\/head>/i, `${estilos}\n</head>`)
      .replace(/<\/body>/i, `${scripts}\n</body>`);
  }
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${projeto.nome}</title>
${estilos}
</head>
<body>
${corpo}
${scripts}
</body>
</html>
`;
}

export function projetoVazio(modo: Modo): Projeto {
  return {
    id: null,
    nome: modo === "js" ? "Exercício de lógica" : "Meu projeto",
    modo,
    bibliotecas: [],
    slugPublico: null,
    arquivos: modo === "js" ? [{ id: novoId(), nome: "script.js", conteudo: EXEMPLO_JS }] : [
      { id: novoId(), nome: "index.html", conteudo: EXEMPLO_HTML },
      { id: novoId(), nome: "style.css", conteudo: EXEMPLO_CSS },
      { id: novoId(), nome: "script.js", conteudo: EXEMPLO_SCRIPT },
    ],
  };
}

const EXEMPLO_HTML = `<main class="cartao">
  <span>PLAYGROUND</span>
  <h1>Olá, ZulCode!</h1>
  <p>Edite os arquivos e veja mudar na hora.</p>
  <button id="acao">Testar console</button>
</main>`;

const EXEMPLO_CSS = `* { box-sizing: border-box; }
body {
  min-height: 100vh;
  margin: 0;
  display: grid;
  place-items: center;
  background: #0f172a;
  color: #f8fafc;
  font-family: system-ui, Arial, sans-serif;
}
.cartao {
  width: min(390px, calc(100% - 32px));
  padding: 28px;
  border: 1px solid #334155;
  border-radius: 20px;
  background: #172033;
}
span { color: #38bdf8; font-size: 12px; font-weight: 800; }
p { color: #a5b4cf; }
button {
  border: 0;
  border-radius: 10px;
  padding: 10px 14px;
  background: #2493ff;
  color: white;
  font-weight: 800;
  cursor: pointer;
}`;

const EXEMPLO_SCRIPT = `const botao = document.querySelector("#acao");

botao.addEventListener("click", () => {
  console.log("Olá do JavaScript!");
});

console.log("Preview carregado.");`;

const EXEMPLO_JS = `// Sem HTML: o resultado sai no console.
const nomes = ["Ana", "Bruno", "Carla"];

for (const nome of nomes) {
  console.log("Oi,", nome);
}

console.log("Total:", nomes.length);`;
