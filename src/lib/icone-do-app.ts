"use client";

import { pluginNativo } from "@/lib/plugin-nativo";

/** Os ícones que vêm no APK. Precisa bater com PluginDoIcone.ICONES e com o backend. */
export const ICONES_DO_APP = [
  { id: "padrao", nome: "Padrão" },
  { id: "vampiro", nome: "Vampiro" },
  { id: "biscoito", nome: "Biscoito de gengibre" },
  { id: "derretido", nome: "Derretido" },
  { id: "frankenstein", nome: "Frankenstein" },
] as const;
export type IconeDoApp = (typeof ICONES_DO_APP)[number]["id"];

type Plugin = { trocar(opcoes: { nome: string }): Promise<{ atual: string; pendente: boolean }> };

/**
 * Pede ao app Android o ícone escolhido no admin. A troca de verdade acontece
 * quando o app vai para o fundo (ver PluginDoIcone). No navegador e num APK
 * antigo, sem o plugin, não faz nada.
 */
export async function aplicarIconeDoApp(icone: string) {
  if (!ICONES_DO_APP.some((i) => i.id === icone)) return;
  const nativo = await pluginNativo<Plugin>("IconeDoApp");
  await nativo?.plugin.trocar({ nome: icone }).catch(() => undefined);
}
