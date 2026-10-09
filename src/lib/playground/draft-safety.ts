export type WebDraft = { html: string; css: string; javascript: string; tab: "html" | "css" | "javascript" };
export const DRAFT_KEY = "zulcode:playground-web-draft:v1";
export const LEGACY_DRAFT_KEY = "zulcode:playground-draft";

export function decodeDraft(raw: string, defaults: WebDraft, legacy = false): WebDraft {
  const saved: unknown = JSON.parse(raw);
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) throw new Error("Rascunho inválido.");
  const item = saved as Record<string, unknown>;
  if (typeof item.html !== "string" || typeof item.css !== "string") throw new Error("Arquivos inválidos.");
  let javascript = item.javascript;
  if (legacy && typeof javascript !== "string") {
    const sources = item.sources && typeof item.sources === "object"
      ? item.sources as Record<string, unknown> : {};
    javascript = item.language === "javascript" ? item.source ?? sources.javascript : defaults.javascript;
  }
  if (typeof javascript !== "string") throw new Error("JavaScript inválido.");
  if (!legacy && item.tab !== undefined && (typeof item.tab !== "string" || !["html", "css", "javascript"].includes(item.tab))) {
    throw new Error("Arquivo ativo inválido.");
  }
  return {
    html: item.html, css: item.css, javascript,
    tab: item.tab === "css" || item.tab === "javascript" ? item.tab : "html",
  };
}

export function preserveInvalidDraft(storage: Storage, key: string, raw: string) {
  const backupKey = key + ":recovery:" + crypto.randomUUID();
  storage.setItem(backupKey, raw);
  // O original só poderá ser substituído quando a cópia estiver confirmada.
  if (storage.getItem(backupKey) !== raw) throw new Error("Falha ao preservar o rascunho.");
  return backupKey;
}

export function createDraftSaver(storage: Storage, current: () => WebDraft, allowed: () => boolean) {
  return () => {
    if (!allowed()) return false;
    storage.setItem(DRAFT_KEY, JSON.stringify(current()));
    return true;
  };
}

export function confirmDraftReset(draft: WebDraft, defaults: WebDraft, confirm: (message: string) => boolean) {
  const changed = draft.html !== defaults.html || draft.css !== defaults.css || draft.javascript !== defaults.javascript;
  return !changed || confirm("Restaurar o exemplo substituirá seu HTML, CSS e JavaScript. Deseja continuar?");
}
