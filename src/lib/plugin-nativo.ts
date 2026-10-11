"use client";

/**
 * Um plugin nativo do app Android, ou `null` fora dele (navegador) e num APK
 * que ainda não o tem.
 *
 * Vem embrulhado em `{ plugin }` de propósito. O objeto que o Capacitor devolve
 * responde a qualquer propriedade — inclusive `then` —, e devolvê-lo direto de
 * uma função async faz a promessa tratá-lo como outra promessa: ela chama um
 * método nativo `then`, que não existe, e falha. Foi isso que deixou o widget e
 * os avisos mudos.
 */
/** O Capacitor só aceita registrar cada plugin uma vez: o registro fica guardado. */
const registrados = new Map<string, { plugin: unknown }>();

export async function pluginNativo<T>(nome: string): Promise<{ plugin: T } | null> {
  const ja = registrados.get(nome);
  if (ja) return ja as { plugin: T };
  try {
    const { Capacitor, registerPlugin } = await import("@capacitor/core");
    if (Capacitor.getPlatform() !== "android" || !Capacitor.isPluginAvailable(nome)) return null;
    const embrulho = { plugin: registerPlugin<T>(nome) };
    registrados.set(nome, embrulho);
    return embrulho;
  } catch {
    return null;
  }
}
