import type { Linguagem } from "./tipos";

/** Prettier carregado só quando alguém pede para formatar: são cerca de 1 MB de
 *  parsers, e a maioria das sessões nunca aperta o botão. O `import()` fica
 *  dentro da função de propósito — mover para o topo colocaria esse peso no
 *  carregamento da página. */

type Formatador = (codigo: string, parser: string) => Promise<string>;

let carregando: Promise<Formatador> | null = null;

function carregar() {
  carregando ??= (async () => {
    const [prettier, html, postcss, babel, estree] = await Promise.all([
      import("prettier/standalone"),
      import("prettier/plugins/html"),
      import("prettier/plugins/postcss"),
      import("prettier/plugins/babel"),
      import("prettier/plugins/estree"),
    ]);
    const plugins = [html, postcss, babel, estree.default ?? estree];
    return (codigo, parser) => prettier.format(codigo, {
      parser,
      plugins,
      printWidth: 80,
      tabWidth: 2,
      semi: true,
      singleQuote: false,
      // O aluno escreve HTML com uma tag por linha; juntar as tags por causa de
      // espaço em branco significativo confundiria mais do que ajudaria.
      htmlWhitespaceSensitivity: "ignore",
    });
  })();
  return carregando;
}

/** O Prettier não formata Python: nesse caso a resposta é um aviso, não um erro de sintaxe. */
const PARSERS: Record<Linguagem, string | null> = {
  html: "html",
  css: "css",
  javascript: "babel",
  python: null,
};

/** Etiqueta de texto em vez de um booleano `ok`: este projeto compila com
 *  `strict: false`, e sem `strictNullChecks` o TypeScript nao estreita uniao
 *  pela verdade de um booleano literal. Com `tipo === "erro"` o estreitamento
 *  funciona nos dois modos. */
export type ResultadoFormatacao =
  | { tipo: "ok"; codigo: string }
  | { tipo: "erro"; mensagem: string };

export async function formatar(codigo: string, linguagem: Linguagem): Promise<ResultadoFormatacao> {
  const parser = PARSERS[linguagem];
  if (!parser) return { tipo: "erro", mensagem: "Formatar ainda não funciona em Python." };
  try {
    const formatador = await carregar();
    return { tipo: "ok", codigo: await formatador(codigo, parser) };
  } catch (erro) {
    // Quase sempre é erro de sintaxe: o Prettier precisa entender o código para
    // reescrevê-lo. A mensagem dele aponta a linha, então vale repassar.
    const bruta = erro instanceof Error ? erro.message : String(erro);
    return { tipo: "erro", mensagem: `Não deu para formatar: ${bruta.split("\n")[0]}` };
  }
}
