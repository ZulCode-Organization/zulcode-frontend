export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

export const REQUEST_TIMEOUT_MS = 15000;

export async function fetchComTimeout(
  input: string,
  init: RequestInit = {},
  timeoutMs: number = REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}
