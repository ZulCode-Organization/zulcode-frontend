import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { COOKIE_DO_IDIOMA, idiomaInicial, type Idioma } from "./idiomas";
import pt from "./mensagens/pt";
import en from "./mensagens/en";
import es from "./mensagens/es";

type Arvore = { [chave: string]: string | Arvore };

// O português é a referência; as outras línguas são mescladas por cima dele.
const OUTRAS: Record<Exclude<Idioma, "pt">, Arvore> = { en, es };

/**
 * Monta, a cada pedido, a língua e os textos da tela.
 *
 * A língua é a do cookie, ou, na primeira visita, a do aparelho (ver
 * `idiomaInicial`). Como ela depende do cabeçalho do pedido, a tela nunca é
 * guardada em cache entre pessoas.
 *
 * O inglês é mesclado por cima do português: um texto que ainda não foi
 * traduzido aparece em português, e não como a chave crua
 * ("configuracoes.titulo"). O script `scripts/conferir-traducoes.mjs` avisa no
 * build quais faltam.
 */
export default getRequestConfig(async () => {
  const escolhido = (await cookies()).get(COOKIE_DO_IDIOMA)?.value;
  const idioma = idiomaInicial(escolhido, (await headers()).get("accept-language"));
  return {
    locale: idioma,
    messages: idioma === "pt" ? pt : mesclar(pt, OUTRAS[idioma]),
    // Datas e horas do app são as do Brasil, onde a ofensiva vira o dia.
    timeZone: "America/Sao_Paulo",
  };
});

function mesclar<T extends Arvore>(base: T, por: Arvore): T {
  const resultado: Arvore = { ...base };
  for (const [chave, valor] of Object.entries(por)) {
    const atual = resultado[chave];
    resultado[chave] = typeof valor === "object" && typeof atual === "object" ? mesclar(atual, valor) : valor;
  }
  return resultado as T;
}
