"use client";

import { API_BASE_URL, fetchComTimeout } from "./api-config";

export type Raridade = "comum" | "raro" | "epico" | "lendario";
export type ItemDoBarril = "pena" | "escudo" | "gas" | "xpEmDobro";

/** Um barril ainda fechado. A origem diz de onde veio (ex.: "ofensiva-30"). */
export interface Barril {
  id: string;
  raridade: Raridade;
  origem: string;
}

export interface ConteudoDoBarril {
  rupees: number;
  itens: { item: ItemDoBarril; quantidade: number }[];
}

/** As cores de cada raridade: o brilho da tela e o anel do barril. */
export const COR_DA_RARIDADE: Record<Raridade, string> = {
  comum: "#a16207",
  raro: "#2563eb",
  epico: "#9333ea",
  lendario: "#f59e0b",
};

async function pedir<T>(caminho: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("accessToken");
  if (!token) throw new Error("Sua sessão expirou. Entre de novo.");
  const resposta = await fetchComTimeout(`${API_BASE_URL}${caminho}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...init.headers },
  });
  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok) throw new Error(corpo?.message ?? "Não deu certo agora. Tente de novo.");
  return corpo as T;
}

export const barrisFechados = () =>
  pedir<{ barris: Barril[]; chances: Record<Raridade, number> }>("/user/barris");

export const abrirBarril = (id: string) =>
  pedir<{ raridade: Raridade; conteudo: ConteudoDoBarril }>(`/user/barris/${id}/abrir`, { method: "POST" });
