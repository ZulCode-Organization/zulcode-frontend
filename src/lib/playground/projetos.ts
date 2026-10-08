import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";
import type { Arquivo, Modo, Projeto, ProjetoResumo, Versao } from "./tipos";
import { novoId } from "./arquivos";

/** Conversa com /playground/projects. Mantém o vocabulário do app em português
 *  e converte na fronteira: o servidor fala `name`/`files`, a tela fala
 *  `nome`/`arquivos`. */

type ArquivoDaApi = { nome: string; conteudo: string };

type ProjetoDaApi = {
  id: string;
  nome: string;
  modo: Modo;
  arquivos: ArquivoDaApi[];
  bibliotecas: string[];
  slugPublico: string | null;
  criadoEm: string;
  atualizadoEm: string;
};

export type ProjetoPublico = {
  nome: string;
  modo: Modo;
  arquivos: Arquivo[];
  bibliotecas: string[];
  atualizadoEm: string;
  autor: { nome: string; avatarId: string };
};

function token() {
  const guardado = typeof window === "undefined" ? null : localStorage.getItem("accessToken");
  if (!guardado) throw new Error("Entre na sua conta para guardar projetos.");
  return guardado;
}

async function pedir<T>(caminho: string, init: RequestInit = {}, comToken = true): Promise<T> {
  const resposta = await fetchComTimeout(`${API_BASE_URL}${caminho}`, {
    ...init,
    headers: {
      ...(comToken ? { Authorization: `Bearer ${token()}` } : {}),
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  const corpo: unknown = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    // A mensagem do backend é específica — qual arquivo tem nome repetido, qual
    // limite estourou. Trocar por um texto genérico aqui só esconderia isso.
    const mensagem = corpo && typeof corpo === "object" && "message" in corpo
      ? String((corpo as { message: unknown }).message)
      : "Não foi possível falar com o servidor.";
    throw new Error(mensagem);
  }
  return corpo as T;
}

/** O id de arquivo é do navegador, não do servidor: serve para o React e para
 *  o editor acompanharem a aba certa, e é recriado a cada abertura. */
function paraProjeto(cru: ProjetoDaApi): Projeto {
  return {
    id: cru.id,
    nome: cru.nome,
    modo: cru.modo,
    bibliotecas: cru.bibliotecas,
    slugPublico: cru.slugPublico,
    arquivos: cru.arquivos.map((arquivo) => ({ id: novoId(), ...arquivo })),
  };
}

function paraApi(projeto: Projeto) {
  return {
    name: projeto.nome,
    mode: projeto.modo,
    files: projeto.arquivos.map(({ nome, conteudo }) => ({ nome, conteudo })),
    libraries: projeto.bibliotecas,
  };
}

export async function listarProjetos(): Promise<ProjetoResumo[]> {
  return pedir<ProjetoResumo[]>("/playground/projects");
}

export async function criarProjeto(projeto: Projeto): Promise<Projeto> {
  const cru = await pedir<ProjetoDaApi>("/playground/projects", {
    method: "POST",
    body: JSON.stringify(paraApi(projeto)),
  });
  return paraProjeto(cru);
}

export async function abrirProjeto(id: string): Promise<Projeto> {
  return paraProjeto(await pedir<ProjetoDaApi>(`/playground/projects/${id}`));
}

/** Salvar aceita partes: renomear não reenvia os arquivos. */
export async function salvarProjeto(
  id: string,
  partes: Partial<Pick<Projeto, "nome" | "modo" | "arquivos" | "bibliotecas">>,
): Promise<Projeto> {
  const corpo: Record<string, unknown> = {};
  if (partes.nome !== undefined) corpo.name = partes.nome;
  if (partes.modo !== undefined) corpo.mode = partes.modo;
  if (partes.bibliotecas !== undefined) corpo.libraries = partes.bibliotecas;
  if (partes.arquivos !== undefined) {
    corpo.files = partes.arquivos.map(({ nome, conteudo }) => ({ nome, conteudo }));
  }
  const cru = await pedir<ProjetoDaApi>(`/playground/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(corpo),
  });
  return paraProjeto(cru);
}

export async function duplicarProjeto(id: string): Promise<Projeto> {
  return paraProjeto(await pedir<ProjetoDaApi>(`/playground/projects/${id}/duplicar`, { method: "POST" }));
}

export async function apagarProjeto(id: string) {
  await pedir<{ apagado: boolean }>(`/playground/projects/${id}`, { method: "DELETE" });
}

export async function listarVersoes(id: string): Promise<Versao[]> {
  return pedir<Versao[]>(`/playground/projects/${id}/versoes`);
}

export async function restaurarVersao(id: string, versaoId: string): Promise<Projeto> {
  return paraProjeto(await pedir<ProjetoDaApi>(
    `/playground/projects/${id}/versoes/${versaoId}/restaurar`,
    { method: "POST" },
  ));
}

export async function compartilhar(id: string) {
  return pedir<{ slugPublico: string }>(`/playground/projects/${id}/compartilhar`, { method: "POST" });
}

export async function pararDeCompartilhar(id: string) {
  return pedir<{ slugPublico: null }>(`/playground/projects/${id}/compartilhar`, { method: "DELETE" });
}

/** Sem token: é o que um link público significa. */
export async function verPublico(slug: string): Promise<ProjetoPublico> {
  const cru = await pedir<Omit<ProjetoPublico, "arquivos"> & { arquivos: ArquivoDaApi[] }>(
    `/playground/public/${slug}`, {}, false,
  );
  return { ...cru, arquivos: cru.arquivos.map((arquivo) => ({ id: novoId(), ...arquivo })) };
}

export async function remixar(slug: string): Promise<Projeto> {
  return paraProjeto(await pedir<ProjetoDaApi>(`/playground/projects/remix/${slug}`, { method: "POST" }));
}
