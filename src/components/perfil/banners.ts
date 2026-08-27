import { PerfilUsuario } from "@/lib/types/perfil";

/** Cores lisas de capa, disponíveis pra qualquer conta. */
export const CORES_CAPA = [
  { id: "verde", label: "Verde", valor: "#22c55e" },
  { id: "vermelho", label: "Vermelho", valor: "#ef4444" },
  { id: "azul", label: "Azul", valor: "#3b82f6" },
  { id: "azul-escuro", label: "Azul escuro", valor: "#1e3a8a" },
  { id: "laranja", label: "Amarelo laranja", valor: "#f59e0b" },
  { id: "rosa", label: "Rosa", valor: "#ec4899" },
  { id: "roxo", label: "Roxo", valor: "#8b5cf6" },
] as const;

export const BANNER_DEV = "linear-gradient(135deg, #042f2e, #0f766e, #2dd4bf)";
export const BANNER_TESTER = "linear-gradient(135deg, #172554, #2563eb, #60a5fa)";
export const BANNER_PRO = "linear-gradient(135deg, #7c3aed, #d946ef 55%, #f0abfc)";
export const BANNER_RICHARD = "linear-gradient(135deg, #111827, #1e3a8a 52%, #38bdf8)";

/**
 * Banners que vêm de selo, não de compra. `requer` é o campo do perfil que
 * libera cada um — o do Richard é a exceção, liberado por conquista, e quem
 * usa a lista trata esse caso.
 */
export const BANNERS_ESPECIAIS: {
  id: string;
  name: string;
  gradient: string;
  requer: keyof PerfilUsuario;
}[] = [
  { id: "pro-banner", name: "Banner PRO", gradient: BANNER_PRO, requer: "isPro" },
  { id: "developer-banner", name: "Banner Desenvolvedor", gradient: BANNER_DEV, requer: "isDeveloper" },
  { id: "early-tester-banner", name: "Banner Pioneiro", gradient: BANNER_TESTER, requer: "isEarlyTester" },
  { id: "richard-tribute-banner", name: "Banner Richard", gradient: BANNER_RICHARD, requer: "id" },
];
