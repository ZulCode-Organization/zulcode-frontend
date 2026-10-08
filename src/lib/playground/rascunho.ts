import { novoId, projetoVazio } from "./arquivos";
import type { Arquivo, Projeto } from "./tipos";

/** O rascunho local: o que está na tela agora, salvo neste aparelho.
 *
 *  Existe junto com os projetos do servidor, não no lugar deles. Fechar a aba
 *  sem salvar, ou mexer sem estar logado, não pode custar o trabalho — e o
 *  servidor só guarda o que a pessoa pediu para guardar. */

const CHAVE = "zulcode:playground-rascunho:v2";
/** O formato antigo, de três arquivos fixos. Lido uma vez para converter. */
const CHAVE_ANTIGA = "zulcode:playground-web-draft:v1";
const CHAVE_MAIS_ANTIGA = "zulcode:playground-draft";

type Guardado = { projeto: Projeto; emQue: number };

function textoOuVazio(valor: unknown) {
  return typeof valor === "string" ? valor : "";
}

function arquivosValidos(valor: unknown): Arquivo[] | null {
  if (!Array.isArray(valor) || !valor.length) return null;
  const arquivos = valor.flatMap((item): Arquivo[] => {
    if (!item || typeof item !== "object") return [];
    const registro = item as Record<string, unknown>;
    return typeof registro.nome === "string" && typeof registro.conteudo === "string"
      ? [{ id: typeof registro.id === "string" ? registro.id : novoId(), nome: registro.nome, conteudo: registro.conteudo }]
      : [];
  });
  return arquivos.length ? arquivos : null;
}

/** Converte o rascunho de três arquivos fixos para a lista de arquivos. Sem
 *  isto, quem já tinha código na tela abriria o playground novo em branco. */
function converterAntigo(): Projeto | null {
  for (const chave of [CHAVE_ANTIGA, CHAVE_MAIS_ANTIGA]) {
    try {
      const cru = localStorage.getItem(chave);
      if (!cru) continue;
      const item: unknown = JSON.parse(cru);
      if (!item || typeof item !== "object") continue;
      const velho = item as Record<string, unknown>;
      const html = textoOuVazio(velho.html);
      const css = textoOuVazio(velho.css);
      const js = textoOuVazio(velho.javascript)
        || (velho.language === "javascript" ? textoOuVazio(velho.source) : "");
      if (!html && !css && !js) continue;
      return {
        id: null,
        nome: "Rascunho recuperado",
        modo: "web",
        bibliotecas: [],
        slugPublico: null,
        arquivos: [
          { id: novoId(), nome: "index.html", conteudo: html },
          { id: novoId(), nome: "style.css", conteudo: css },
          { id: novoId(), nome: "script.js", conteudo: js },
        ],
      };
    } catch {
      // Rascunho ilegível é o mesmo que rascunho inexistente.
    }
  }
  return null;
}

export function lerRascunho(): Projeto {
  if (typeof window === "undefined") return projetoVazio("web");
  try {
    const cru = localStorage.getItem(CHAVE);
    if (cru) {
      const item: unknown = JSON.parse(cru);
      const guardado = item as Partial<Guardado> | null;
      const projeto = guardado?.projeto;
      const arquivos = arquivosValidos(projeto?.arquivos);
      if (projeto && arquivos) {
        return {
          id: typeof projeto.id === "string" ? projeto.id : null,
          nome: typeof projeto.nome === "string" ? projeto.nome : "Meu projeto",
          modo: projeto.modo === "js" ? "js" : "web",
          bibliotecas: Array.isArray(projeto.bibliotecas)
            ? projeto.bibliotecas.filter((id): id is string => typeof id === "string")
            : [],
          slugPublico: typeof projeto.slugPublico === "string" ? projeto.slugPublico : null,
          arquivos,
        };
      }
    }
    const convertido = converterAntigo();
    if (convertido) {
      localStorage.removeItem(CHAVE_ANTIGA);
      localStorage.removeItem(CHAVE_MAIS_ANTIGA);
      return convertido;
    }
  } catch {
    // Cai no projeto de exemplo.
  }
  return projetoVazio("web");
}

export function salvarRascunho(projeto: Projeto) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify({ projeto, emQue: Date.now() } satisfies Guardado));
    return true;
  } catch {
    // Aparelho sem espaço ou aba privada. Quem está programando precisa saber,
    // então quem chamou decide o que mostrar.
    return false;
  }
}

export function limparRascunho() {
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    // Nada a fazer: se não dá para escrever, também não dá para apagar.
  }
}
