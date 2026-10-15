"use client";

import { API_BASE_URL, fetchComTimeout } from "./api-config";

/** Um amigo (alguém que você segue) com o estado da ofensiva dele hoje. */
export interface AmigoNaOfensiva {
  id: string;
  nome: string;
  avatarId: string;
  bannerColor: string | null;
  ofensiva: number;
  estudouHoje: boolean;
  /** Tem ofensiva e ainda não estudou hoje: dá para cutucar. */
  emRisco: boolean;
  cutucadoHoje?: boolean;
}

export interface Dupla {
  id: string;
  status: "pendente" | "ativa";
  /** O convite chegou para mim: aceito ou recuso. */
  conviteRecebido: boolean;
  dias: number;
  recorde: number;
  euHoje: boolean;
  amigo: AmigoNaOfensiva;
}

async function pedir<T>(caminho: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("accessToken");
  if (!token) throw new Error("Sua sessão expirou. Entre de novo.");
  const resposta = await fetchComTimeout(`${API_BASE_URL}${caminho}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers },
  });
  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok) throw new Error(corpo?.message ?? "Não deu certo agora. Tente de novo.");
  return corpo as T;
}

export const listarAmigosNaOfensiva = () => pedir<AmigoNaOfensiva[]>("/user/ofensiva/amigos");
export const cutucar = (amigoId: string) => pedir<{ ok: true }>(`/user/ofensiva/amigos/${amigoId}/cutucar`, { method: "POST" });
export const listarDuplas = () => pedir<Dupla[]>("/user/ofensiva/duplas");
export const convidarParaDupla = (amigoId: string) =>
  pedir<{ id: string }>("/user/ofensiva/duplas", { method: "POST", body: JSON.stringify({ amigoId }) });
export const responderDupla = (id: string, aceitar: boolean) =>
  pedir<{ ok: true }>(`/user/ofensiva/duplas/${id}/${aceitar ? "aceitar" : "recusar"}`, { method: "POST" });
export const encerrarDupla = (id: string) => pedir<{ ok: true }>(`/user/ofensiva/duplas/${id}`, { method: "DELETE" });
