"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL, fetchComTimeout } from "./api-config";

/**
 * As notificações que a equipe manda pelo administrativo.
 *
 * Elas sempre chegam dentro do app: na caixa de Notificações e no aviso que
 * desce do topo quando a pessoa abre o app. No celular, também como
 * notificação do sistema — mas essa depende do Firebase, e sem ele a caixa
 * continua funcionando.
 */
export interface Notificacao {
  id: string;
  lida: boolean;
  criadaEm: string;
  titulo: string;
  texto: string;
  /** A tela que ela abre; nula, só mostra. */
  rota: string | null;
}

/** Avisa os outros pedaços da tela (o selo do menu, a caixa) que algo mudou. */
const EVENTO = "zulcode:notificacoes";

function cabecalhos() {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  return token ? { Authorization: `Bearer ${token}` } : null;
}

/**
 * Troca {nome} pelo primeiro nome de quem lê. Sem nome, a frase não pode ficar
 * com ", ," nem começar por vírgula. O servidor faz a mesma troca no push.
 */
export function personalizar(texto: string, nome?: string | null) {
  const primeiro = (nome ?? "").trim().split(/\s+/)[0] ?? "";
  if (primeiro) return texto.split("{nome}").join(primeiro);
  return texto.replace(/,\s*\{nome\}/g, "").replace(/\{nome\},?\s*/g, "").trim();
}

/** Só caminhos do próprio app: uma notificação nunca leva para fora dele. */
export function rotaSegura(rota: string | null | undefined) {
  return typeof rota === "string" && rota.startsWith("/") && !rota.startsWith("//") ? rota : null;
}

export async function buscarNotificacoes(): Promise<Notificacao[] | null> {
  const headers = cabecalhos();
  if (!headers) return null;
  try {
    const resposta = await fetchComTimeout(`${API_BASE_URL}/notifications`, { headers });
    if (!resposta.ok) return null;
    const itens: { id: string; readAt: string | null; createdAt: string; notification: { title: string; body: string; route?: string | null } }[] =
      await resposta.json();
    return itens.map((item) => ({
      id: item.id,
      lida: item.readAt !== null,
      criadaEm: item.createdAt,
      titulo: item.notification.title,
      texto: item.notification.body,
      rota: rotaSegura(item.notification.route),
    }));
  } catch {
    return null;
  }
}

export async function contarNaoLidas(): Promise<number | null> {
  const headers = cabecalhos();
  if (!headers) return null;
  try {
    const resposta = await fetchComTimeout(`${API_BASE_URL}/notifications/nao-lidas`, { headers });
    if (!resposta.ok) return null;
    const { total } = await resposta.json();
    return typeof total === "number" ? total : null;
  } catch {
    return null;
  }
}

/** Sem `ids`, marca todas. */
export async function marcarLidas(ids?: string[]) {
  const headers = cabecalhos();
  if (!headers) return;
  try {
    await fetchComTimeout(`${API_BASE_URL}/notifications/lidas`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(ids ? { ids } : {}),
    });
  } finally {
    window.dispatchEvent(new Event(EVENTO));
  }
}

/**
 * Quantas faltam ler, para o selo do menu. Confere ao abrir, ao voltar para o
 * app e a cada cinco minutos com ele aberto.
 */
export function useNaoLidas() {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let vivo = true;
    const conferir = () => {
      void contarNaoLidas().then((n) => {
        if (vivo && n !== null) setTotal(n);
      });
    };
    const aoVoltar = () => {
      if (document.visibilityState === "visible") conferir();
    };
    conferir();
    const relogio = window.setInterval(conferir, 5 * 60 * 1000);
    window.addEventListener(EVENTO, conferir);
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      vivo = false;
      window.clearInterval(relogio);
      window.removeEventListener(EVENTO, conferir);
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, []);

  return total;
}

// ---------------------------------------------------------------- Aviso ao abrir

/** As que já desceram do topo uma vez: fechar o aviso não é o mesmo que ler. */
const CHAVE_DOS_AVISOS = "zc-notificacoes-avisadas";

export function jaAvisadas(): Set<string> {
  try {
    const lista = JSON.parse(localStorage.getItem(CHAVE_DOS_AVISOS) ?? "[]");
    return new Set(Array.isArray(lista) ? lista : []);
  } catch {
    return new Set();
  }
}

export function marcarAvisada(id: string) {
  try {
    const lista = [...jaAvisadas(), id].slice(-50);
    localStorage.setItem(CHAVE_DOS_AVISOS, JSON.stringify(lista));
  } catch {
    // Sem armazenamento, o pior caso é o aviso voltar na próxima abertura.
  }
}
