/**
 * As línguas do app.
 *
 * A escolhida mora num cookie, e não na URL: o ZulCode é um app, as pessoas
 * não compartilham links de telas, e trocar de língua não deveria mudar
 * endereço nenhum. Ela também fica salva na conta (`idioma` no perfil), para
 * acompanhar a pessoa em outro aparelho e para os avisos do servidor saírem na
 * língua certa. Sem cookie e sem conta, vale a língua do aparelho (ver
 * `idiomaInicial`).
 */
export const IDIOMAS = ["pt", "en", "es"] as const;
export type Idioma = (typeof IDIOMAS)[number];

export const IDIOMA_PADRAO: Idioma = "pt";
export const COOKIE_DO_IDIOMA = "zc_idioma";

/**
 * O nome de cada língua escrito nela mesma, como em qualquer seletor de
 * idioma: quem procura "English" não está lendo português.
 */
export const NOME_DO_IDIOMA: Record<Idioma, string> = { pt: "Português", en: "English", es: "Español" };

/** O `lang` do HTML: leitores de tela e o corretor do teclado usam isto. */
export const LANG_DO_HTML: Record<Idioma, string> = { pt: "pt-BR", en: "en", es: "es" };

/**
 * A língua de quem chega: a escolhida no aparelho (cookie) vence; sem ela,
 * a do sistema, lida do `Accept-Language`.
 */
export function idiomaInicial(escolhido: string | undefined, cabecalho: string | null): Idioma {
  return IDIOMAS.includes(escolhido as Idioma) ? (escolhido as Idioma) : idiomaDoAparelho(cabecalho);
}

/**
 * Lê o `Accept-Language` (ex.: `en-US,en;q=0.9,pt;q=0.8`) e devolve a primeira
 * língua que o app tem, na ordem de preferência. Se nenhuma for do app, o
 * português. Quem manda esse cabeçalho é o navegador e a WebView do Android,
 * com a língua do sistema.
 */
export function idiomaDoAparelho(cabecalho: string | null): Idioma {
  if (!cabecalho) return IDIOMA_PADRAO;
  const pedidos = cabecalho
    .split(",")
    .map((item, ordem) => {
      const [codigo, ...parametros] = item.trim().split(";");
      const q = parametros.map((p) => p.trim()).find((p) => p.startsWith("q="));
      return { lingua: codigo.trim().toLowerCase().split("-")[0], peso: q ? Number(q.slice(2)) : 1, ordem };
    })
    .filter((pedido) => pedido.peso > 0)
    .sort((a, b) => b.peso - a.peso || a.ordem - b.ordem);
  const achado = pedidos.find((pedido) => IDIOMAS.includes(pedido.lingua as Idioma));
  return achado ? (achado.lingua as Idioma) : IDIOMA_PADRAO;
}
