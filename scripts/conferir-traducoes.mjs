/**
 * Confere se cada texto em português tem a versão em inglês, e o contrário.
 *
 * Roda antes do build. Não trava nada: o app mostra o português no lugar de
 * um texto que falta (ver `src/i18n/request.ts`). Só avisa, para a lista não
 * crescer sem ninguém ver. Com `--estrito`, falha quando falta algo.
 */
import { readdir, readFile } from "node:fs/promises";

const RAIZ = new URL("../src/i18n/mensagens/", import.meta.url);
const estrito = process.argv.includes("--estrito");

async function chaves(idioma) {
  const pasta = new URL(`${idioma}/`, RAIZ);
  const resultado = new Set();
  for (const arquivo of (await readdir(pasta)).filter((a) => a.endsWith(".json")).sort()) {
    const area = arquivo.replace(/\.json$/, "");
    const conteudo = JSON.parse(await readFile(new URL(arquivo, pasta), "utf8"));
    const percorrer = (no, prefixo) => {
      for (const [chave, valor] of Object.entries(no)) {
        const caminho = `${prefixo}.${chave}`;
        if (valor && typeof valor === "object") percorrer(valor, caminho);
        else resultado.add(caminho);
      }
    };
    percorrer(conteudo, area);
  }
  return resultado;
}

const pt = await chaves("pt");
const en = await chaves("en");
const semIngles = [...pt].filter((c) => !en.has(c));
const soNoIngles = [...en].filter((c) => !pt.has(c));

if (!semIngles.length && !soNoIngles.length) {
  console.log(`traduções: ${pt.size} textos, todos em português e inglês.`);
} else {
  if (semIngles.length) console.warn(`traduções: ${semIngles.length} sem inglês (aparecem em português):\n  ${semIngles.slice(0, 30).join("\n  ")}${semIngles.length > 30 ? "\n  ..." : ""}`);
  if (soNoIngles.length) console.warn(`traduções: ${soNoIngles.length} só no inglês (sobraram de algo apagado?):\n  ${soNoIngles.slice(0, 30).join("\n  ")}`);
  if (estrito) process.exit(1);
}

