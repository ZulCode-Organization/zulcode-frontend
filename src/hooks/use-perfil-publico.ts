"use client";

import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";
import { calcularProgressoNivel } from "@/lib/leveling";
import { PerfilUsuario } from "@/lib/types/perfil";

function iniciais(nome: string) {
  return nome.trim().split(/\s+/).slice(0, 2).map((parte) => parte[0] ?? "").join("").toUpperCase();
}

/* eslint-disable @typescript-eslint/no-explicit-any -- a resposta crua da API, convertida campo a campo logo abaixo. */
function paraPerfil(data: any): PerfilUsuario {
  const progresso = calcularProgressoNivel(data.xp, data.nivel);
  return {
    id: data.id, publicCode: data.publicCode, role: "USER", nome: data.name, email: "", iniciais: iniciais(data.name),
    avatarId: data.avatarId, bannerColor: data.bannerColor, isVerified: data.isVerified, themeColor: data.themeColor, themeMode: data.themeMode,
    xp: data.xp, nivel: data.nivel, nivelLabel: data.nivelLabel, xpNivelAtual: progresso.xpNivelAtual, xpNecessarioNivel: progresso.xpNecessarioNivel,
    xpProximoNivel: data.xpProximoNivel, streakAtual: data.currentStreak, streakRecorde: data.longestStreak, podios: data.podios ?? 0,
    seguidores: data.seguidores ?? 0, seguindo: data.seguindo ?? 0, euSigo: !!data.euSigo, membroDesde: data.createdAt ?? null,
    cursosPublicos: Array.isArray(data.cursos) ? data.cursos : [],
    emComum: data.emComum ?? { total: 0, primeiros: [] },
    vidas: null, moedas: null, xpHoje: null, licoesHoje: null,
    conquistas: Array.isArray(data.achievements) ? data.achievements : [],
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** O último perfil buscado de cada pessoa: abrir "Cursos de X" depois do
 *  perfil de X mostra na hora, e a busca nova acontece por baixo. */
const cache = new Map<string, PerfilUsuario>();

/**
 * O perfil público de outra pessoa (GET /user/public/:id), já no formato que
 * as telas do perfil usam. Serve o perfil e as subtelas dele.
 */
export function usePerfilPublico(id: string | undefined) {
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(() => (id ? cache.get(id) ?? null : null));
  const [erro, setErro] = useState(false);

  const carregar = useCallback(() => {
    const token = localStorage.getItem("accessToken");
    if (!token || !id) return;
    setErro(false);
    fetchComTimeout(`${API_BASE_URL}/user/public/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        const novo = paraPerfil(data);
        cache.set(id, novo);
        setPerfil(novo);
      })
      .catch(() => setErro(true));
  }, [id]);

  useEffect(() => {
    // Todo setState aqui vem depois do await; a regra só não enxerga pelo useCallback.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar();
  }, [carregar]);

  return { perfil, erro: erro && !perfil, tentarDeNovo: carregar };
}
