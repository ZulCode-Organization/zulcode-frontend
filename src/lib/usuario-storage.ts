import { DadosUsuario } from "@/lib/types/usuario";

const STORAGE_KEY = "dados_usuario";

function gerarIniciais(nome: string): string {
  const iniciais = nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");

  return iniciais || "?";
}

export function criarUsuarioNovo(nome: string, email: string): DadosUsuario {
  return {
    nome,
    email,
    iniciais: gerarIniciais(nome),
    nivel: 1,
    nivelLabel: "Iniciante",
    xpAtual: 0,
    xpProximoNivel: 500,
    xpTotal: 0,
    streakDias: 0,
    desafiosCompletos: 0,
    conquistas: [
      { id: "streak_7", titulo: "7 dias seguidos", icone: "flame", desbloqueada: false },
      { id: "xp_100_dia", titulo: "100 XP num dia", icone: "zap", desbloqueada: false },
      { id: "primeiro_desafio", titulo: "1º Desafio", icone: "trophy", desbloqueada: false },
      { id: "nivel_5", titulo: "Nível 5", icone: "star", desbloqueada: false },
      { id: "dez_desafios", titulo: "10 Desafios", icone: "laptop", desbloqueada: false },
      { id: "avancado", titulo: "Avançado", icone: "trending-up", desbloqueada: false },
    ],
  };
}

export function salvarUsuario(usuario: DadosUsuario) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usuario));
}

export function carregarUsuario(): DadosUsuario | null {
  const bruto = localStorage.getItem(STORAGE_KEY);
  if (!bruto) return null;

  try {
    return JSON.parse(bruto) as DadosUsuario;
  } catch {
    return null;
  }
}

export function limparUsuario() {
  localStorage.removeItem(STORAGE_KEY);
}
