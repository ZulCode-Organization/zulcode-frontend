export type WebFiles = {
  html: string;
  css: string;
  javascript: string;
};

export const PLAYGROUND_CHANNEL = "zulcode-playground";
export const MAX_CODE_LENGTH = 100_000;

export function previewUrl(parentOrigin: string, runId: string) {
  const configured = process.env.NEXT_PUBLIC_PLAYGROUND_PREVIEW_URL?.trim();
  const url = new URL(configured || "/playground-runtime/index.html", parentOrigin);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.username || url.password || url.search || url.hash ||
      !(url.protocol === "https:" || (url.protocol === "http:" && local))) {
    throw new Error("A URL do preview é inválida. Use HTTPS ou localhost em desenvolvimento.");
  }
  url.hash = new URLSearchParams({ parentOrigin, runId }).toString();
  return url.toString();
}
