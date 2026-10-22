/**
 * Confere se cada texto em português tem a versão em cada outra língua, e o
 * contrário.
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

const NOMES = { en: "inglês", es: "espanhol" };
const pt = await chaves("pt");
let faltou = false;

for (const idioma of Object.keys(NOMES)) {
  const outra = await chaves(idioma);
  const semTraducao = [...pt].filter((c) => !outra.has(c));
  const sobrando = [...outra].filter((c) => !pt.has(c));

  if (!semTraducao.length && !sobrando.length) {
    console.log(`traduções: ${pt.size} textos, todos em português e ${NOMES[idioma]}.`);
    continue;
  }
  faltou = true;
  if (semTraducao.length) console.warn(`traduções: ${semTraducao.length} sem ${NOMES[idioma]} (aparecem em português):\n  ${semTraducao.slice(0, 30).join("\n  ")}${semTraducao.length > 30 ? "\n  ..." : ""}`);
  if (sobrando.length) console.warn(`traduções: ${sobrando.length} só em ${NOMES[idioma]} (sobraram de algo apagado?):\n  ${sobrando.slice(0, 30).join("\n  ")}`);
}

if (faltou && estrito) process.exit(1);
