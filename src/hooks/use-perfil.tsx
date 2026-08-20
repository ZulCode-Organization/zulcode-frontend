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

/** Aceita o número só se a API mandou mesmo — qualquer outra coisa vira
 * null, e a tela mostra o ícone sem valor em vez de um zero que o usuário
 * leria como saldo dele. Os dois nomes possíveis estão previstos porque o
 * campo ainda não existe no backend: quando existir, funciona nos dois. */
function numeroOuNulo(...valores: unknown[]): number | null {
  const achado = valores.find((valor) => typeof valor === "number");
  return typeof achado === "number" ? achado : null;
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

/* Um formato só (em vez de união discriminada) porque o projeto roda com
 * strict: false, e sem strictNullChecks o TypeScript não estreita `ok` de
 * forma confiável nos dois ramos do if. */
export interface ResultadoSalvar {
  ok: boolean;
  mensagem?: string;
}

interface PerfilState {
  loading: boolean;
  error: boolean;
  perfil: PerfilUsuario | null;
  cursosEmAndamento: CursoProgresso[];
  cursosConcluidos: CursoProgresso[];
  retry: () => void;
  /** Salva nome e/ou e-mail em PUT /user e atualiza a tela e o cache. */
  salvarDados: (dados: { nome?: string; email?: string }) => Promise<ResultadoSalvar>;
}

/** A API do Nest devolve o motivo em `message`, às vezes como lista (quando
 * são erros de validação de vários campos). Aqui vira uma frase só. */
function mensagemDoErro(corpo: unknown, status: number): string {
  const message = (corpo as { message?: unknown } | null)?.message;
  if (typeof message === "string") return message;
  if (Array.isArray(message) && typeof message[0] === "string") return message.join(". ");
  if (status === 409) return "Esse e-mail já está em uso por outra conta.";
  return "Não deu pra salvar agora. Tente de novo.";
}

interface PerfilCache {
  /** Token dono do cache — se o token da sessão atual for outro (trocou de
   * conta), o cache não vale e busca de novo em vez de vazar dado da conta
   * anterior. */
  token: string;
  perfil: PerfilUsuario;
  cursos: CursoProgresso[];
}

/**
 * Cache em memória do módulo (sobrevive à navegação entre páginas, porque
 * cada rota do App Router remonta o AppShell/PerfilProvider do zero — sem
 * isso, trocar de tela reconsultava GET /user e /languages toda vez). Só se
 * perde num reload de página de verdade, que é quando faz sentido buscar de
 * novo mesmo.
 */
let perfilCache: PerfilCache | null = null;

function getToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
}

function cacheValidoPara(token: string | null): boolean {
  return !!token && perfilCache?.token === token;
}

/** Chamado no logout: sem isso, o cache em memória sobreviveria ao
 * router.replace (não é reload de página) e a próxima conta logada nesse
 * navegador veria por um instante o perfil da conta anterior. */
export function limparPerfilCache() {
  perfilCache = null;
}

function usePerfilData(): PerfilState {
  const cacheOk = cacheValidoPara(getToken());
  const [loading, setLoading] = useState(!cacheOk);
  const [error, setError] = useState(false);
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(cacheOk ? perfilCache!.perfil : null);
  const [cursos, setCursos] = useState<CursoProgresso[]>(cacheOk ? perfilCache!.cursos : []);

  const load = useCallback(() => {
    const token = getToken();
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
        const perfilCarregado: PerfilUsuario = {
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
          vidas: numeroOuNulo(usuario.hearts, usuario.vidas),
          moedas: numeroOuNulo(usuario.coins, usuario.moedas),
          xpHoje: numeroOuNulo(usuario.xpHoje, usuario.xpToday),
          licoesHoje: numeroOuNulo(usuario.licoesHoje, usuario.lessonsToday),
        };
        perfilCache = { token, perfil: perfilCarregado, cursos: cursosData };
        setPerfil(perfilCarregado);
        setCursos(cursosData);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Já tem cache válido (mesmo token) de uma tela anterior: usa ele e nem
    // dispara a requisição.
    if (cacheValidoPara(getToken())) return;
    load();
  }, [load]);

  const salvarDados = useCallback(
    async (dados: { nome?: string; email?: string }): Promise<ResultadoSalvar> => {
      const token = getToken();
      if (!token) return { ok: false, mensagem: "Sua sessão expirou. Entre de novo." };

      try {
        const res = await fetchComTimeout(`${API_BASE_URL}/user`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...authHeaders(token) },
          body: JSON.stringify({
            ...(dados.nome !== undefined ? { name: dados.nome } : {}),
            ...(dados.email !== undefined ? { email: dados.email } : {}),
          }),
        });

        const corpo = await res.json().catch(() => null);
        if (!res.ok) return { ok: false, mensagem: mensagemDoErro(corpo, res.status) };

        // A resposta é o perfil inteiro atualizado: usa o que veio de lá, e
        // só cai no que foi digitado se algum campo não vier.
        const nome = corpo?.name ?? dados.nome;
        const email = corpo?.email ?? dados.email;

        setPerfil((atual) => {
          if (!atual) return atual;
          const atualizado: PerfilUsuario = {
            ...atual,
            nome: nome ?? atual.nome,
            email: email ?? atual.email,
            iniciais: gerarIniciais(nome ?? atual.nome),
          };
          // O cache em memória é o que outras telas leem ao montar — sem
          // atualizar aqui, a sidebar continuaria com o nome antigo.
          if (perfilCache?.token === token) perfilCache = { ...perfilCache, perfil: atualizado };
          return atualizado;
        });

        return { ok: true };
      } catch {
        return { ok: false, mensagem: "Sem conexão com o servidor." };
      }
    },
    []
  );

  const cursosEmAndamento = useMemo(
    () => cursos.filter((curso) => curso.licoesConcluidas < curso.totalLicoes),
    [cursos]
  );
  const cursosConcluidos = useMemo(
    () => cursos.filter((curso) => curso.licoesConcluidas === curso.totalLicoes),
    [cursos]
  );

  return { loading, error, perfil, cursosEmAndamento, cursosConcluidos, retry: load, salvarDados };
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
