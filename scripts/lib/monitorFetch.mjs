const DEFAULT_DELAYS_MS = [750, 2_000];

export function isTransientMonitorStatus(status) {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

function retryDelay(response, fallbackMs) {
  const value = response?.headers?.get?.('retry-after');
  if (!value) return fallbackMs;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.min(5_000, Math.max(fallbackMs, seconds * 1_000));
  const dateMs = Date.parse(value);
  return Number.isFinite(dateMs)
    ? Math.min(5_000, Math.max(fallbackMs, dateMs - Date.now()))
    : fallbackMs;
}

/**
 * 外形監視専用fetch。
 * 一時的なDNS/接続失敗と408/425/429/5xxだけを再試行し、恒久的な4xxは隠さない。
 * retryStatusesには、デプロイ境界で一度だけ確認し直したい404等を追加できる。
 */
export async function fetchWithRetry(url, request = {}, policy = {}) {
  const {
    attempts = 3,
    timeoutMs = 20_000,
    delaysMs = DEFAULT_DELAYS_MS,
    retryStatuses = [],
    fetchImpl = globalThis.fetch,
    sleepImpl = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  } = policy;

  if (!Number.isInteger(attempts) || attempts < 1) throw new Error('attemptsは1以上の整数が必要');

  const extraStatuses = new Set(retryStatuses);
  let lastError = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let response = null;
    try {
      response = await fetchImpl(url, {
        ...request,
        signal: AbortSignal.timeout(timeoutMs),
      });

      const retryable = isTransientMonitorStatus(response.status) || extraStatuses.has(response.status);
      if (!retryable || attempt === attempts) return response;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
    }

    await response?.body?.cancel?.().catch(() => {});
    const fallbackMs = delaysMs[Math.min(attempt - 1, delaysMs.length - 1)] ?? 2_000;
    await sleepImpl(retryDelay(response, fallbackMs));
  }

  const detail = lastError?.cause?.code || lastError?.code || lastError?.name || lastError?.message || 'unknown';
  throw new Error(`監視取得失敗: ${url} (${attempts}回試行 / ${detail})`, { cause: lastError });
}
