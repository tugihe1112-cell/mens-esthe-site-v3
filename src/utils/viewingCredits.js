/** 成功した応答だけを期限切れ／閲覧可能へ分類する。失敗は呼び出し元へ返す。 */
export function parseViewingCredits(rows, now = Date.now()) {
  if (!Array.isArray(rows) || rows.length > 1) throw new Error('Invalid viewing credits');
  if (rows.length === 0) return { status: 'expired', days: 0 };
  const row = rows[0];
  const days = Number(row?.credits_days);
  const expiresAt = row?.expires_at;
  if (!row || !['number', 'string'].includes(typeof row.credits_days)
    || String(row.credits_days).trim() === '' || !Number.isFinite(days) || days < 0) {
    throw new Error('Invalid viewing credits');
  }
  const expiry = expiresAt == null ? null : Date.parse(expiresAt);
  if (expiry !== null && !Number.isFinite(expiry)) throw new Error('Invalid viewing expiry');
  // DBの private.has_review_access() と同じく、付与日数の累計ではなく期限で判定する。
  const active = expiry !== null && expiry > now;
  return { status: active ? 'active' : 'expired', days: active ? Math.ceil((expiry - now) / 86400000) : 0 };
}

export async function fetchViewingCredits(url, headers, fetcher = fetch) {
  const response = await fetcher(url, { headers });
  if (!response.ok) throw new Error('Viewing credits request failed');
  const rows = await response.json();
  return { ...parseViewingCredits(rows), expiresAt: rows[0]?.expires_at ?? null };
}
