"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { API_BASE_URL } from "@/lib/api-config";

/**
 * O acesso do administrativo à API.
 *
 * `pedir` é a chamada autenticada, com o erro do backend já em português.
 * `useDados` busca e guarda em cache por endereço: voltar para uma tela mostra
 * na hora o que já se tinha, e a busca nova acontece por baixo. Enquanto ela
 * roda, a tela continua com os números antigos (esmaecidos), sem esqueleto
 * piscando no lugar de dados que já estavam lá.
 */

export class ErroDaApi extends Error {
  constructor(message: string, public status: number, public corpo: unknown) {
    super(message);
  }
}

function mensagemDe(corpo: unknown, padrao: string) {
  const m = (corpo as { message?: unknown } | null)?.message;
  if (Array.isArray(m)) return m.join(". ");
  if (typeof m === "string") return m;
  return padrao;
}

export async function pedir<T = unknown>(caminho: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const token = typeof window === "undefined" ? null : localStorage.getItem("accessToken");
  if (!token) throw new ErroDaApi("Sua sessão expirou. Entre de novo.", 401, null);
  const { json, ...resto } = init;
  const res = await fetch(`${API_BASE_URL}${caminho}`, {
    ...resto,
    ...(json !== undefined && { body: JSON.stringify(json) }),
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(resto.headers ?? {}) },
  });
  const tipo = res.headers.get("content-type") ?? "";
  const corpo = tipo.includes("application/json") ? await res.json().catch(() => null) : await res.text().catch(() => null);
  if (!res.ok) throw new ErroDaApi(mensagemDe(corpo, "Não foi possível concluir."), res.status, corpo);
  return corpo as T;
}

/** Baixa uma resposta como arquivo (CSV, JSON), com o token, sem abrir aba nova. */
export async function baixar(caminho: string, nomeDoArquivo: string) {
  const token = localStorage.getItem("accessToken");
  const res = await fetch(`${API_BASE_URL}${caminho}`, { headers: { Authorization: `Bearer ${token ?? ""}` } });
  if (!res.ok) throw new ErroDaApi(mensagemDe(await res.json().catch(() => null), "Não foi possível baixar."), res.status, null);
  const blob = await res.blob();
  salvarArquivo(blob, nomeDoArquivo);
}

export function salvarArquivo(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Cache ────────────────────────────────────────────────────────────────

type Entrada = { dados?: unknown; erro?: string; carregando: boolean; quando: number };
const cache = new Map<string, Entrada>();
const ouvintes = new Map<string, Set<() => void>>();
const emVoo = new Map<string, Promise<unknown>>();

function avisar(chave: string) {
  ouvintes.get(chave)?.forEach((f) => f());
}

function definir(chave: string, parcial: Partial<Entrada>) {
  const atual = cache.get(chave) ?? { carregando: false, quando: 0 };
  cache.set(chave, { ...atual, ...parcial });
  avisar(chave);
}

async function buscar(chave: string) {
  if (emVoo.has(chave)) return emVoo.get(chave);
  definir(chave, { carregando: true });
  const promessa = pedir(chave)
    .then((dados) => definir(chave, { dados, erro: undefined, carregando: false, quando: Date.now() }))
    .catch((e: unknown) => definir(chave, { erro: e instanceof Error ? e.message : "Falhou.", carregando: false }))
    .finally(() => emVoo.delete(chave));
  emVoo.set(chave, promessa);
  return promessa;
}

/** Esquece o cache de tudo que começa com este prefixo (ex.: depois de editar uma pessoa). */
export function invalidar(prefixo: string) {
  for (const chave of [...cache.keys()]) {
    if (chave.startsWith(prefixo)) {
      if (ouvintes.get(chave)?.size) void buscar(chave);
      else cache.delete(chave);
    }
  }
}

/** Troca os dados de uma chave sem ir ao servidor (atualização otimista). */
export function trocarNoCache<T>(chave: string, mudar: (atual: T | undefined) => T) {
  definir(chave, { dados: mudar(cache.get(chave)?.dados as T | undefined) });
}

const VAZIO: Entrada = { carregando: true, quando: 0 };

export function useDados<T>(caminho: string | null, { velhoDepoisDe = 30_000 } = {}) {
  const chave = caminho ?? "";
  const assinar = useCallback(
    (avisarReact: () => void) => {
      if (!chave) return () => {};
      if (!ouvintes.has(chave)) ouvintes.set(chave, new Set());
      ouvintes.get(chave)!.add(avisarReact);
      return () => ouvintes.get(chave)?.delete(avisarReact);
    },
    [chave],
  );
  const entrada = useSyncExternalStore(
    assinar,
    () => (chave ? (cache.get(chave) ?? VAZIO) : VAZIO),
    () => VAZIO,
  );

  useEffect(() => {
    if (!chave) return;
    const atual = cache.get(chave);
    if (!atual || (!atual.carregando && Date.now() - atual.quando > velhoDepoisDe)) void buscar(chave);
  }, [chave, velhoDepoisDe]);

  const recarregar = useCallback(() => (chave ? buscar(chave) : Promise.resolve()), [chave]);

  return {
    dados: entrada.dados as T | undefined,
    erro: entrada.erro,
    carregando: entrada.carregando,
    /** Há dados na tela, mas uma busca nova está a caminho. */
    atualizando: entrada.carregando && entrada.dados !== undefined,
    recarregar,
  };
}

/** Monta a query string, pulando o que está vazio. */
export function query(params: Record<string, string | number | boolean | null | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== null && v !== undefined && v !== "") p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
}

/**
 * Um valor que só muda depois que a pessoa para de digitar — é o que a busca
 * usa para não mandar um pedido ao servidor a cada letra.
 */
export function useAtrasado<T>(valor: T, ms = 300) {
  const [atrasado, setAtrasado] = useState(valor);
  const primeiro = useRef(true);
  useEffect(() => {
    if (primeiro.current) {
      primeiro.current = false;
      return;
    }
    const id = setTimeout(() => setAtrasado(valor), ms);
    return () => clearTimeout(id);
  }, [valor, ms]);
  return atrasado;
}
