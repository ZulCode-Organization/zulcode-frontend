"use client";

import { CSSProperties, ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
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

// Cada tema troca todos os tokens visuais, como o seletor claro/escuro faz.
// `themeColor` guarda a cor primária do cosmético comprado, que identifica a
// paleta mesmo depois de fechar e abrir o app.
const THEME_PALETTES: Record<string, { light: Palette; dark: Palette }> = {
  "#0f766e": {
    light: { "--background": "#f0fdfa", "--foreground": "#102a2a", "--card": "#ffffff", "--card-foreground": "#102a2a", "--popover": "#ffffff", "--popover-foreground": "#102a2a", "--primary": "#0f766e", "--primary-foreground": "#ffffff", "--secondary": "#ccfbf1", "--secondary-foreground": "#102a2a", "--muted": "#e6fffb", "--muted-foreground": "#4b7773", "--accent": "#c5f5ed", "--accent-foreground": "#115e59", "--border": "#a7e8df", "--input": "#a7e8df", "--ring": "#0f766e", "--sidebar": "#f8fffe", "--sidebar-foreground": "#102a2a", "--sidebar-primary": "#0f766e", "--sidebar-primary-foreground": "#ffffff", "--sidebar-accent": "#ccfbf1", "--sidebar-accent-foreground": "#115e59" },
    dark: { "--background": "#042f2e", "--foreground": "#e6fffb", "--card": "#0b4542", "--card-foreground": "#e6fffb", "--popover": "#0b4542", "--popover-foreground": "#e6fffb", "--primary": "#2dd4bf", "--primary-foreground": "#042f2e", "--secondary": "#115e59", "--secondary-foreground": "#e6fffb", "--muted": "#115e59", "--muted-foreground": "#9ad8d0", "--accent": "#134e4a", "--accent-foreground": "#99f6e4", "--border": "#176d67", "--input": "#176d67", "--ring": "#2dd4bf", "--sidebar": "#063b39", "--sidebar-foreground": "#e6fffb", "--sidebar-primary": "#2dd4bf", "--sidebar-primary-foreground": "#042f2e", "--sidebar-accent": "#115e59", "--sidebar-accent-foreground": "#e6fffb" },
  },
  "#2563eb": {
    light: { "--background": "#f5f8ff", "--foreground": "#102052", "--card": "#ffffff", "--card-foreground": "#102052", "--popover": "#ffffff", "--popover-foreground": "#102052", "--primary": "#2563eb", "--primary-foreground": "#ffffff", "--secondary": "#dbeafe", "--secondary-foreground": "#102052", "--muted": "#eff6ff", "--muted-foreground": "#53719c", "--accent": "#dbeafe", "--accent-foreground": "#1d4ed8", "--border": "#bfd7ff", "--input": "#bfd7ff", "--ring": "#2563eb", "--sidebar": "#f9fbff", "--sidebar-foreground": "#102052", "--sidebar-primary": "#2563eb", "--sidebar-primary-foreground": "#ffffff", "--sidebar-accent": "#dbeafe", "--sidebar-accent-foreground": "#1d4ed8" },
    dark: { "--background": "#172554", "--foreground": "#eff6ff", "--card": "#1e3a78", "--card-foreground": "#eff6ff", "--popover": "#1e3a78", "--popover-foreground": "#eff6ff", "--primary": "#60a5fa", "--primary-foreground": "#172554", "--secondary": "#1e40af", "--secondary-foreground": "#eff6ff", "--muted": "#1e40af", "--muted-foreground": "#b6d5ff", "--accent": "#1e3a8a", "--accent-foreground": "#bfdbfe", "--border": "#2852a8", "--input": "#2852a8", "--ring": "#60a5fa", "--sidebar": "#192e65", "--sidebar-foreground": "#eff6ff", "--sidebar-primary": "#60a5fa", "--sidebar-primary-foreground": "#172554", "--sidebar-accent": "#1e40af", "--sidebar-accent-foreground": "#eff6ff" },
  },
  "#0284c7": {
    light: { "--background": "#eef8ff", "--foreground": "#0b2235", "--card": "#ffffff", "--card-foreground": "#0b2235", "--popover": "#ffffff", "--popover-foreground": "#0b2235", "--primary": "#0284c7", "--primary-foreground": "#ffffff", "--secondary": "#dff1fc", "--secondary-foreground": "#0b2235", "--muted": "#e8f5fc", "--muted-foreground": "#527187", "--accent": "#cceeff", "--accent-foreground": "#075985", "--border": "#b9e1f5", "--input": "#b9e1f5", "--ring": "#0284c7", "--sidebar": "#f8fcff", "--sidebar-foreground": "#0b2235", "--sidebar-primary": "#0284c7", "--sidebar-primary-foreground": "#ffffff", "--sidebar-accent": "#dff1fc", "--sidebar-accent-foreground": "#0b2235" },
    dark: { "--background": "#061923", "--foreground": "#e5f6ff", "--card": "#0b2635", "--card-foreground": "#e5f6ff", "--popover": "#0b2635", "--popover-foreground": "#e5f6ff", "--primary": "#22b7ef", "--primary-foreground": "#04202e", "--secondary": "#123746", "--secondary-foreground": "#e5f6ff", "--muted": "#123746", "--muted-foreground": "#8bb6c9", "--accent": "#123f55", "--accent-foreground": "#8de0ff", "--border": "#1b4658", "--input": "#1b4658", "--ring": "#22b7ef", "--sidebar": "#08212e", "--sidebar-foreground": "#e5f6ff", "--sidebar-primary": "#22b7ef", "--sidebar-primary-foreground": "#04202e", "--sidebar-accent": "#123746", "--sidebar-accent-foreground": "#e5f6ff" },
  },
  "#f97316": {
    light: { "--background": "#fff7ed", "--foreground": "#2c1607", "--card": "#fffdf9", "--card-foreground": "#2c1607", "--popover": "#fffdf9", "--popover-foreground": "#2c1607", "--primary": "#f97316", "--primary-foreground": "#ffffff", "--secondary": "#ffead5", "--secondary-foreground": "#2c1607", "--muted": "#fff0e1", "--muted-foreground": "#8a6248", "--accent": "#ffe0c2", "--accent-foreground": "#b3440a", "--border": "#f5d1b1", "--input": "#f5d1b1", "--ring": "#f97316", "--sidebar": "#fffaf4", "--sidebar-foreground": "#2c1607", "--sidebar-primary": "#f97316", "--sidebar-primary-foreground": "#ffffff", "--sidebar-accent": "#ffead5", "--sidebar-accent-foreground": "#2c1607" },
    dark: { "--background": "#211108", "--foreground": "#fff0df", "--card": "#321a0d", "--card-foreground": "#fff0df", "--popover": "#321a0d", "--popover-foreground": "#fff0df", "--primary": "#fb923c", "--primary-foreground": "#341305", "--secondary": "#48230f", "--secondary-foreground": "#fff0df", "--muted": "#48230f", "--muted-foreground": "#d5a27c", "--accent": "#542713", "--accent-foreground": "#ffc28f", "--border": "#643018", "--input": "#643018", "--ring": "#fb923c", "--sidebar": "#281407", "--sidebar-foreground": "#fff0df", "--sidebar-primary": "#fb923c", "--sidebar-primary-foreground": "#341305", "--sidebar-accent": "#48230f", "--sidebar-accent-foreground": "#fff0df" },
  },
  "#a855f7": {
    light: { "--background": "#fbf7ff", "--foreground": "#21102f", "--card": "#ffffff", "--card-foreground": "#21102f", "--popover": "#ffffff", "--popover-foreground": "#21102f", "--primary": "#a855f7", "--primary-foreground": "#ffffff", "--secondary": "#f2e7ff", "--secondary-foreground": "#21102f", "--muted": "#f6efff", "--muted-foreground": "#76588f", "--accent": "#eedcff", "--accent-foreground": "#7e22ce", "--border": "#e5c9ff", "--input": "#e5c9ff", "--ring": "#a855f7", "--sidebar": "#fdfaff", "--sidebar-foreground": "#21102f", "--sidebar-primary": "#a855f7", "--sidebar-primary-foreground": "#ffffff", "--sidebar-accent": "#f2e7ff", "--sidebar-accent-foreground": "#21102f" },
    dark: { "--background": "#180b25", "--foreground": "#f8efff", "--card": "#261038", "--card-foreground": "#f8efff", "--popover": "#261038", "--popover-foreground": "#f8efff", "--primary": "#c084fc", "--primary-foreground": "#2a0c45", "--secondary": "#391850", "--secondary-foreground": "#f8efff", "--muted": "#391850", "--muted-foreground": "#c8a8dd", "--accent": "#492064", "--accent-foreground": "#e5c4ff", "--border": "#552875", "--input": "#552875", "--ring": "#c084fc", "--sidebar": "#200d31", "--sidebar-foreground": "#f8efff", "--sidebar-primary": "#c084fc", "--sidebar-primary-foreground": "#2a0c45", "--sidebar-accent": "#391850", "--sidebar-accent-foreground": "#f8efff" },
  },
};

const DEFAULT_PALETTES: { light: Palette; dark: Palette } = {
  light: { "--background": "#f5f8fc", "--foreground": "#0f1115", "--card": "#ffffff", "--card-foreground": "#0f1115", "--popover": "#ffffff", "--popover-foreground": "#0f1115", "--primary": "#1892ff", "--primary-foreground": "#ffffff", "--secondary": "#eaf0f9", "--secondary-foreground": "#151a20", "--muted": "#eaf0f9", "--muted-foreground": "#62707f", "--accent": "#e3f0ff", "--accent-foreground": "#0a63b8", "--border": "#e1e8f0", "--input": "#e1e8f0", "--ring": "#1892ff", "--sidebar": "#ffffff", "--sidebar-foreground": "#0f1115", "--sidebar-primary": "#1892ff", "--sidebar-primary-foreground": "#ffffff", "--sidebar-accent": "#eaf0f9", "--sidebar-accent-foreground": "#151a20" },
  dark: { "--background": "#0f1115", "--foreground": "#f3f6fa", "--card": "#151a20", "--card-foreground": "#f3f6fa", "--popover": "#151a20", "--popover-foreground": "#f3f6fa", "--primary": "#1892ff", "--primary-foreground": "#ffffff", "--secondary": "#1b212a", "--secondary-foreground": "#f3f6fa", "--muted": "#1b212a", "--muted-foreground": "#8b96a5", "--accent": "#1b2a3d", "--accent-foreground": "#6db8ff", "--border": "#232a33", "--input": "#1b212a", "--ring": "#1892ff", "--sidebar": "#151a20", "--sidebar-foreground": "#f3f6fa", "--sidebar-primary": "#1892ff", "--sidebar-primary-foreground": "#ffffff", "--sidebar-accent": "#1b212a", "--sidebar-accent-foreground": "#f3f6fa" },
};

/** Estilo isolado para visualizar o perfil público no tema do dono. */
export function getProfileThemeStyle(themeColor?: string | null, themeMode?: "light" | "dark" | null): CSSProperties {
  const mode = themeMode === "dark" ? "dark" : "light";
  const palette = (themeColor && THEME_PALETTES[themeColor.toLowerCase()]) ?? DEFAULT_PALETTES;
  return { ...palette[mode], colorScheme: mode } as CSSProperties;
}

function applyThemePalette(themeColor: string | null | undefined) {
  const root = document.documentElement;
  const palette = themeColor ? THEME_PALETTES[themeColor.toLowerCase()] : undefined;
  const variables = Object.values(THEME_PALETTES).flatMap((item) => Object.keys(item.light));
  variables.forEach((variable) => root.style.removeProperty(variable));
  if (!palette) {
    if (themeColor?.toLowerCase() === "#0f766e") {
      root.style.setProperty("--primary", root.classList.contains("dark") ? "#2dd4bf" : "#0f766e");
      root.style.setProperty("--ring", root.classList.contains("dark") ? "#2dd4bf" : "#0f766e");
      root.style.setProperty("--accent", root.classList.contains("dark") ? "#134e4a" : "#ccfbf1");
    }
    return;
  }
  const colors = root.classList.contains("dark") ? palette.dark : palette.light;
  Object.entries(colors).forEach(([variable, color]) => root.style.setProperty(variable, color));
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
  /** Salva dados do perfil em PUT /user e atualiza a tela e o cache. */
  salvarDados: (dados: { nome?: string; email?: string; avatarId?: string; bannerColor?: string; themeMode?: "light" | "dark"; statusId?: string | null }) => Promise<ResultadoSalvar>;
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
          isVerified: usuario.isVerified ?? false,
          themeColor: usuario.themeColor,
          themeMode: usuario.themeMode,
          iniciais: gerarIniciais(usuario.name),
          xp: usuario.xp,
          nivel: usuario.nivel,
          nivelLabel: usuario.nivelLabel,
          xpNivelAtual: progresso.xpNivelAtual,
          xpNecessarioNivel: progresso.xpNecessarioNivel,
          xpProximoNivel: usuario.xpProximoNivel,
          membroDesde: usuario.createdAt ?? null,
          streakAtual: usuario.currentStreak,
          streakRecorde: usuario.longestStreak,
          streakFreezes: usuario.streakFreezes,
          protectedStreakDays: Array.isArray(usuario.protectedStreakDays) ? usuario.protectedStreakDays : [],
          doubleXpUntil: usuario.doubleXpUntil,
          vidas: numeroOuNulo(vidasState?.lives, usuario.hearts, usuario.vidas),
          moedas: numeroOuNulo(usuario.coins, usuario.moedas),
          xpHoje: numeroOuNulo(usuario.xpHoje, usuario.xpToday),
          licoesHoje: numeroOuNulo(usuario.licoesHoje, usuario.lessonsToday),
          conquistas: Array.isArray(usuario.achievements) ? usuario.achievements : [],
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

  // O tema comprado aplica uma paleta inteira e reaplica as cores quando o
  // usuário alterna entre claro e escuro.
  useEffect(() => {
    applyThemePalette(perfil?.themeColor);
    const observer = new MutationObserver(() => applyThemePalette(perfil?.themeColor));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => {
      observer.disconnect();
      applyThemePalette(null);
    };
  }, [perfil?.themeColor]);

  const salvarDados = useCallback(
    async (dados: { nome?: string; email?: string; avatarId?: string; bannerColor?: string; themeMode?: "light" | "dark"; statusId?: string | null }): Promise<ResultadoSalvar> => {
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
