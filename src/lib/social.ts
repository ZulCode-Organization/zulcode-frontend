import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";

/** Uma pessoa numa lista de seguidores/seguindo, como o backend devolve. */
export interface PessoaSocial {
  id: string;
  name: string;
  publicCode: string;
  avatarId?: string;
  bannerColor?: string | null;
  isVerified?: boolean;
  xp: number;
  nivel: number;
  nivelLabel: string;
}

/** O que o backend responde depois de seguir ou deixar de seguir: ja traz os
 * numeros atualizados, entao a tela nao precisa de um segundo pedido. */
export interface EstadoSeguir {
  id: string;
  seguindo: number;
  seguidores: number;
  euSigo: boolean;
}

function autorizacao() {
  const token = typeof window === "undefined" ? null : localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : null;
}

async function pedir<T>(caminho: string, metodo: "GET" | "POST" | "DELETE" = "GET"): Promise<T> {
  const headers = autorizacao();
  if (!headers) throw new Error("Sem sessão");
  const resposta = await fetchComTimeout(`${API_BASE_URL}${caminho}`, { method: metodo, headers });
  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => null);
    throw new Error(corpo?.message ?? "Não foi possível completar a ação");
  }
  return resposta.json();
}

export const seguir = (id: string) => pedir<EstadoSeguir>(`/follows/${id}`, "POST");
export const deixarDeSeguir = (id: string) => pedir<EstadoSeguir>(`/follows/${id}`, "DELETE");
export const idsQueSigo = () => pedir<{ seguindo: string[] }>("/follows/me");
export const listarSeguindo = (id: string) => pedir<PessoaSocial[]>(`/follows/${id}/seguindo`);
export const listarSeguidores = (id: string) => pedir<PessoaSocial[]>(`/follows/${id}/seguidores`);
