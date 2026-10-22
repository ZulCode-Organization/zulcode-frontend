"use client";

import { CSSProperties, ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSincronizarIdioma } from "@/i18n/use-idioma";
import { IDIOMAS, type Idioma } from "@/i18n/idiomas";
import { useSincronizarAvisos } from "@/hooks/use-avisos";
import { useSincronizarWidget } from "@/hooks/use-widget";
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

type Palette = Record<string, string>;

const DEFAULT_PALETTES: { light: Palette; dark: Palette } = {
  light: { "--background": "#f5f8fc", "--foreground": "#0f1115", "--card": "#ffffff", "--card-foreground": "#0f1115", "--popover": "#ffffff", "--popover-foreground": "#0f1115", "--primary": "#1892ff", "--primary-foreground": "#ffffff", "--secondary": "#eaf0f9", "--secondary-foreground": "#151a20", "--muted": "#eaf0f9", "--muted-foreground": "#62707f", "--accent": "#e3f0ff", "--accent-foreground": "#0a63b8", "--border": "#e1e8f0", "--input": "#e1e8f0", "--ring": "#1892ff", "--sidebar": "#ffffff", "--sidebar-foreground": "#0f1115", "--sidebar-primary": "#1892ff", "--sidebar-primary-foreground": "#ffffff", "--sidebar-accent": "#eaf0f9", "--sidebar-accent-foreground": "#151a20" },
  dark: { "--background": "#0f1115", "--foreground": "#f3f6fa", "--card": "#151a20", "--card-foreground": "#f3f6fa", "--popover": "#151a20", "--popover-foreground": "#f3f6fa", "--primary": "#1892ff", "--primary-foreground": "#ffffff", "--secondary": "#1b212a", "--secondary-foreground": "#f3f6fa", "--muted": "#1b212a", "--muted-foreground": "#8b96a5", "--accent": "#1b2a3d", "--accent-foreground": "#6db8ff", "--border": "#232a33", "--input": "#1b212a", "--ring": "#1892ff", "--sidebar": "#151a20", "--sidebar-foreground": "#f3f6fa", "--sidebar-primary": "#1892ff", "--sidebar-primary-foreground": "#ffffff", "--sidebar-accent": "#1b212a", "--sidebar-accent-foreground": "#f3f6fa" },
};

/** Estilo isolado para ver o perfil público no claro ou escuro do dono (as paletas de cor saíram do app). */
export function getProfileThemeStyle(themeMode?: "light" | "dark" | null): CSSProperties {
  const mode = themeMode === "dark" ? "dark" : "light";
  return { ...DEFAULT_PALETTES[mode], colorScheme: mode } as CSSProperties;
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
  /** Busca de novo sem passar por "carregando": os números da tela continuam
   *  lá enquanto a resposta não chega, e só trocam quando ela chega. É o que
   *  deixa a barra animar a diferença em vez de piscar. */
  atualizar: () => void;
  /** Tira o aviso da ofensiva do perfil (na tela e no cache): visto uma vez,
   *  ele não pode voltar ao trocar de tela, que remonta o aviso do zero. */
  esconderAvisoDaOfensiva: () => void;
  /** Salva dados do perfil em PUT /user e atualiza a tela e o cache. */
  salvarDados: (dados: { nome?: string; email?: string; avatarId?: string; bannerColor?: string; themeMode?: "light" | "dark"; statusId?: string | null; idioma?: Idioma; metaDiaria?: number }) => Promise<ResultadoSalvar>;
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

  const load = useCallback((silencioso = false) => {
    const token = getToken();
    if (!token) {
      if (!silencioso) {
        setLoading(false);
        setError(true);
      }
      return;
    }

    if (!silencioso) {
      setLoading(true);
      setError(false);
    }

    Promise.all([
      fetchComTimeout(`${API_BASE_URL}/user`, { headers: authHeaders(token) }).then((res) => {
        if (!res.ok) throw new Error("Falha ao buscar perfil");
        return res.json();
      }),
      buscarCursos(token),
      fetchComTimeout(`${API_BASE_URL}/user/lives`, { headers: authHeaders(token) })
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null),
    ])
      .then(([usuario, cursosData, vidasState]) => {
        // nivel/nivelLabel/xpProximoNivel vêm prontos da API — só a barra de
        // progresso dentro do nível é calculada aqui (ver lib/leveling.ts).
        const progresso = calcularProgressoNivel(usuario.xp, usuario.nivel);
        const perfilCarregado: PerfilUsuario = {
          role: usuario.role,
          isPro: usuario.isPro,
          isDeveloper: usuario.isDeveloper,
          isEarlyTester: usuario.isEarlyTester,
          id: usuario.id,
          publicCode: usuario.publicCode,
          nome: usuario.name,
          email: usuario.email,
          avatarId: usuario.avatarId,
          bannerColor: usuario.bannerColor,
          statusId: usuario.statusId ?? null,
          ultimaAtividade: usuario.lastActivityAt ?? null,
          isVerified: usuario.isVerified ?? false,
          themeColor: usuario.themeColor,
          themeMode: usuario.themeMode,
          idioma: IDIOMAS.includes(usuario.idioma as Idioma) ? (usuario.idioma as Idioma) : null,
          metaDiaria: typeof usuario.dailyGoalMinutes === "number" ? usuario.dailyGoalMinutes : 10,
          iniciais: gerarIniciais(usuario.name),
          xp: usuario.xp,
          nivel: usuario.nivel,
          nivelLabel: usuario.nivelLabel,
          xpNivelAtual: progresso.xpNivelAtual,
          xpNecessarioNivel: progresso.xpNecessarioNivel,
          xpProximoNivel: usuario.xpProximoNivel,
          membroDesde: usuario.createdAt ?? null,
          podios: usuario.podios ?? 0,
          medalhas: Array.isArray(usuario.medalhas) ? usuario.medalhas : [],
          seguidores: usuario.seguidores ?? 0,
          seguindo: usuario.seguindo ?? 0,
          streakAtual: usuario.currentStreak,
          streakRecorde: usuario.longestStreak,
          streakFreezes: usuario.streakFreezes,
          ofensivaAviso: usuario.ofensivaAviso ?? null,
          ofensivaPerfeita: typeof usuario.ofensivaPerfeita === "number" ? usuario.ofensivaPerfeita : 0,
          protectedStreakDays: Array.isArray(usuario.protectedStreakDays) ? usuario.protectedStreakDays : [],
          doubleXpUntil: usuario.doubleXpUntil,
          doubleCoinsUntil: usuario.doubleCoinsUntil ?? null,
          escudos: typeof usuario.errorShields === "number" ? usuario.errorShields : 0,
          vidas: numeroOuNulo(vidasState?.lives, usuario.hearts, usuario.vidas),
          maxVidas: typeof vidasState?.maxLives === "number" ? vidasState.maxLives : 5,
          proximaVidaEm: typeof vidasState?.nextRefillAt === "string" ? vidasState.nextRefillAt : null,
          moedas: numeroOuNulo(usuario.coins, usuario.moedas),
          xpHoje: numeroOuNulo(usuario.xpHoje, usuario.xpToday),
          licoesHoje: numeroOuNulo(usuario.licoesHoje, usuario.lessonsToday),
          minutosHoje: numeroOuNulo(usuario.minutosHoje, usuario.minutesToday),
          conquistas: Array.isArray(usuario.achievements) ? usuario.achievements : [],
        };
        perfilCache = { token, perfil: perfilCarregado, cursos: cursosData };
        setPerfil(perfilCarregado);
        setCursos(cursosData);
      })
      // Em silêncio, uma falha não derruba a tela: os números que estão nela
      // continuam valendo, só não foram renovados.
      .catch(() => { if (!silencioso) setError(true); })
      .finally(() => { if (!silencioso) setLoading(false); });
  }, []);

  const atualizar = useCallback(() => load(true), [load]);

  const esconderAvisoDaOfensiva = useCallback(() => {
    setPerfil((atual) => (atual?.ofensivaAviso ? { ...atual, ofensivaAviso: null } : atual));
    if (perfilCache?.perfil.ofensivaAviso) perfilCache = { ...perfilCache, perfil: { ...perfilCache.perfil, ofensivaAviso: null } };
  }, []);

  useEffect(() => {
    // Já tem cache válido (mesmo token) de uma tela anterior: usa ele e nem
    // dispara a requisição.
    if (cacheValidoPara(getToken())) return;
    load();
  }, [load]);

  // Metas e loja podem conceder moedas sem recarregar a página. O evento é
  // usado por esses fluxos para manter topbar/sidebar sincronizadas na hora.
  useEffect(() => {
    const atualizarMoedas = (event: Event) => {
      const ganho = (event as CustomEvent<number>).detail;
      if (typeof ganho !== "number" || ganho <= 0) return;
      setPerfil((atual) => {
        if (!atual) return atual;
        const atualizado = { ...atual, moedas: (atual.moedas ?? 0) + ganho };
        if (perfilCache?.token === getToken()) perfilCache = { ...perfilCache, perfil: atualizado };
        return atualizado;
      });
    };
    window.addEventListener("zulcode:moedas", atualizarMoedas);
    return () => window.removeEventListener("zulcode:moedas", atualizarMoedas);
  }, []);

  const salvarDados = useCallback(
    async (dados: { nome?: string; email?: string; avatarId?: string; bannerColor?: string; themeMode?: "light" | "dark"; statusId?: string | null; idioma?: Idioma; metaDiaria?: number }): Promise<ResultadoSalvar> => {
      const token = getToken();
      if (!token) return { ok: false, mensagem: "Sua sessão expirou. Entre de novo." };

      try {
        const res = await fetchComTimeout(`${API_BASE_URL}/user`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...authHeaders(token) },
          body: JSON.stringify({
            ...(dados.nome !== undefined ? { name: dados.nome } : {}),
            ...(dados.email !== undefined ? { email: dados.email } : {}),
            ...(dados.avatarId !== undefined ? { avatarId: dados.avatarId } : {}),
            ...(dados.bannerColor !== undefined ? { bannerColor: dados.bannerColor } : {}),
            ...(dados.themeMode !== undefined ? { themeMode: dados.themeMode } : {}),
            ...(dados.statusId !== undefined ? { statusId: dados.statusId } : {}),
            ...(dados.idioma !== undefined ? { idioma: dados.idioma } : {}),
            ...(dados.metaDiaria !== undefined ? { dailyGoalMinutes: dados.metaDiaria } : {}),
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
            avatarId: corpo?.avatarId ?? dados.avatarId ?? atual.avatarId,
            bannerColor: corpo?.bannerColor ?? dados.bannerColor ?? atual.bannerColor,
            themeMode: corpo?.themeMode ?? dados.themeMode ?? atual.themeMode,
            statusId: dados.statusId !== undefined ? dados.statusId : corpo?.statusId ?? atual.statusId,
            idioma: corpo?.idioma ?? dados.idioma ?? atual.idioma,
            metaDiaria: corpo?.dailyGoalMinutes ?? dados.metaDiaria ?? atual.metaDiaria,
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

  return { loading, error, perfil, cursosEmAndamento, cursosConcluidos, retry: () => load(), atualizar, esconderAvisoDaOfensiva, salvarDados };
}

const PerfilContext = createContext<PerfilState | null>(null);

/** Busca o perfil (e o progresso de cursos) uma única vez e compartilha entre todas as telas do app shell. */
export function PerfilProvider({ children }: { children: ReactNode }) {
  const state = usePerfilData();
  useSincronizarIdioma(state.perfil?.idioma, (idioma) => void state.salvarDados({ idioma }), Boolean(state.perfil));
  useSincronizarAvisos(state.perfil);
  useSincronizarWidget(state.perfil);
  return <PerfilContext.Provider value={state}>{children}</PerfilContext.Provider>;
}

export function usePerfil(): PerfilState {
  const ctx = useContext(PerfilContext);
  if (!ctx) {
    throw new Error("usePerfil precisa ser usado dentro de <PerfilProvider>");
  }
  return ctx;
}
