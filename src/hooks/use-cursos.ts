"use client";

import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";
import { limparTrilhaCache } from "./use-trilha";

export interface CursoDaJornada { id: string; name: string; icon: string; }

interface EstadoCursos {
  cursos: CursoDaJornada[];
  cursoAtual: string | null;
  loading: boolean;
}

/**
 * Catálogo de cursos + curso atual, compartilhado entre a barra de status e a
 * Jornada. Antes isso vivia dentro do useJornada, que só a tela da Jornada
 * usava; agora o seletor de curso mora no topo do app inteiro, e sem um lugar
 * único os dois refariam GET /languages e /languages/current em toda página.
 *
 * As chamadas são exatamente as mesmas de antes (mesma rota, mesmo método,
 * mesmo header) — só o lugar onde o resultado é guardado mudou.
 */
let estado: EstadoCursos = { cursos: [], cursoAtual: null, loading: true };
/** Token dono do cache: se a sessão trocar de conta, busca de novo em vez de
 * mostrar o curso da conta anterior (mesmo cuidado do cache do perfil). */
let tokenDoCache: string | null = null;
let buscaEmAndamento: Promise<void> | null = null;
const ouvintes = new Set<() => void>();

function emitir(parcial: Partial<EstadoCursos>) {
  estado = { ...estado, ...parcial };
  ouvintes.forEach((avisar) => avisar());
}

function getToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
}

function carregar(token: string): Promise<void> {
  if (buscaEmAndamento && tokenDoCache === token) return buscaEmAndamento;
  tokenDoCache = token;
  emitir({ loading: true });

  buscaEmAndamento = Promise.all([
    fetchComTimeout(`${API_BASE_URL}/languages`).then((r) => r.json()),
    fetchComTimeout(`${API_BASE_URL}/languages/current`, { headers: { Authorization: `Bearer ${token}` } }).then(async (r) => {
      if (!r.ok || r.status === 204) return null;
      const body = await r.text();
      return body ? JSON.parse(body) : null;
    }),
  ])
    .then(([disponiveis, atual]) => {
      const lista: CursoDaJornada[] = Array.isArray(disponiveis) ? disponiveis : [];
      emitir({ cursos: lista, cursoAtual: atual?.id ?? lista[0]?.id ?? null, loading: false });
    })
    .catch(() => emitir({ cursoAtual: null, loading: false }))
    .finally(() => { buscaEmAndamento = null; });

  return buscaEmAndamento;
}

/** Chamado no logout junto com os outros caches em memória. */
export function limparCursosCache() {
  estado = { cursos: [], cursoAtual: null, loading: true };
  tokenDoCache = null;
  buscaEmAndamento = null;
  ouvintes.forEach((avisar) => avisar());
}

export function useCursos() {
  const [, forcarRender] = useState(0);

  useEffect(() => {
    const avisar = () => forcarRender((n) => n + 1);
    ouvintes.add(avisar);
    const token = getToken();
    if (!token) emitir({ loading: false });
    else if (tokenDoCache !== token || (!estado.cursoAtual && !buscaEmAndamento)) carregar(token);
    return () => { ouvintes.delete(avisar); };
  }, []);

  /** PATCH /languages/:slug/current — mesma chamada de sempre. O cache da
   * trilha é limpo junto porque a Jornada precisa recarregar no curso novo. */
  const selecionarCurso = useCallback(async (slug: string) => {
    const token = getToken();
    if (!token || slug === estado.cursoAtual) return;
    const res = await fetchComTimeout(`${API_BASE_URL}/languages/${slug}/current`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok || res.status === 202) { limparTrilhaCache(); emitir({ cursoAtual: slug }); }
  }, []);

  return { cursos: estado.cursos, cursoAtual: estado.cursoAtual, loading: estado.loading, selecionarCurso };
}
