import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { COOKIE_DO_IDIOMA, idiomaValido } from "./idiomas";
import pt from "./mensagens/pt";
import en from "./mensagens/en";

/**
 * Monta, a cada pedido, a língua e os textos da tela.
 *
 * O inglês é mesclado por cima do português: um texto que ainda não foi
 * traduzido aparece em português, e não como a chave crua
 * ("configuracoes.titulo"). O script `scripts/conferir-traducoes.mjs` avisa no
 * build quais faltam.
 */
export default getRequestConfig(async () => {
  const idioma = idiomaValido((await cookies()).get(COOKIE_DO_IDIOMA)?.value);
  return {
    locale: idioma,
    messages: idioma === "en" ? mesclar(pt, en) : pt,
    // Datas e horas do app são as do Brasil, onde a ofensiva vira o dia.
    timeZone: "America/Sao_Paulo",
  };
});

type Arvore = { [chave: string]: string | Arvore };

function mesclar<T extends Arvore>(base: T, por: Arvore): T {
  const resultado: Arvore = { ...base };
  for (const [chave, valor] of Object.entries(por)) {
    const atual = resultado[chave];
    resultado[chave] = typeof valor === "object" && typeof atual === "object" ? mesclar(atual, valor) : valor;
  }
  return resultado as T;
}
