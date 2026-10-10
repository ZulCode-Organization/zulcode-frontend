/**
 * As línguas do app.
 *
 * A escolhida mora num cookie, e não na URL: o ZulCode é um app, as pessoas
 * não compartilham links de telas, e trocar de língua não deveria mudar
 * endereço nenhum. Ela também fica salva na conta (`idioma` no perfil), para
 * acompanhar a pessoa em outro aparelho e para os avisos do servidor saírem na
 * língua certa.
 */
export const IDIOMAS = ["pt", "en"] as const;
export type Idioma = (typeof IDIOMAS)[number];

export const IDIOMA_PADRAO: Idioma = "pt";
export const COOKIE_DO_IDIOMA = "zc_idioma";

/**
 * O nome de cada língua escrito nela mesma, como em qualquer seletor de
 * idioma: quem procura "English" não está lendo português.
 */
export const NOME_DO_IDIOMA: Record<Idioma, string> = { pt: "Português", en: "English" };

/** O `lang` do HTML: leitores de tela e o corretor do teclado usam isto. */
export const LANG_DO_HTML: Record<Idioma, string> = { pt: "pt-BR", en: "en" };

export function idiomaValido(valor: unknown): Idioma {
  return IDIOMAS.includes(valor as Idioma) ? (valor as Idioma) : IDIOMA_PADRAO;
}
