import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";
import type { EfeitoDoItem } from "@/components/shared/icone-do-item";

/**
 * O catálogo da loja, dividido entre a loja e o editor do perfil.
 *
 * Os dois leem a mesma entrada guardada (useDadosGuardados com CHAVE_DA_LOJA):
 * comprar uma moldura no editor já aparece como "Em uso" na loja, e o
 * contrário também.
 */

export type ItemDaLoja = {
  id: string;
  title: string;
  description: string;
  price: number;
  effect: EfeitoDoItem;
};

export type TipoDeCosmetico = "THEME" | "AVATAR" | "BANNER" | "FRAME";

export type Cosmetico = {
  id: string;
  name: string;
  description: string;
  kind: TipoDeCosmetico;
  price: number;
  owned: boolean;
  equipped?: boolean;
  /** Fora da loja: só aparece para quem ganhou da equipe (eventos, prêmios). */
  exclusive?: boolean;
  value: {
    primary?: string;
    accent?: string;
    gradient?: string;
    /** O fundo pronto da capa (quando ela é uma imagem). Vale antes do gradient. */
    background?: string;
    imageUrl?: string;
    avatarId?: string;
    molduraId?: string;
  };
};

export type Transacao = { id: string; amount: number; reason: string };

export type Catalogo = { items: ItemDaLoja[]; cosmetics: Cosmetico[]; transactions: Transacao[] };

export const CHAVE_DA_LOJA = "loja";

export const SEM_CATALOGO: Catalogo = { items: [], cosmetics: [], transactions: [] };

/** Guardado entre visitas (useDadosGuardados): voltar à loja mostra tudo na hora e atualiza por trás. */
export async function buscarCatalogo(token: string): Promise<Catalogo> {
  const headers = { Authorization: `Bearer ${token}` };
  const [a, b, c] = await Promise.all([
    fetchComTimeout(`${API_BASE_URL}/user/zulcoins/items`, { headers }),
    fetchComTimeout(`${API_BASE_URL}/user/zulcoins/cosmetics`, { headers }),
    fetchComTimeout(`${API_BASE_URL}/user/zulcoins/history`, { headers }),
  ]);
  if (!a.ok && !b.ok && !c.ok) throw new Error("Falha ao carregar a loja");
  const cosmetics: Cosmetico[] = b.ok ? await b.json() : [];
  return {
    items: a.ok ? await a.json() : [],
    cosmetics: cosmetics.map((item) => ({ ...item, kind: String(item.kind).toUpperCase() as TipoDeCosmetico })),
    transactions: c.ok ? ((await c.json()).transactions ?? []) : [],
  };
}

/** O fundo de uma capa da loja, do jeito que ele vai no bannerColor do perfil. */
export function fundoDaCapa(cosmetico: Cosmetico) {
  return cosmetico.value.background ?? cosmetico.value.gradient ?? null;
}
