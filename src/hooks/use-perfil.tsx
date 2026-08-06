"use client";

import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";
import { calcularProgressoNivel } from "@/lib/leveling";
import { CursoProgresso, PerfilUsuario } from "@/lib/types/perfil";

function gerarIniciais(nome: string): string {
  const iniciais = nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");

  return iniciais || "?";
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

interface LicaoTrack {
  completed: boolean;
}

interface TrackResponse {
  units?: { lessons?: LicaoTrack[] }[];
}

/**
 * Não existe endpoint de "minhas linguagens" no backend, então descobrimos o
 * progresso real do usuário consultando o catálogo público e, para cada
 * linguagem, a trilha autenticada (que já traz o progresso por lição).
 * Linguagens sem nenhuma lição concluída são ignoradas (usuário nunca começou).
 */
async function buscarCursos(token: string): Promise<CursoProgresso[]> {
  const idiomasRes = await fetchComTimeout(`${API_BASE_URL}/languages`);
  if (!idiomasRes.ok) return [];

  const idiomas: { id: string; name: string }[] = await idiomasRes.json();

  const cursos = await Promise.all(
    idiomas.map(async (idioma): Promise<CursoProgresso | null> => {
      try {
        const trackRes = await fetchComTimeout(`${API_BASE_URL}/languages/${idioma.id}/track`, {
          headers: authHeaders(token),
        });
        if (!trackRes.ok) return null;

        const track: TrackResponse = await trackRes.json();
        const licoes = (track.units ?? []).flatMap((unidade) => unidade.lessons ?? []);
        const total = licoes.length;
        const concluidas = licoes.filter((licao) => licao.completed).length;

        if (total === 0 || concluidas === 0) return null;

        return {
          id: idioma.id,
          nome: idioma.name,
          totalLicoes: total,
          licoesConcluidas: concluidas,
          percentual: Math.round((concluidas / total) * 100),
        };
      } catch {
        return null;
      }
    })
  );

  return cursos.filter((curso): curso is CursoProgresso => curso !== null);
}

interface PerfilState {
  loading: boolean;
  error: boolean;
  perfil: PerfilUsuario | null;
  cursosEmAndamento: CursoProgresso[];
  cursosConcluidos: CursoProgresso[];
  retry: () => void;
}

function usePerfilData(): PerfilState {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [cursos, setCursos] = useState<CursoProgresso[]>([]);

  const load = useCallback(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) {
      setLoading(false);
      setError(true);
      return;
    }

    setLoading(true);
    setError(false);

    Promise.all([
      fetchComTimeout(`${API_BASE_URL}/user`, { headers: authHeaders(token) }).then((res) => {
        if (!res.ok) throw new Error("Falha ao buscar perfil");
        return res.json();
      }),
      buscarCursos(token),
    ])
      .then(([usuario, cursosData]) => {
        // nivel/nivelLabel/xpProximoNivel vêm prontos da API — só a barra de
        // progresso dentro do nível é calculada aqui (ver lib/leveling.ts).
        const progresso = calcularProgressoNivel(usuario.xp, usuario.nivel);
        setPerfil({
          nome: usuario.name,
          email: usuario.email,
          iniciais: gerarIniciais(usuario.name),
          xp: usuario.xp,
          nivel: usuario.nivel,
          nivelLabel: usuario.nivelLabel,
          xpNivelAtual: progresso.xpNivelAtual,
          xpNecessarioNivel: progresso.xpNecessarioNivel,
          xpProximoNivel: usuario.xpProximoNivel,
          streakAtual: usuario.currentStreak,
          streakRecorde: usuario.longestStreak,
        });
        setCursos(cursosData);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cursosEmAndamento = useMemo(
    () => cursos.filter((curso) => curso.licoesConcluidas < curso.totalLicoes),
    [cursos]
  );
  const cursosConcluidos = useMemo(
    () => cursos.filter((curso) => curso.licoesConcluidas === curso.totalLicoes),
    [cursos]
  );

  return { loading, error, perfil, cursosEmAndamento, cursosConcluidos, retry: load };
}

const PerfilContext = createContext<PerfilState | null>(null);

/** Busca o perfil (e o progresso de cursos) uma única vez e compartilha entre todas as telas do app shell. */
export function PerfilProvider({ children }: { children: ReactNode }) {
  const state = usePerfilData();
  return <PerfilContext.Provider value={state}>{children}</PerfilContext.Provider>;
}

export function usePerfil(): PerfilState {
  const ctx = useContext(PerfilContext);
  if (!ctx) {
    throw new Error("usePerfil precisa ser usado dentro de <PerfilProvider>");
  }
  return ctx;
}
