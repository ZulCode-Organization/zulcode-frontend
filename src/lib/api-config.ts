import { accountKey, cacheApiResponse, getCachedApiResponse, getQueuedMutations, queueMutation, removeQueuedMutation } from "@/lib/offline-store";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";
export const REQUEST_TIMEOUT_MS = 15000;

function tokenFrom(init: RequestInit) {
  const headers = new Headers(init.headers);
  return headers.get("Authorization")?.replace(/^Bearer\\s+/i, "") ?? (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null);
}

function cacheKey(input: string, init: RequestInit) { return `${accountKey(tokenFrom(init))}:${input}`; }

function canQueue(method: string, url: string) {
  if (method === "POST" && /\/user\/lives\/use$/.test(url)) return true;
  if (method === "PATCH" && /\/languages\/[^/]+\/current$/.test(url)) return true;
  if (method === "PUT" && /\/user$/.test(url)) return true;
  return method === "POST" && (/\/lessons\/[^/]+\/(?:theory-complete|complete)$/.test(url) || /\/lessons\/[^/]+\/stages\/\d+\/complete$/.test(url));
}

async function fetchWithTimeout(input: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(input, { ...init, signal: controller.signal }); }
  finally { clearTimeout(timeoutId); }
}

function notifyQueue() { if (typeof window !== "undefined") window.dispatchEvent(new Event("zulcode:offline-queue")); }

/** Caches reads per account and queues only mutations that are safe to replay. */
export async function fetchComTimeout(input: string, init: RequestInit = {}, timeoutMs: number = REQUEST_TIMEOUT_MS): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  const key = cacheKey(input, init);
  try {
    const response = await fetchWithTimeout(input, init, timeoutMs);
    if (method === "GET" && response.ok && typeof window !== "undefined" && !/\/leaderboard(?:[/?]|$)/.test(input)) {
      const body = await response.clone().text();
      await cacheApiResponse(key, body, response.headers.get("content-type") ?? "application/json");
    }
    return response;
  } catch (error) {
    if (method === "GET" && !/\/leaderboard(?:[/?]|$)/.test(input)) {
      const cached = await getCachedApiResponse(key);
      if (cached) return new Response(cached.body, { status: 200, headers: { "content-type": cached.contentType, "X-Zulcode-Offline": "cache" } });
    }
    if (typeof window !== "undefined" && canQueue(method, input) && tokenFrom(init)) {
      await queueMutation({ id: crypto.randomUUID(), method, url: input, body: typeof init.body === "string" ? init.body : undefined, owner: accountKey(tokenFrom(init)), createdAt: Date.now() });
      notifyQueue();
      return new Response(JSON.stringify({ queued: true, offline: true }), { status: 202, headers: { "content-type": "application/json", "X-Zulcode-Offline": "queued" } });
    }
    throw error;
  }
}

export async function getQueuedActionsCount() {
  if (typeof window === "undefined") return 0;
  return (await getQueuedMutations(accountKey(localStorage.getItem("accessToken")))).length;
}

/** Replays safe, idempotent actions in chronological order once a connection returns. */
export async function flushOfflineQueue() {
  if (typeof window === "undefined" || !navigator.onLine) return;
  const token = localStorage.getItem("accessToken");
  if (!token) return;
  for (const action of await getQueuedMutations(accountKey(token))) {
    try {
      const response = await fetchWithTimeout(action.url, { method: action.method, headers: { Authorization: `Bearer ${token}`, ...(action.body ? { "Content-Type": "application/json" } : {}) }, ...(action.body ? { body: action.body } : {}) }, REQUEST_TIMEOUT_MS);
      if (response.ok || (response.status >= 400 && response.status < 500)) await removeQueuedMutation(action.id);
      else break;
    } catch { break; }
  }
  notifyQueue();
}
