const DEFAULT_UA = 'Mozilla/5.0 (compatible; MensEstheMapImageHealth/1.0)';

export function isImageBytes(bytes, contentType = '') {
  if (!bytes?.length) return false;
  const ascii = Buffer.from(bytes).subarray(0, 64).toString('ascii').trimStart().toLowerCase();
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return true;
  if (Buffer.from(bytes).subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return true;
  if (ascii.startsWith('gif87a') || ascii.startsWith('gif89a')) return true;
  if (ascii.startsWith('riff') && ascii.slice(8, 12) === 'webp') return true;
  if (bytes[0] === 0x42 && bytes[1] === 0x4d) return true;
  if (bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0x01 && bytes[3] === 0x00) return true;
  if (ascii.slice(4, 12).startsWith('ftyp') && /avif|avis|heic|heix|mif1/.test(ascii.slice(8, 32))) return true;
  if (/image\/svg\+xml/i.test(contentType) && (ascii.startsWith('<svg') || ascii.startsWith('<?xml'))) return true;
  return false;
}

async function checkImageBodyOnce(url, { timeoutMs, userAgent }) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': userAgent, Range: 'bytes=0-255', Accept: 'image/*' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok) return { ok: false, status: res.status, contentType, reason: `HTTP ${res.status}` };
    const reader = res.body?.getReader();
    const first = reader ? await reader.read() : { value: new Uint8Array(await res.arrayBuffer()) };
    if (reader) await reader.cancel().catch(() => {});
    const bytes = Buffer.from(first.value || []);
    if (!/^image\//i.test(contentType)) {
      return { ok: false, status: res.status, contentType, reason: `content-type ${contentType || '(empty)'}` };
    }
    if (!isImageBytes(bytes, contentType)) {
      return { ok: false, status: res.status, contentType, reason: 'image signature mismatch' };
    }
    return { ok: true, status: res.status, contentType };
  } catch (error) {
    return { ok: false, status: 0, contentType: '', reason: error?.name || 'fetch failed' };
  }
}

export async function checkImageBody(url, { timeoutMs = 15000, userAgent = DEFAULT_UA, attempts = 3 } = {}) {
  let result;
  for (let attempt = 1; attempt <= Math.max(1, attempts); attempt += 1) {
    result = await checkImageBodyOnce(url, { timeoutMs, userAgent });
    if (result.ok) return result;
    const transient = result.status === 0 || result.status === 408 || result.status === 425 ||
      result.status === 429 || result.status >= 500;
    if (!transient || attempt === attempts) return result;
    await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
  }
  return result;
}

export async function mapConcurrent(items, concurrency, worker, onProgress = null) {
  const results = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
      onProgress?.(index + 1, items.length);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length || 1) }, run));
  return results;
}
