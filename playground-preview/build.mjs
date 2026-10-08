import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const parserPath = require.resolve("acorn");
const parser = await readFile(parserPath, "utf8");
const license = await readFile(join(dirname(parserPath), "..", "LICENSE"), "utf8");
const instrument = (await readFile(join(root, "instrument-loops.mjs"), "utf8")).replace("export function", "function");
const budget = (await readFile(join(root, "loop-budget.mjs"), "utf8")).replace("export function", "function");
const bootstrap = await readFile(join(root, "runtime.js"), "utf8");
// A CSP autoriza o script inline por hash, e quem calcula o hash do outro lado
// é o parser de HTML — que normaliza CRLF para LF antes de olhar o conteúdo.
// Sem esta normalização, um checkout com fim de linha do Windows gera um hash
// que o navegador nunca confirma, e a página do preview fica muda: o script é
// bloqueado inteiro, sem erro visível para quem está usando.
const semCRLF = (texto) => texto.replaceAll("\r\n", "\n");

// Dentro de um <script>, o tokenizador de HTML trata estas três sequências como
// marcas de estado, não como texto. Um `<!--` o coloca em "escaped"; um
// `<script` depois disso o leva a "double escaped", onde o `</script>` deixa de
// fechar a tag — e o elemento engole o resto do documento. O acorn já traz um
// `<!--` em um comentário, então basta alguém escrever "<script" num comentário
// do runtime para a página inteira virar texto de script, o hash da CSP não
// bater mais e o preview ficar mudo, sem erro visível.
//
// `\x3C` é o mesmo "<" para o JavaScript — em comentário, em string, em regex —
// e deixa de ser gatilho para o parser de HTML. Escapar antes de calcular o
// hash é essencial: o navegador confere o hash do texto já escapado.
const semGatilhos = (texto) => texto
  .replaceAll("<!--", "\\x3C!--")
  .replaceAll("<script", "\\x3Cscript")
  .replaceAll("</script", "\\x3C/script");

const runtime = semGatilhos(semCRLF(
  "(function(){const exports = {}; const module = {exports};\n" +
  parser + "\nconst parse = exports.parse;\n" + instrument + "\n" + budget + "\n" + bootstrap + "\n})();"));
if (/<\/script|<script|<!--/i.test(runtime)) {
  throw new Error("Sobrou uma sequência que o parser de HTML trata como marca de estado.");
}
const hash = createHash("sha256").update(runtime).digest("base64");
// Os dois CDNs servem as bibliotecas do catálogo. connect-src continua em
// 'none' de propósito: biblioteca pode entrar, dado não pode sair.
const cdns = "https://cdn.jsdelivr.net https://cdnjs.cloudflare.com";
const policy = [
  "default-src 'none'",
  "script-src 'sha256-" + hash + "' blob: " + cdns,
  "style-src 'unsafe-inline' " + cdns,
  "img-src data: blob: " + cdns,
  "font-src data: " + cdns,
  "connect-src 'none'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join("; ");
const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${policy}">
<title>ZulCode — Preview</title>
</head>
<body>
<p>Este ambiente é carregado pelo playground do ZulCode.</p>
<script>${runtime}</script>
</body>
</html>
`;
const destinations = [join(root, "dist")];
if (process.argv.includes("--app")) {
  destinations.push(join(root, "..", "public", "playground-runtime"));
}
for (const destination of destinations) {
  await mkdir(destination, { recursive: true });
  await writeFile(join(destination, "index.html"), html);
  await writeFile(join(destination, "acorn-LICENSE.txt"), license);
}
console.log("Preview gerado com CSP e hash do runtime.");

await writeFile(join(root, "dist", "_headers"), `/*
  Content-Security-Policy: frame-ancestors https://app.zulcode.com http://localhost:3000 http://127.0.0.1:3000
  Referrer-Policy: no-referrer
  X-Content-Type-Options: nosniff
  Cache-Control: no-store
`);
