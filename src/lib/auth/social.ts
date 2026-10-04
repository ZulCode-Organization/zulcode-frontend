import { API_BASE_URL } from "@/lib/api-config";

export type ProvedorSocial = "github" | "google";

export const NOME_DO_PROVEDOR: Record<ProvedorSocial, string> = {
  github: "GitHub",
  google: "Google",
};

/**
 * Entrada por GitHub ou Google.
 *
 * Não é uma chamada de API: é uma saída do aplicativo. O navegador vai pro
 * backend, o backend manda pro provedor, e no fim a pessoa volta em
 * `/auth/social` com o token do ZulCode. Por isso aqui não há `fetch` nem
 * resposta pra tratar — `assign` e acabou.
 *
 * O caminho inteiro mora no backend de propósito. Fazer a troca do código pelo
 * token aqui exigiria o segredo do provedor dentro do navegador, e segredo em
 * código que qualquer um lê não é segredo.
 */
export function entrarComProvedor(provedor: ProvedorSocial): void {
  window.location.assign(`${API_BASE_URL}/auth/${provedor}`);
}
