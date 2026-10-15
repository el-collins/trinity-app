export interface RetryOptions {
  retries?: number;
  timeoutMs?: number;
  baseDelayMs?: number;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function backoffMs(attempt: number, base: number, retryAfter: string | null): number {
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0) return Math.min(seconds * 1000, 5000);
  }
  const exp = base * 2 ** (attempt - 1);
  const jitter = Math.random() * base;
  return Math.min(exp + jitter, 5000);
}

export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  opts: RetryOptions = {}
): Promise<{ response: Response; attempts: number }> {
  const retries = opts.retries ?? 2;
  const timeoutMs = opts.timeoutMs ?? 30000;
  const baseDelayMs = opts.baseDelayMs ?? 500;
  const fetchImpl = opts.fetchImpl ?? fetch;
  const sleep = opts.sleep ?? defaultSleep;

  let lastError: unknown;
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(url, { ...init, signal: controller.signal });
      clearTimeout(timer);
      if (isRetryableStatus(response.status) && attempt <= retries) {
        await sleep(backoffMs(attempt, baseDelayMs, response.headers.get('retry-after')));
        continue;
      }
      return { response, attempts: attempt };
    } catch (error) {
      clearTimeout(timer);
      lastError = error;
      if (attempt <= retries) {
        await sleep(backoffMs(attempt, baseDelayMs, null));
        continue;
      }
    }
  }
  if (lastError instanceof Error && lastError.name === 'AbortError') {
    throw new Error(`Request timed out after ${timeoutMs / 1000} seconds (${retries + 1} attempts)`);
  }
  throw lastError instanceof Error ? lastError : new Error('Request failed');
}
