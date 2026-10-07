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
const runtime = "(function(){const exports = {}; const module = {exports};\n" +
  parser + "\nconst parse = exports.parse;\n" + instrument + "\n" + budget + "\n" + bootstrap + "\n})();";
if (/<\/script/i.test(runtime)) throw new Error("O bootstrap contém fechamento de script inesperado.");
const hash = createHash("sha256").update(runtime).digest("base64");
const policy = [
  "default-src 'none'",
  "script-src 'sha256-" + hash + "' blob:",
  "style-src 'unsafe-inline'",
  "img-src data:",
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
